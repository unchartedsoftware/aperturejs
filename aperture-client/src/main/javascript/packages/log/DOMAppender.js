/**
 * Source: DOMAppender.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging DOM Appender Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.log = (function(ns) {

	var DOMAppender = aperture.log.Appender.extend(
	{
		init : function(spec) {
			spec = spec || {};

			aperture.log.Appender.prototype.init.call(this, spec.level || aperture.log.LEVEL.INFO);

			// Add the list
			var list = this.list = $('<ol class="aperture-log-display"></ol>')
				.appendTo( spec.container );

			// Add a clear button
			$('<button class="aperture-log-clear" type="button">Clear</button>')
				.click( function() { list.empty(); } )
				.appendTo( spec.container );
		},

		logString : function( level, message ) {
			// Append a list item styled by the log level to the list
			$('<li></li>')
				.text('[' + level + '] ' + message)
				.addClass('aperture-log-'+level)
				.appendTo(this.list);
		}
	});

	/**
	 * @name aperture.log.addDomAppender
	 * @function
	 *
	 * @description Creates and adds a DOM appender to the logging system. The DOM Appender
	 * logs all messages to a given dom element.  The given DOM
	 * element will have an ordered list of log messages and a "Clear" button added to it.
	 * Log messages will be styled 'li' tags with the class 'aperture-log-#' where # is the
	 * log level, one of 'error', 'warn', 'info', 'debug', or 'log'.  The list itself
	 * will have the class 'aperture-log-display' and the button will have the class
	 * 'aperture-log-clear'.
	 *
	 * @param {Object} spec specification object describing the properties of the appender
	 * @param {Element} spec.container the DOM element or selector string to the DOM element
	 * that should be used to log all messages.
	 * @param {aperture.log.LEVEL} [spec.level] initial appender logging threshold level, defaults to INFO
	 *
	 * @returns {aperture.log.Appender} a new DOM appender instance
	 */
	ns.addDomAppender = function(spec) {
		return ns.addAppender( new DOMAppender(spec) );
	};

	return ns;
}(aperture.log || {}));
