/**
 * Source: ConsoleAppender.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging Console Appender Implementation
 */

/*
 * console is a tricky thing to get working cross browser.  Potential
 * problems:
 * <ul>
 * <li>IE 7: No console object</li>
 * <li>IE 8: 'console' only exists after dev tools are open.  console.log functions
 * are not true JS Function functions and do not support 'call' or 'apply'.  A work
 * around using Function.prototype.bind to make an applyable version of the functions
 * (http://whattheheadsaid.com/2011/04/internet-explorer-9s-problematic-console-object)
 * is not possible due to missing Function.prototype.bind.</li>
 * <li>IE 9: 'console' only exists after dev tools are open.  console.log functions
 * are not true JS Function functions and do not support 'call' or 'apply'.
 * Function.prototype.bind does exist.</li>
 * </ul>
 *
 * Ben Alman / Paul Irish (see attribution below) wrote a nice bit of code that will
 * gracefully fallback if console.error, etc are not found.  Craig Patik addressed issues
 * in IE where the console is not available until the dev tools are opened as well as
 * calling the native console functions using .apply.  .apply calls are more desirable than
 * Alman/Irish solution since the browser may nicely format the passed in data instead of
 * logging everything as an array (like Alman/Irish do).
 *
 * @see Bits and pieces of Paul Irish and Ben Alman's
 * <a href="http://benalman.com/projects/javascript-debug-console-log/">console wrapper</a>
 * code was copied and modified below.
 * Original copyright message:
	 * JavaScript Debug - v0.4 - 6/22/2010
	 * http://benalman.com/projects/javascript-debug-console-log/
	 *
	 * Copyright (c) 2010 "Cowboy" Ben Alman
	 * Dual licensed under the MIT and GPL licenses.
	 * http://benalman.com/about/license/
	 *
	 * With lots of help from Paul Irish!
	 * http://paulirish.com/
 *
 * @see Craig Patik's <a href="http://patik.com/blog/complete-cross-browser-console-log/">original post</a>
 * inspired a number of the tweaks included below.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.log = (function(ns) {

	var ConsoleAppender = aperture.log.Appender.extend(
	{
		init : function(spec) {
			spec = spec || {};
			aperture.log.Appender.prototype.init.call(this, spec.level || aperture.log.LEVEL.INFO);

			this.map = [];
			// create a map of log level to console function to invoke
			// if console doesn't have the function, use log
			// level values actually map to console methods (conveniently enough)
			aperture.util.forEach(aperture.log.LEVEL, function(level, key) {
				this.map[level] = function() {
					var con = window.console;

					if ( typeof con == 'undefined' ) {
						return;
					}

					if (typeof con.log == 'object') {
						// IE 8/9, use Andy E/Craig Patik/@kangax call.call workaround
						// since the console.x functions will not support .apply directly
						// Note: Could call F.p.apply.call to truly emulate calling console.log(a,b,c,...)
						// but IE concatenates the params with no space, no ',' so kind of ugly
						if (con[ level ]) {
							Function.prototype.apply.call(con[level], con, arguments);
						} else {
							Function.prototype.apply.call(con.log, con, arguments);
						}
					} else {
						// Modern browser
						if (con.firebug) {
							con[ level ].apply( window, arguments );
						} else if (con[ level ]) {
							con[ level ].apply( con, arguments );
						} else {
							con.log.apply( con, arguments );
						}
					}
				};
			},
			this );
		},

		logString : function( level, message ) {
			// Simply log the string to the appropriate logger
			this.map[level]( message );
		},

		logObjects : function( level, objArray ) {
			// Call the appropriate logger function with all the arguments
			this.map[level].apply( null, objArray );
		}
	});

	/**
	 * @name aperture.log.addConsoleAppender
	 * @function
	 * @description Creates and adds a console implementation of a logging Appender to
	 * the logging system.  This appender works as follows:
	 * <ol>
	 * <li>If firebug exists, it will be used</li>
	 * <li>If console.error, console.warn, console.info and console.debug exist, they will
	 * be called as appropriate</li>
	 * <li>If they do not exist console.log will be called</li>
	 * <li>If console.log or console do not exist, this appender does nothing</li>
	 * </ol>
	 *
	 * @param {Object} [spec] specification object describing the properties of the appender
	 * @param {aperture.log.LEVEL} [spec.level] initial appender logging threshold level, defaults to INFO
	 *
	 * @returns {aperture.log.Appender} a new console appender instance
	 */
	ns.addConsoleAppender = function(spec) {
		return ns.addAppender( new ConsoleAppender(spec) );
	};

	return ns;
}(aperture.log || {}));
