/**
 * Source: AjaxAppender.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging AJAX Appender Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.log = (function(ns) {

	var AjaxAppender = aperture.log.Appender.extend(
	{
		init : function( spec ) {
			spec = spec || {};

			aperture.log.Appender.prototype.init.call(this, spec.level || aperture.log.LEVEL.WARN);
			this.url = spec.url;
			this.buffer = [];

			// Force the scope of postData to this, no matter
			// how it's usually called.
			this.postData = aperture.util.bind(this.postData, this);
			
			// Post data at requested interval
			setInterval(this.postData, spec.timeout || 3000 );

			// Also post if navigating away from the page
			$(window).unload( this.postData );
		},

		/** @private */
		logString : function( level, message ) {
			// Push a log record onto the stack
			this.buffer.push( {
				level: level,
				message: message,
				when: new Date()
			} );
		},

		/** @private */
		logObjects : function( level, objs ) {
			// Push a log record onto the stack
			this.buffer.push( {
				level: level,
				data: objs,
				when: new Date()
			} );
		},

		/**
		 * @private
		 * Causes the appender to post any queued log messages to the server
		 */
		postData : function() {
			if( buffer.length ) {
				// Simple fire and forget POST of the data
				$.ajax( {
					url: this.url,
					type: 'POST',
					data: this.buffer
				});

				// Clear buffer
				this.buffer = [];
			}
		}
	});

	/**
	 * @name aperture.log.addAjaxAppender
	 * @function
	 * @description
	 * <p>Creates and adds an AJAX appender object.
	 * The AJAX Appender POSTs log messages to a provided end-point URI
	 * using a JSON format.  Log messages are buffered on the client side
	 * and only sent to the server once every N seconds where N is settable
	 * upon construction.</p>
	 * <p>The data will be posted with the following format:</p>
	 * <pre>
	 * [
	 * { level:"warn", message:"A log message", when:"2011-09-02T17:57:33.692Z" },
	 * { level:"error", data:{some:"data"}, when:"2011-09-02T17:57:34.120Z" }
	 * ]
	 * </pre>
	 *
	 * @param {Object} spec specification object describing the properties of
	 * the ajax appender to build
	 * @param {String} spec.url the server endpoint to which log messages will be
	 * POSTed.
	 * @param {Number} [spec.timeout] period in milliseconds between when collected
	 * log messages are sent to the server.  Defaults to 3000
	 * @param {aperture.log.LEVEL} [spec.level] initial appender logging threshold level, defaults to WARN
	 *
	 * @returns {aperture.log.Appender} a new AJAX appender object that has been added
	 * to the logging system
	 */
	ns.addAjaxAppender = function(spec) {
		return ns.addAppender( new AjaxAppender(spec) );
	};

	return ns;
}(aperture.log || {}));
