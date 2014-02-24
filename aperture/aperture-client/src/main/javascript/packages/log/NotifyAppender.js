/**
 * Source: NotifyAppender.js
 * Copyright (c) 2013 Oculus Info Inc.
 * @fileOverview Aperture Notification Logging Appender Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.log = (function(ns) {
	
	var NotifyAppender = aperture.log.Appender.extend(
	{
		init : function(spec) {
			aperture.log.Appender.prototype.init.call(this, (spec && spec.level) || aperture.log.LEVEL.ERROR);

			var parent = null;
			var p = spec && spec.parentId;
			
			// look for a specified parent.
			if (p && aperture.util.isString(p)) {
				if (p.charAt(0) !== '#') {
					p = '#' + p;
				}
				
				parent = $(p);
			}
			
			// default parent is the body element
			if (parent == null || parent.length === 0) {
				parent = $('body');
			}

			// look for an existing instance (should never be one).
			this._panel = $('.aperture-log-notify', parent);
			
			if (this._panel.length === 0) { 
				var panel = this._panel = $('<div class="aperture-log-notify"></div>').appendTo(parent)
					.css('display', 'none');
				
				// Add the list
				var scroll = $('<ol class="aperture-log-notify-scrollpane"></ol>').appendTo( panel );
				var list = $('<ol class="aperture-log-notify-list"></ol>').appendTo( scroll );
				
				// Add a close button
				$('<button type="button">\u00D7</button>')
					.addClass('aperture-log-notify-button')
					.addClass('aperture-log-notify-close')
					.appendTo( panel )
					.click( function() {
						panel.css('display', 'none');
						
						// make new items old on close
						$('.aperture-log-new', panel)
							.removeClass('aperture-log-new')
							.addClass('aperture-log-old');
					});
				
				// Add a clear button
				$('<button type="button">\u21BA</button>')
					.addClass('aperture-log-notify-button')
					.addClass('aperture-log-notify-clear')
					.appendTo( panel )
					.click( function() { 
						list.empty(); 
					});
			}
		},

		logString : function( level, message ) {
			var panel = this._panel;
			
			if(panel.css('display') === 'none') {
				panel.css('display', '');
			}
			
			var scroll = $('.aperture-log-notify-scrollpane', panel);
			var list = $('.aperture-log-notify-list', panel);
			
			var kids = list.children();
			
			// no more than a thousand lines.
			if (kids.length === 1000) {
				kids.first().remove();
			}
			
			// Append a list item styled by the log level to the list
			var currListItem = $('<li></li>')
				.text('[' + level + '] ' + message)
				.addClass('aperture-log-new')
				.addClass('aperture-log-' + level)
				.appendTo(list);
			
			var scrollTo = Math.max(0, list.outerHeight() - scroll.outerHeight());
			scroll.scrollTop(scrollTo);
		}
	});

	/**
	 * @name aperture.log.addNotifyAppender
	 * @function
	 *
	 * @description Creates and adds a notification appender to the logging system. The Notify Appender
	 * logs all messages to a panel attached to the document body (or other container), typically at the
	 * bottom of the screen.  The panel pops up whenever a new
	 * message is logged at the required minimum log level and
	 * has an ordered list of log messages with "Clear" and "Close" buttons.
	 * The components of the console REQUIRE CSS styles for proper appearance.
	 * Log messages may also optionally be styled by level.
	 * Here is an <a href="../../../log.css">model CSS file</a> for NotifyAppender.
	 *
	 * 
	 * @param {Object} spec specification object describing the properties of the appender.
	 * @param {String} [spec.parentId] the optional DOM id of the parent for the notify panel, which defaults to body. 
	 * @param {aperture.log.LEVEL} [spec.level] the optional initial appender logging threshold level, which defaults to ERROR.
	 *
	 * @returns {aperture.log.Appender} a new Notify appender instance
	 */
	ns.addNotifyAppender = function(spec) {
		return ns.addAppender( new NotifyAppender(spec) );
	};

	return ns;
}(aperture.log || {}));
