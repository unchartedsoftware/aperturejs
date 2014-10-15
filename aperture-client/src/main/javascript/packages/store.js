/**
 * Source: store.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Content Service API
 */

/**
 * @namespace Functions used to store, get, and delete documents in a content store.
 * @requires an Aperture CMS service
 * @requires jQuery
 */
aperture.store = (function() {

	function get(descriptor, callback, action) {
		var url = this.url(descriptor, action);
		
		if (url) {
			var innerCallback = callback && function( result, info ) {
				if( info.success ) {
					// Call user's callback with the document data
					// TODO Get the latest revision via ETAG
					callback( result, descriptor );
				} else {
					// TODO Better error handling?
					callback(null, descriptor);
				}
			};

			// Make the call
			aperture.io.rest(url, "GET", innerCallback);
			
		} else {
			callback(null, descriptor);
		}		
	}

	var api = {
		/**
		 * @name aperture.store.store
		 * @function
		 * @description
		 * Store a data item in the CMS.
		 * @param {String|Object} data the data item to store.  Can be a string or a javascript object.
		 * If a string it will be stored as is.  If an object, it will be converted to JSON
		 * and stored.
		 *
		 * @param {Object} [descriptor] an optional descriptor object that specifies the cms
		 * store, document id, and document revision.
		 * @param {String} [descriptor.store] the name of the content store in which to store the
		 * document.  If not provided, the default will be used.
		 * @param {String} [descriptor.id] the id of the document to store.  If this is a new document
		 * this will try and use this id for the document when storing.  If this is an existing document
		 * being updated this id specifies the id of the document to update.
		 * @param {String} [descriptor.rev] the revision of the document to store.  If updating a document
		 * this must be set to the current revision to be allowed to perform the update.  This prevents
		 * updating a document with out of date information. Revisions must only contain digits
		 * and periods.
		 *
		 * @param {Function(descriptor)} [callback] a function to be called after the store command completes on the server.  The
		 * callback will be given a descriptor object in the same format as the descriptor to the store function
		 * on success.  The descriptor describes the successfully stored document.
		 */
		store : function(data, descriptor, callback) {
			var innerCallback = callback && function( result, info ) {
				if( info.success ) {
					var location = info.xhr && info.xhr.getResponseHeader && info.xhr.getResponseHeader("Location");
					// Call the callback with a hash that describes the stored document
					// and provides a URL to it
					callback( {
							id: result.id,
							rev: result.rev,
							store: result.store,
							url: location
						});
				} else {
					// Failure
					// TODO Provide reason why?
					callback( null );
				}
			};

			// Extend descriptor defaults
			descriptor = aperture.util.extend({
				// TODO Get from config
				store: 'aperture'
				// id: none
				// rev: none
			}, descriptor);

			// Use the given content type or try to detect
			var contentType = descriptor.contentType ||
				// String data
				(aperture.util.isString(data) && 'text/plain') ||
				// JS Object, use JSON
				'application/json';

			// TODO URI pattern from config service?
			// Construct the uri
			var uri = '/cms/'+descriptor.store;
			// Have a given id?  Use it
			if( descriptor.id ) {
				uri += '/'+descriptor.id;
			}
			// Have a rev?  Use it
			if( descriptor.rev ) {
				uri += '?rev='+descriptor.rev;
			}

			// Make the call
			aperture.io.rest(uri, "POST", innerCallback, {
				postData: data,
				contentType: contentType
			});
		},

		/**
		 * @name aperture.store.url
		 * @function
		 * @description
		 * Gets the url of a document in the store given a descriptor.
		 *
		 * @param {Object} descriptor an object describing the document to get
		 * @param {String} [descriptor.store] the name of the content store to use.  If not
		 * provided the default will be used.
		 * @param {String} descriptor.id the id of the document to get
		 * @param {String} [descriptor.rev] the revision of the document to get.  If not
		 * provided, the most recent revision will be retrieved. Revisions must only contain digits
		 * and periods.
		 * @param {String='get'|'remove'|'pop'} [action='get'] the action to perform, which defaults to get 
		 * @param {String} [downloadAs] the local filename of the document if is to be downloaded 
		 * rather than opened by the browser. Do not specify this argument if the document should
		 * be subject to normal browser MIME type viewing.
		 */
		url : function(descriptor, action, downloadAs) {
			if( !descriptor || descriptor.id == null || descriptor.id === '' ) {
				aperture.log.error('get from store must specify an id');
				return;
			}

			// TODO Get from config
			descriptor.store = descriptor.store || 'aperture';

			// Construct the url
			var url = aperture.io.restUrl('/cms/'+descriptor.store+'/'+descriptor.id
				+ '?action='+ (action||'get'));
			
			// Have a rev?  Use it
			if( descriptor.rev ) {
				url += '&rev='+descriptor.rev;
			}
			if (downloadAs) {
				url += '&downloadAs='+encodeURI(downloadAs);
			}

			return url;
		},
		
		/**
		 * @name aperture.store.get
		 * @function
		 * @description
		 * Gets a document from the server given a descriptor.
		 *
		 * @param {Object} descriptor an object describing the document to get
		 * @param {String} [descriptor.store] the name of the content store to use.  If not
		 * provided the default will be used.
		 * @param {String} descriptor.id the id of the document to get
		 * @param {String} [descriptor.rev] the revision of the document to get.  If not
		 * provided, the most recent revision will be retrieved. Revisions must only contain digits
		 * and periods.
		 *
		 * @param {Function(data,descriptor)} [callback] a callback to be called when the document
		 * data is available.  The callback will be provided with the data and a hash of the
		 * document descriptor.
		 */
		get : function(descriptor, callback) {
			return get(descriptor, callback, 'get');
		},
		
		/**
		 * @name aperture.store.remove
		 * @function
		 * @description
		 * Removes a document from the server given a descriptor, optionally fetching it.
		 *
		 * @param {Object} descriptor an object describing the document to get
		 * @param {String} [descriptor.store] the name of the content store to use.  If not
		 * provided the default will be used.
		 * @param {String} descriptor.id the id of the document to get
		 * @param {String} [descriptor.rev] the revision of the document to get.  If not
		 * provided, the most recent revision will be retrieved. Revisions must only contain digits
		 * and periods.
		 *
		 * @param {Function(data,descriptor)} [callback] a callback to be called when the document
		 * data is available.  The callback will be provided with the data and a hash of the
		 * document descriptor.
		 * 
		 * @param {boolean=false} fetch optionally return the removed document.
		 */
		remove : function(descriptor, callback, fetch) {
			return get(descriptor, callback, fetch? 'pop':'remove');
		}
	};

	/**
	 * deprecated
	 * @private
	 */
	api.getURL = api.url;
	
	return api;
}());