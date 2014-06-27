/**
 * Source: io.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview APIs for client / server interaction.
 */

/*
 * TODO Remove jQuery dependency?
 */

/**
 * @namespace APIs for client / server interaction.
 * @requires jQuery
 * @requires json2 as a JSON shim if running old browsers
 */
aperture.io = (function() {

	var id = 0,
		securityFn,
		restEndpoint = "%host%/rest",
		pendingRequests = 0,
		handlers = [];


	// Register to receive RPC endpoint url from config
	aperture.config.register("aperture.io", function(config) {
		// Get out endpoint location
		restEndpoint = config["aperture.io"].restEndpoint;
	});


	return {

		/**
		 * Resolves a relative uri to a rest url
		 *
		 * TODO handle non-relative URIs
		 */
		restUrl : function ( uri ) {

			// XXX This is fragile and should be fixed!
			var origin = // Have origin, use it
				document.location.origin ||
				// Don't have origin, construct protocol//host
				(document.location.protocol + '//' + document.location.host);

			return restEndpoint.replace("%host%", origin) + uri;
		},

		/**
		 * Makes a REST call to the server for the given URI, method, and posted data
		 * block.  Callback for onSuccess and onError may be provided.
		 *
		 * @param {String} uri The URI to which to make the ajax
		 *
		 * @param {String} method The HTTP method to use, must be a valid HTTP verb such as GET or POST
		 *
		 * @param {Function(data,Object)} callback A callback function to be used when the ajax call returns.
		 * Will be called on both success and error conditions.  The first parameter will contain a data
		 * payload: if JSON, will automatically be converted into an object.  The second parameter is an
		 * object that contains various ajax response values including: success - a boolean, true when the
		 * ajax call was successful; xhr - the XHR object; status - a string containing the HTTP call status;
		 * errorThrown - on error, the error that was thrown.
		 *
		 * @param {Object} opts an options object
		 * @param {String} opts.postData data to post if the POST verb is used, will be automatically
		 * converted to a string if given an object
		 * @param {String|Object} opts.params parameters to include in the URL of a GET request.  Will
		 * automatically be converted to a string if given a hash
		 * @param {Object} opts.headers additional headers to set as key:value pairs
		 * @param {String} opts.contentType explicit content type used when POSTing data to the server.
		 */
		rest : function( uri, method, callback, opts ) {
			var restUrl = aperture.io.restUrl( uri ),

				// Success callback processes response and calls user's callback
				innerSuccess = function(results, textStatus, jqXHR) {
					pendingRequests -= 1;
					aperture.util.forEach(handlers, function(handler) {
						handler.onRequestComplete(pendingRequests);
					});

					if( callback ) {
						// Return results data object plus a hash of
						// other available data.  Also include a success
						// parameter to indicate that the request succeeded
						callback( results, {
								success: true,
								status: textStatus,
								xhr: jqXHR
							});
					}
				},

				// Error callback processes response and calls user's callback
				innerError = function(jqXHR, textStatus, errorThrown) {
					var responseData = jqXHR.responseText;
					
					pendingRequests -= 1;
					aperture.util.forEach(handlers, function(handler) {
						handler.onRequestComplete(pendingRequests);
					});

					aperture.log.error((errorThrown||textStatus||'unspecified error') + (responseData? (' : ' + responseData): ''));
					
					if( callback ) {
						// Check content-type for json, parse if json
						var ct = jqXHR.getResponseHeader( "content-type" );
						if( responseData && ct && ct.indexOf('json') > -1 ) {
							try {
								responseData = jQuery.parseJSON( responseData );
							} catch( e ) {
								// Error parsing JSON returned by HTTP error... go figure
								// TODO log
								responseData = null;
							}
						}

						// Return error data object plus a hash of
						// other available data.  Also include a success
						// parameter to indicate that the request failed
						callback( responseData, {
								success: false,
								status: textStatus,
								xhr: jqXHR,
								errorThrown: errorThrown
							});
					}
				},

				params = {
					url: restUrl,
					type: method,
					success: innerSuccess,
					error: innerError
				};

			// Augment REST url as needed to add security tokens
			if( securityFn ) {
				restUrl = securityFn( restUrl );
			}

			// POST or GET params
			if( opts ) {
				if( opts.contentType ) {
					params.contentType = opts.contentType;
				}

                if( opts.async != null ) {
                    params.async = opts.async;
                }
				
				if( opts.postData && method === "POST" ) {
					params.data = opts.postData;
					
					if (params.contentType && params.contentType.toLowerCase().indexOf('json') > -1) {
						params.contentType = 'application/json; charset=UTF-8';
						
						if (!aperture.util.isString(params.data)) {
							params.data = JSON.stringify(params.data);
						}
					}
				}

				if( opts.params && method === "GET" ) {
					params.data = opts.params;
				}

				if( opts.headers ) {
					params.headers = opts.headers;
				}
			}

			pendingRequests += 1;

			//  Make the AJAX call using jQuery
			$.ajax( params );
		},

		addRestListener : function( listener ) {
			if( listener && typeof listener !== "function") {
				return;
			}

			handlers.push(listener);
		},

		removeRestListener : function( listener ) {
			if( listener && typeof listener !== "function") {
				return;
			}

			handlers.splice(aperture.util.indexOf(handlers, listener), 1);
		},

		getPendingRequests : function() {
			return pendingRequests;
		},

		/**
		 * Sets a function that can be used to add security information
		 * to a URL before it is used to make an RPC call to the server.
		 * This permits implementation-specific (token-based) authentication.
		 */
		setUrlAuthenticator : function( fn ) {
			if( fn && typeof fn !== "function") {
				// TODO exception
				return;
			}

			securityFn = fn;
		}
	};
}());
