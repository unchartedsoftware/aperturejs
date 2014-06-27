/**
 * Source: AlertBoxAppender.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging Alert Box Appender Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.log = (function(ns) {


	var AlertBoxAppender = aperture.log.Appender.extend(
	{

		init : function(spec) {
			spec = spec || {};
			// Default to only popping up an alertbox for errors
			aperture.log.Appender.prototype.init.call(this, spec.level || aperture.log.LEVEL.ERROR);
		},

		logString : function( level, message ) {
			// Simply
			alert( level.toUpperCase() + ':\n' + message );
		}
	});

	/**
	 * @name aperture.log.addAlertBoxAppender
	 * @function
	 * @description Creates and adds an alert box implementation of a logging Appender to
	 * the logging system.  Pops up an alert box for every log message that passes the
	 * appender's threshold.  By default the threshold is set to ERROR to ensure alert boxes
	 * rarely appear.
	 *
	 * @param {Object} [spec] specification object describing the properties of the appender
	 * @param {aperture.log.LEVEL} [spec.level] initial appender logging threshold level, defaults to ERROR
	 *
	 * @return {aperture.log.Appender} a new alert box appender instance
	 */
	ns.addAlertBoxAppender = function(spec) {
		return ns.addAppender( new AlertBoxAppender(spec) );
	};

	return ns;
}(aperture.log || {}));
