/**
 * Source: BufferingAppender.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Logging Buffering Appender Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.log = (function(ns) {

	/*
	 * TODO A buffering appender may be much more useful if it decorates another
	 * appender.  A call to flush the buffer will log all buffered messages to
	 * the decorated appender.
	 */
	var BufferingAppender = aperture.log.Appender.extend(
	{
		init : function(spec) {
			spec = spec || {};

			aperture.log.Appender.prototype.init.call(this, spec.level || aperture.log.LEVEL.INFO);
			this.depth = spec.bufferDepth || 100;
			this.buffer = [];
		},

		logString : function( level, message ) {
			this.buffer.push( {level:level, message:message, when:new Date()} );
			if( this.buffer.length > this.depth ) {
				this.buffer.shift();
			}
		},

		logObjects : function( level, objs ) {
			this.buffer.push( {level:level, objects:objs, when:new Date()} );
			if( this.buffer.length > this.depth ) {
				this.buffer.shift();
			}
		},

		getBuffer : function( keepBuffer ) {
			var returnValue = this.buffer;
			if( !keepBuffer ) {
				this.buffer = [];
			}
			return returnValue;
		}
	});

	/**
	 * @name aperture.log.addBufferingAppender
	 * @function
	 *
	 * @description Creates and adds a buffering appender to the logging system.
	 * This appender stores most recent N log messages internally
	 * and provides a list of them on demand via a 'getBuffer' function.
	 *
	 * @param {Object} [spec] specification object describing how this appender
	 * should be constructed.
	 * @param {Number} [spec.bufferDepth] maximum number of log records to keep in
	 * the buffer, defaults to 100
	 * @param {aperture.log.LEVEL} [spec.level] initial appender logging threshold level, defaults to INFO
	 *
	 * @returns {aperture.log.Appender} a new buffering appender instance
	 */
	ns.addBufferingAppender = function(spec) {
		return ns.addAppender( new BufferingAppender(spec) );
	};

	return ns;
}(aperture.log || {}));
