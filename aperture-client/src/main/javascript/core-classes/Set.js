/**
 * Source: Set.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The Set implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// util is always defined by this point
	var util = aperture.util;

	var Set = aperture.Class.extend( 'aperture.Set',
	/** @lends aperture.Set# */
	{
		/**
		 * @class A Set contains a collection of values/objects.  Elements of the set
		 * can be added, removed, toggles, and checked for containment.  Sets maintain
		 * a notion of converting between data objects (used by layers) and the contents
		 * of the set.  For example, a set may contain city names and a way to extract
		 * the city name from a give data element.
		 *
		 * TODO The notion of converting from data->set contents could be extracted into
		 * a separate object.  This object could be reused elsewhere and would make the
		 * Set simpler.
		 *
		 * @constructs
		 * @extends aperture.Class
		 *
		 * @param {String|Function} [id]
		 *      An optional conversion directive that allows a set to convert data items
		 *      to set contents.  The conversion will be used for creating filter functions
		 *      on calls to functions such as {@link #scale}.
		 */
		init : function( id ) {
			var that = this,
				fieldChain;

			// Create the idFunction if specified by user
			if( util.isString(id) && !!(fieldChain = id.match(jsIdentifierRegEx)) ) {
				// Yes, create an array of field names in chain
				// Remove . from field names.  Leave []s
				fieldChain = util.map( fieldChain, function(field) {
					// Remove dots
					if( field.charAt(field.length-1) === '.' ) {
						return field.slice(0,field.length-1);
					} else {
						return field;
					}
				});

				this.idFunction = function() {
					// Make a clone since the array will be changed
					// TODO Hide this need to copy?
					// Pass in array of arguments = array of indexes
					return findFieldChainValue.call( this, fieldChain.slice(0),
							Array.prototype.slice.call(arguments) );
				};
			} else if( util.isFunction(id) ) {
				this.idFunction = id;
			}

			// The filter function takes parameters in the form provided by layer
			// mapping filters, and calls "contains" bound to this object
			this.filterFn = function( value, etc ) {
				value = that.translateData.call(that, this, Array.prototype.slice.call(arguments, 1));
				return that.contains(value);
			};

			this.contents = [];
		},

		/**
		 * Adds an element to the Set.  If the set already contains the element it will
		 * not be added.
		 * @param object
		 *      the element to be added
		 * @returns {boolean}
		 *      true if the element is added, else undefined
		 */
		add : function( object ) {
			if( !this.contains(object) ) {
				this.contents.push( object );
				return object;
			}
		},

		/**
		 * Clears the set leaving it empty.
		 * 
		 * @returns {Array}
		 *      the array of removed elements.
		 */
		clear : function() {
			var r= this.contents;
			this.contents = [];
			
			return r;
		},

		/**
		 * Removes an item from the Set.
		 *
		 * @param object
		 *      the element to be removed
		 */
		remove : function( object ) {
			this.contents = util.without(this.contents, object);
		},

		/**
		 * Executes a function for each element in the set, where
		 * the arguments will be the value and its index, in that
		 * order.
		 */
		forEach : function ( fn ) {
			util.forEach(this.contents, fn);
		},

		/**
		 * Returns the set element at index.
		 *
		 * @param index
		 *      the integer index of the element to return
		 *
		 * @returns {object}
		 *      the element at index.
		 */
		get : function( index ) {
			return this.contents[index];
		},

		/**
		 * Returns the number of elements in the set.
		 *
		 * @returns {number}
		 *      the count of elements in the set.
		 */
		size : function () {
			return this.contents.length;
		},

		/**
		 * Returns the set contents in a new array.
		 *
		 * @returns {Array}
		 *      the set as a new array.
		 */
		toArray : function () {
			return this.contents.slice();
		},

		/**
		 * Toggles the membership of a given element in the set.  If the set contains
		 * the element it will be removed.  If it does not contain the element, it will
		 * be added.
		 * @param object
		 *      the element to be toggled
		 */
		toggle : function( object ) {
			if( this.contains(object) ) {
				this.remove(object);
			} else {
				this.add(object);
			}
		},

		/**
		 * Determines whether a given element is contained in this set.
		 *
		 * @param object
		 *      the element to be checked
		 *
		 * @returns {boolean}
		 *      true if the element is in the set, false otherwise
		 */
		contains : function( object ) {
			return util.indexOf( this.contents, object ) >= 0;
		},


		/**
		 * Given a data object and optional indices returns the element value that could
		 * be or is included in this set.  For example, if this set contains city name
		 * strings and was given an id directive for how to extract a city name from a
		 * given data item, this function will do exactly that.
		 *
		 * @param {Object} data
		 *      The data item to translate
		 *
		 * @param {Array} [etc]
		 *      An optional set of indexes
		 *
		 * @returns {Object}
		 *      The element that would be contained in this Set given the id translation
		 *      directive given on Set construction.  If no id directive, returns the
		 *      data object as given.
		 */
		translateData : function( data, etc ) {
			if( this.idFunction ) {
				// Map data to a field value using idFunction
				// Call id function in context of data object with parameters "etc"
				return this.idFunction.apply(data, etc);
			} else {
				// Just use the data straight up
				return data;
			}
		},


		// XXX It would be nice if methods for all filters were automatically
		// added here since each one involves trivial code
		/**
		 * Creates a filter function that can be used on a layer mapping
		 * (see {@link aperture.Layer#map}).  The filter function supplied
		 * will be called with the visual property value to be transformed
		 * and returned, but only for data elements that are within this set.
		 *
		 * @param {Function} filter
		 *      The transformation to apply, in the form function( value ) {return xvalue;}
		 *
		 * @returns {Function}
		 *      A filter function that can be applied to a visual property mapping of
		 *      a layer.
		 */
		filter : function ( filter ) {
			return namespace.filter.conditional( this.filterFn, filter );
		},

		/**
		 * Creates a scaling filter function that can be used on a layer mapping
		 * (see {@link aperture.Layer#map}).  The given amount will be used to
		 * scale the filtered numeric visual property value but only for data elements
		 * that are within this set.
		 *
		 * @param {Number} amount
		 *      A scaling factor to apply to the mapped visual property for data elements
		 *      that are within this set.
		 *
		 * @returns {Function}
		 *      A filter function that can be applied to a visual property mapping of
		 *      a layer.
		 */
		scale : function(amount) {
			return namespace.filter.conditional(
					this.filterFn,
					aperture.filter.scale(amount)
				);
		},


		/**
		 * Creates a constant value filter function that can be used on a layer mapping
		 * (see {@link aperture.Layer#map}).  The filter will use the given constant
		 * value in place of the mapped value for all elements within this set.
		 *
		 * @returns {Function}
		 *      A filter function that can be applied to a visual property mapping of
		 *      a layer.
		 */
		constant : function(val) {
			return namespace.filter.conditional(
					this.filterFn,
					aperture.filter.constant(val)
				);
		}
	});

	/**
	 * @methodof aperture.Set#
	 * @name not
	 *
	 * @description Creates an inverted view of the Set (its complement) specifically 
	 * aimed at creating filter functions that apply when an element is <b>not</b> in 
	 * the set. The returned set will have an inverted {@link #contains} behavior and will 
	 * create inverted filter functions.  Changes to the set using methods such as {@link #add},
	 * {@link #remove}, and {@link #clear} will work on the core set, and do not exhibit
	 * inverted behavior.
	 * 
	 * @returns {Function}
	 *      A filter function in the form function( value, layer, data, ... )
	 */
	Set.addView( 'not', {
		init : function() {
			var that = this;

			// Must create a
			this.filterFn = function( value, etc ) {
				value = that.translateData.call(that, this, Array.prototype.slice.call(arguments, 1));
				return that.contains(value);
			};
		},

		contains : function(object) {
			// Invert containment check result
			return !this._base.contains(object);
		}
	});

	namespace.Set = Set;






	return namespace;

}(aperture || {}));
