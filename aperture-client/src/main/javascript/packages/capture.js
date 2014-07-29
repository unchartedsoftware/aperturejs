/**
 * Source: capture.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Capture Service API
 */

/**
 * @namespace Functions used to capture snapshot images of a url or DOM element.
 * @requires an Aperture image capture service
 * @requires jQuery
 */
aperture.capture = (function() {

	/*
	 * Wraps the given callback, extracts the image location and returns.
	 */
	var callbackWrapper = function( callback ) {
		return function(result, info) {
			if( info.success ) {
				callback( result, info );
			} else {
				callback( null, info );
			}
		};
	};

	// From: http://www.phpied.com/relative-to-absolute-links-with-javascript/
	// https://github.com/stoyan/etc
	function toAbs(link, host) {

		var lparts = link.split('/');
		if (/http:|https:|ftp:/.test(lparts[0])) {
			// already abs, return
			return link;
		}

		var i, hparts = host.split('/');
		if (hparts.length > 3) {
			hparts.pop(); // strip trailing thingie, either scriptname or
							// blank
		}

		if (lparts[0] === '') { // like "/here/dude.png"
			host = hparts[0] + '//' + hparts[2];
			hparts = host.split('/'); // re-split host parts from scheme and
										// domain only
			delete lparts[0];
		}

		for (i = 0; i < lparts.length; i++) {
			if (lparts[i] === '..') {
				// remove the previous dir level, if exists
				if (typeof lparts[i - 1] !== 'undefined') {
					delete lparts[i - 1];
				} else if (hparts.length > 3) { // at least leave scheme and
												// domain
					hparts.pop(); // stip one dir off the host for each /../
				}
				delete lparts[i];
			}
			if (lparts[i] === '.') {
				delete lparts[i];
			}
		}

		// remove deleted
		var newlinkparts = [];
		for (i = 0; i < lparts.length; i++) {
			if (typeof lparts[i] !== 'undefined') {
				newlinkparts[newlinkparts.length] = lparts[i];
			}
		}

		return hparts.join('/') + '/' + newlinkparts.join('/');
	}


	/** 
	 * @private
	 * NOT CURRENTLY FUNCTIONAL - this is left here for later reinstatement. probably store()
	 * would take either a url or element, and then call into here if an element.
	 * 
	 * Initiates an image capture of a snippet of HTML.
	 *
	 * @param {DOMElement} element
	 *            DOM element to capture
	 * @param {Function(Object)} callback
	 *            The callback to call when the image is ready, with the document
	 *            descriptor suitable for use with aperture.store.
	 * @param {Object} settings
	 *            A set of key/value pairs that configure the image
	 *            capture
	 * @param {boolean} settings.noStyles
	 *            set to true if the current page's CSS
	 *            styles should *not* be used in the capture process
	 * @param {Number} settings.captureWidth
	 *            if set, the virtual "screen" width
	 *            of content in which to render page in a virtual browser (in pixels).
	 *            If not set, the element's width will be used.
	 * @param {Number} settings.captureHeight
	 *            if set, the virtual "screen" height
	 *            of content in which to render page in a virtual browser (in pixels).
	 *            If not set, the element's height will be used.
	 * @param {String} settings.format
	 *            if set, specifies the image format to request.  May be one of
	 *            "JPEG", "PNG", or "SVG"
	 */
	function storeFromElement( element, callback, settings ) {
		// TODO: UPDATE THIS.
		
		// Get HTML
		var html = $(element).clone().wrap('<div></div>').parent().html();

		// Make URLs absolute
		var absHost = document.location.href;
		var regex = /<\s*img [^\>]*src\s*=\s*(["\'])(.*?)\1/ig;
		var match;
		while( !!(match = regex.exec(html)) ) {
			var url = match[2];
			var fullUrl = toAbs(url, absHost);
			if( url !== fullUrl ) {
				// Drop in the replacement URL
				// This is a lousy version of string.replace but here we specify exact indices of the replacement
				// An alternative would be do to a replace all but would require converting "url" to a regex
				var before = html.slice(0, match.index);
				var after = html.slice(match.index + match[0].length);
				html = before + match[0].replace(url, fullUrl) + after;
				// Advance the index to account for the fullUrl being longer
				match.lastIndex += (fullUrl.length - url.length);
			}
		}

		html = '<body>' + html + '</body>';

		// Add styles
		var styles = '';
		if( !settings || !settings.noStyles ) {
			// Get raw styles
			$('style').each( function(idx,style) {
				styles += '<style type="text/css">'+$(this).html()+'</style>';
			});

			// Get links to styles
			$('link[rel="stylesheet"]').each( function(idx,style) {
				var href = $(this).attr('href');
				styles += '<link rel="stylesheet" type="text/css" href="'+toAbs(href,absHost)+'" />';
			});

			html = '<head>' + styles + '</head>' + html;
		}

		// Add enclosing html tags
		html = '<!DOCTYPE html><html>' + html + '</html>';


		// POST to capture service URL, encode settings as query string
		var query = settings ? $.param(settings) : "";

		aperture.io.rest("/capture?"+query, "POST", callbackWrapper(callback),
			{
				postData : html,
				contentType : "text/html"
			}
		);
	}


	return {
		
		/**
		 * On startup this can be called to initialize server side rendering for
		 * later use. This otherwise happens on the first request, causing a 
		 * significant delay.
		 */
		initialize : function() {
			aperture.io.rest('/capture/start', "GET");
		},
		
		/**
		 * Initiates an image capture of a given URL which will be stored in the aperture
		 * CMS. A callback is invoked with the URL that may be used to GET the image.
		 *
		 * @param {String} url 
		 *            URL of the page to be captured
		 * @param {Function(Object)} callback
		 *            The callback to call when the image is ready, with the document
		 *            descriptor suitable for use with aperture.store.
		 * @param {Object} settings
		 *            A set of key/value pairs that configure the image
		 *            capture
		 * @param {Number} settings.captureWidth
		 *            If set, the virtual "screen" width
		 *            of content in which to render page in a virtual browser (in pixels).
		 *            If not set, the element's width will be used.
		 * @param {Number} settings.captureHeight
		 *            If set, the virtual "screen" height
		 *            of content in which to render page in a virtual browser (in pixels).
		 *            If not set, the element's height will be used.
		 * @param {String} settings.format
		 *            If set, specifies the image format to request.  May be one of
		 *            "JPEG", "PNG", or "SVG"
		 * @param {Object} authenticationSettings
		 *            A set of key/value pairs that configure the authentication of an 
		 *            image capture. If not set, no authentication will be used.
		 * @param {String} settings.username
		 *            The user name used for authentication.
		 * @param {String} settings.password
		 *            The password used for authentication.
		 */
		store : function( url, settings, authenticationSettings, callback ) {

			// create rest call	
			var params = '';
			
			if (settings) {
				params += '&'+ $.param(settings);
			}
			if (authenticationSettings) {
				params += '&'+ $.param(authenticationSettings);
			}
			
			var restCall = '/capture/store?page=' + encodeURIComponent(url) + params;
			
			aperture.io.rest(restCall, "GET", callbackWrapper(callback));
		},
		
		/**
		 * Creates a rest url that may be used to GET an image capture of a given URL.
		 *
		 * @param {String} url 
		 *            URL of the page to be captured
		 * @param {Function(String)} callback
		 *            The callback to call when the image is ready.  On error will
		 *            be called with null.
		 * @param {Object} settings
		 *            A set of key/value pairs that configure the image
		 *            capture
		 * @param {Number} settings.captureWidth
		 *            If set, the virtual "screen" width
		 *            of content in which to render page in a virtual browser (in pixels).
		 *            If not set, the element's width will be used.
		 * @param {Number} settings.captureHeight
		 *            If set, the virtual "screen" height
		 *            of content in which to render page in a virtual browser (in pixels).
		 *            If not set, the element's height will be used.
		 * @param {String} settings.format
		 *            If set, specifies the image format to request.  May be one of
		 *            "JPEG", "PNG", or "SVG"
		 * @param {Object} authenticationSettings
		 *            A set of key/value pairs that configure the authentication of an 
		 *            image capture. If not set, no authentication will be used.
		 * @param {String} settings.username
		 *            The user name used for authentication.
		 * @param {String} settings.password
		 *            The password used for authentication.
		 */
		inline : function( url, settings, authenticationSettings) {

			// create rest call	
			var params = '';
			
			if (settings) {
				params += '&'+ $.param(settings);
			}
			if (authenticationSettings) {
				params += '&'+ $.param(authenticationSettings);
			}
			
			return aperture.io.restUrl(
				'/capture/inline?page=' + encodeURIComponent(url) + params
			);
		}
	};
}());
