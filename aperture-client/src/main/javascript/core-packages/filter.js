/**
 * Source: filter.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Filter API Implementations
 */

/**
 * @namespace Aperture filter APIs
 */
aperture.filter = (function(namespace) {

	var effects =
	/** @lends aperture.filter */
	{

		/**
		 * Returns a function that always returns the supplied constant value
		 */
		constant : function(value) {
			return function() {
				return value;
			};
		},

		/**
		 * Returns a effect function that scales a provided number by the given
		 * scalar value.
		 */
		scale : function(amount) {
			return function( value ) {
				return value * amount;
			};
		},
		
		/**
		 * Returns a effect function that shifts a provided number by the given
		 * scalar value.
		 */
		shift : function(amount) {
			return function( value ) {
				return value + amount;
			};
		},
		brighter : function(color) {
			// TODO
		},

		/**
		 * Takes a conditional function and a effect function and returns a function
		 * that will apply the given effect to the supplied arguments only when the truth
		 * function returns a truthy value when called with the supplied arguments.  For
		 * example:
		 * <code>
		 * var makeBigBigger = conditional(
		 *      function(value) { return value > 1000; },
		 *      aperture.filter.scale( 2 )
		 * );
		 *
		 * var makeRedBlue = conditional(
		 *      function(value) { return value === 'red'; },
		 *      function() { return 'blue'; }
		 * );
		 * </code>
		 *
		 * @param {Function} checkFunction
		 * @param {Function} filterFunction
		 */
		conditional : function( checkFunction, filterFunction ) {
			return function(value) {
				// If supplied conditional...
				if( checkFunction.apply(this, arguments) ) {
					// Apply effect
					return filterFunction.apply(this, arguments);
				} else {
					return value;
				}
			};
		}
	};

	// Mix in effect definitions into provided namespace
	aperture.util.extend(namespace, effects);

	return namespace;

}(aperture.filter || {}));
