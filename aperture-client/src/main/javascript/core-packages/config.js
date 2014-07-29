/**
 * Source: config.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview APIs for interacting with Configurations
 */

/**
 * @namespace APIs for interacting with configurations
 */
aperture.config = (function() {

	var registered = {};
	var currentConfig = {};

	return {

		/**
		 * Register a callback function to be notified with configuration details
		 * when a particular named configuration section is part of the object.
		 * This allows features to be given environment-specific configuration values
		 * by a server, container, or client.
		 */
		register : function( configName, callback ) {
			var existing = registered[configName];
			if (!existing) {
				existing = [];
				registered[configName] = existing;
			}

			existing.push({'callback':callback});

			// If we already have a configuration...
			if( currentConfig && currentConfig[configName] ) {
				// Immediately call the callback
				callback(currentConfig);
			}
		},

		/**
		 * Provides a given configuration object and notifies all registered listeners.
		 */
		provide : function( provided ) {
			currentConfig = provided;

			var key, i;
			for( key in currentConfig ) {
				if (currentConfig.hasOwnProperty(key)) {
					var existing = registered[key];
					if( existing ) {
						for( i=0; i<existing.length; i++ ) {
							existing[i].callback(currentConfig);
						}
					}
				}
			}
		},

		/**
		 * Returns the current configuration object provided via "provide"
		 */
		get : function() {
			return currentConfig;
		}
	};
}());
