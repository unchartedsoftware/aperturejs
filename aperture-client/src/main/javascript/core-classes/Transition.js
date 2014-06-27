/**
 * Source: Animation.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Animation APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	namespace.Transition = aperture.Class.extend( 'aperture.Transition',
	/** @lends aperture.Transition.prototype */
	{
		/**
		 * @class Represents an animated transition, consisting of
		 * an interpolation / easing / tween function, and a length
		 * of time over which the transition will occur. Transitions may
		 * be optionally passed into the Layer update function to animate
		 * any updates which will occur.
		 *
		 * @constructs
		 * @extends aperture.Class
		 *
		 * @param {Number} [milliseconds=300]
		 *      the length of time that the transition will take to complete.
		 *
		 * @param {String} [easing='ease']
		 *      the function that will be used to transition from one state to another.
		 *      The standard CSS options are supported:<br><br>
		 *      'linear' (constant speed)<br>
		 *      'ease' (default, with a slow start and end)<br>
		 *      'ease-in' (slow start)<br>
		 *      'ease-out' (slow end)<br>
		 *      'ease-in-out' (similar to ease)<br>
		 *      'cubic-bezier(n,n,n,n)' (a custom function, defined as a bezier curve)
		 *
		 * @param {Function} [callback]
		 *      a function to invoke when the transition is complete.
		 *
		 * @returns {this}
		 *      a new Transition
		 */
		init : function( ms, easing, callback ) {
			this.time = ms || 300;
			this.fn = easing || 'ease';
			this.end = callback;
		},

		/**
		 * Returns the timing property.
		 *
		 * @returns {Number}
		 *      the number of milliseconds over which to complete the transition
		 */
		milliseconds : function ( ) {
			return this.time;
		},

		/**
		 * Returns the easing property value.
		 *
		 * @returns {String}
		 *      the function to use to transition from one state to another.
		 */
		easing : function ( ) {
			return this.fn;
		},

		/**
		 * Returns a reference to the callback function, if present.
		 *
		 * @returns {Function}
		 *      the function invoked at transition completion.
		 */
		callback : function ( ) {
			return this.end;
		}
	});

	return namespace;

}(aperture || {}));
