/**
 * Source: log.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging API implementation
 */

/*
 * TODO Allow default appenders to be constructed based on config from server
 */

/**
 * @namespace Aperture logging API. Multiple appenders can be added to log to different
 * destinations at a specified minimum log level. The logWindowErrors function can be 
 * configured to log unhandled JavaScript errors as well. Logging can be configured
 * in the aperture config file (<a href="#constructor">see example</a>) or programmatically.
 * 
 * @example 
 * // example aperture config file section 
 * aperture.log : {
 *   level : 'info',
 *   logWindowErrors : {log: true, preventDefault: true},
 *     appenders : {
 *       consoleAppender : {level: 'info'},
 *       notifyAppender : {level: 'error'}
 *   }
 * }
 */
aperture.log = (function() {

		/**
		 * @class Logging level definitions
		 * @name aperture.log.LEVEL
		 */
	var LEVEL =
		/** @lends aperture.log.LEVEL */
		{
			/** @constant
			 *  @description Error logging level */
			ERROR: 'error',
			/** @constant
			 *  @description Warn logging level */
			WARN: 'warn',
			/** @constant
			 *  @description Info logging level */
			INFO: 'info',
			/** @constant
			 *  @description Debug logging level */
			DEBUG: 'debug',
			/** @constant
			 *  @description 'Log' logging level */
			LOG: 'log',
			/** @constant
			 *  @description Turn off logging */
			NONE: 'none'
		},

		levelOrder = {
			'error': 5,
			'warn': 4,
			'info': 3,
			'debug': 2,
			'log': 1,
			'none': 0
		},


		// The list of active appenders
		appenders = [],

		// The global logging level
		globalLevel = LEVEL.INFO,

		// Log window errors too.
		logWinErrs = false,
		eatWinErrs = false,
		otherWinErrHandler,
		
		// The current indentation level.
		prefix = '',
		eightSpaces = '        ',
		
		
		/**
		 * @private
		 * Internal function that takes a format string and additional arguments
		 * and returns a single formatted string.  Essentially a cheap version of
		 * sprintf.  Parameters are referenced within the format string using {#}
		 * where # is the parameter index number, starting with 0.  Parameter references
		 * may be repeated and may be in any order within the format string.
		 *
		 * Example:
		 * <pre>
		 * formatString('{0} is fun - use {0} more. {1} is boring', 'JavaScript', 'C');
		 * </pre>
		 *
		 */
		formatString = function(message /*, params */) {
			// Extract all but first arg (message)
			var args = Array.prototype.slice.call(arguments, 1);
			// Return string with all {digit} replaced with value from argument
			return prefix + message.replace(/\{(\d+)\}/g, function(match, number) {
				return typeof args[number] != 'undefined' ?
					args[number] :
					'{' + number + '}';
			});
		},



		Appender = aperture.Class.extend( 'aperture.log.Appender',
		/** @lends aperture.log.Appender# */
		{
			/**
			 * @class Logging Appender base class.<br><br>
			 *
			 * @constructs
			 * @param {aperture.log.LEVEL} level The logging level threshold for this appender
			 */
			init : function(level) {
				this.level = level || LEVEL.WARN;
			},

			/**
			 * Sets or gets the current global logging level
			 * @param {aperture.log.LEVEL} [l] the new appender level threshold.  If value given, the
			 * threshold level is not changed and the current value is returned
			 * @param the current appender level threshold
			 */
			level : function(l) {
				if( l !== undefined ) {
					// Set new level if given one
					this.level = l;
				}
				// Return current level
				return this.level;
			},

			/**
			 * Log function called by the logging framework requesting that the
			 * appender handle the given data.  In general this function should
			 * not be overridden by sub-classed Appenders, instead they should
			 * implement logString and logObjects
			 * @param {aperture.log.LEVEL} level level at which to log the message
			 * @param {Object|String} toLog data to log, see api.log for details.
			 */
			log : function( level, toLog ) {
				// Check logging level
				if( levelOrder[level] >= levelOrder[this.level] ) {
					// Extract all arguments that are meant to be logged
					var toLogArgs = Array.prototype.slice.call(arguments, 1);
					// Is the first thing to log a string?
					if( aperture.util.isString(toLog) ) {
						// Log a string, assume is a format string if more args follow
						// Create log message and call appender's log string function
						this.logString( level, formatString.apply(null, toLogArgs) );

					} else {
						// Not a string, assume one or more objects, log as such
						if( this.logObjects ) {
							// Appender supports object logging
							// Call logObjects with the level and an array of objects to log
							this.logObjects( level, toLogArgs );
						} else {
							// Appender doesn't support object logging
							// Convert objects to a JSON string and log as such
							var message = window.JSON? JSON.stringify( toLogArgs ) :
								'No window.JSON interface exists to stringify logged object. A polyfill like json2.js is required.';

							this.logString( level, message );
						}
					}
				}
			},

			/**
			 * 'Abstract' function to log a given string message at the given level
			 * Appender sub-classes should implement this method to do something useful
			 * with the message
			 * @param {aperture.log.LEVEL} level the level of the message to log
			 * @param {String} message the message that should be logged as a string
			 */
			logString : function(level, message) {}

			/**
			 * 'Abstract' function to log javascript objects.  Appender sub-classes
			 * may elect to implement this method if they can log objects in a useful
			 * way.  If this method is not implemented, logString will be called
			 * with a string representation of the objects.
			 * <pre>
			 * logObjects : function(level, objects) {}
			 * </pre>
			 * @param {aperture.log.LEVEL} level the level of the entry to log
			 * @param {Object} ... the objects to log
			 */
		} ),

		/**
		 * Define the externally visible logging API
		 * @exports api as aperture.log
		 * @lends api
		 */
		api = {
			/**
			 * Returns a list of the current logging appenders
			 * @returns an array of active appenders
			 */
			appenders : function() {
				return appenders;
			},

			/**
			 * Adds an Appender instance to the set of active logging appenders
			 * @param {Appender} toAdd an appender instance to add
			 * @returns the added appender
			 */
			addAppender : function( toAdd ) {
				appenders.push( toAdd );
				return toAdd;
			},

			/**
			 * Removes an Appender instance from the set of active logging appenders
			 * @param {Appender} toRemove an appender instance currently in the list
			 * of active appenders that should be removed
			 * @returns the removed appender
			 */
			removeAppender : function( toRemove ) {
				appenders = aperture.util.without( appenders, toRemove );
				return toRemove;
			},

			/**
			 * Logs a message at the given level
			 * @param {aperture.log.LEVEL} level the level at which to log the given message
			 * @param {String|Object} message a message or object to log.
			 * The message may be a plain string, may be a format string followed by
			 * values to inject into the string, or may be one or more objects that should
			 * be logged as is.
			 * @param {String|Object} [...] additional objects to log or parameters
			 * for the format string contained in the message parameter.
			 */
			logAtLevel : function(level, message) {
				// Only log if message level is equal to or higher than the global level
				if( levelOrder[level] >= levelOrder[globalLevel] ) {
					var args = arguments;
					aperture.util.forEach(appenders, function(appender) {
						// Call the appender's log function with the arguments as given
						appender.log.apply(appender, args);
					});
				}
			},

			/**
			 * Sets or gets the current global logging level
			 * @param {LEVEL} [l] if provided, sets the global logging level
			 * @returns {LEVEL} the global logging level, if a get, the old logging level if a set
			 */
			level : function(l) {
				var oldLevel = globalLevel;
				if( l !== undefined ) {
					// Set new global level if given one
					globalLevel = l;
				}
				// Return original global level
				return oldLevel;
			},
			
			/**
			 * Returns true if configured to include the specified log level.
			 * @param {LEVEL} level
			 * @returns {Boolean} true if logging the specified level.
			 */
			isLogging : function(level) {
				return levelOrder[level] >= levelOrder[globalLevel];
			},
			
			/**
			 * If setting increments or decrements the indent by the specified number of spaces,
			 * otherwise returning the current indentation as a string of spaces. Zero may 
			 * be supplied as an argument to reset the indentation to zero.
			 *  
			 * @param {Number} [spaces] the number of spaces to increment or decrement, or zero to reset.
			 * @returns {String} the current indentation as a string.
			 */
			indent : function(spaces) {
				if (arguments.length !== 0) {
					if (spaces) {
						if (spaces < 0) {
							prefix = spaces < prefix.length? prefix.substring(0, prefix.length-spaces): '';
						} else {
							while (spaces > 0) {
								prefix += eightSpaces.substr(0, Math.min(spaces, 8));
								spaces-= 8;
							}
						}
					} else {
						prefix = '';
					}
				}
				
				return prefix;
			},
			
			/**
			 * Specifies whether or not to intercept and log Javascript errors, or if no arguments
			 * are supplied returns true or false indicating the current state.
			 * 
			 * @param {Boolean} [log] whether or not to log window errors.
			 * @param {Boolean} [preventDefault=false] whether or not to prevent the browser's default.
			 * 
			 */
			logWindowErrors : function(log, preventDefault) {
				if (log == null) {
					return logWinErrs;
				}
				
				// force it to a boolean.
				log = !!log;

				if (logWinErrs !== log) {
					logWinErrs = log;
					eatWinErrs = !!preventDefault;
					
					if (logWinErrs) {
						otherWinErrHandler = window.onerror;
						window.onerror = onErr;
					} else {
						window.onerror = otherWinErrHandler;
						otherWinErrHandler = undefined;
					}
				}
			}
		};

	/**
	 * Logs a message at the "LEVEL.ERROR" level
	 * @name error
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	/**
	 * Logs a message at the "LEVEL.WARN" level
	 * @name warn
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	/**
	 * Logs a message at the "LEVEL.INFO" level
	 * @name info
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	/**
	 * Logs a message at the "LEVEL.LOG" level
	 * @name log
	 * @methodof aperture.log
	 * @param {String|Object} message a message or object to log.
	 * The message may be a plain string, may be a format string followed by
	 * values to inject into the string, or may be one or more objects that should
	 * be logged as is.
	 * @param {String|Object} [...] additional objects to log or parameters
	 * for the format string contained in the message parameter.
	 */

	// Add a log method for each level to the api
	aperture.util.forEach(LEVEL, function(value, key) {
		// Create a method such as the following:
		// api.info = log(level.INFO, args...)
		api[value] = aperture.util.bind(api.logAtLevel, api, value);
	});

	// Expose 'abstract' base class
	api.Appender = Appender;

	// Expose the log level definition
	api.LEVEL = LEVEL;

	// Register for configuration events
	// Configuration options allow
	aperture.config.register('aperture.log', function(config) {
		var logConfig = config['aperture.log'];

		// Set the global level
		if( logConfig.level ) {
			api.level( logConfig.level );
		}
		
		// log JS errors?
		var winErrs = logConfig.logWindowErrors;
		
		if (winErrs) {
			api.logWindowErrors( !!winErrs.log, winErrs.preventDefault );
		}

		// For all defined appenders...
		aperture.util.forEach( logConfig.appenders, function(value, key) {
			if (!key) {
				return;
			}
			// the function will be an add fn that follows a particular format
			key = 'add' + key.charAt(0).toUpperCase() + key.substr(1);

			// If an appender exists with the given key...
			if( aperture.util.isFunction(aperture.log[key]) ) {
				// Add it with the associated specification and start using it
				aperture.log[key]( value );
			}
		});
	});
	
	function onErr(msg, url, line) {
		api.error(msg + ' ' + url + ':' + line);
		
		// chain on
		if (otherWinErrHandler) {
			otherWinErrHandler.apply(this, arguments);
		}
		
		return eatWinErrs;
	}

	return api;
}());
