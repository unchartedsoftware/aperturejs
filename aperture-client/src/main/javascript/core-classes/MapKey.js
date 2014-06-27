/**
 * Source: MapKey.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Map Keys for mapping from one space (e.g. data) into another (e.g. visual)
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	namespace.MapKey = namespace.Class.extend( 'aperture.MapKey',

		/** @lends aperture.MapKey# */
		{
			/**
			 * @class A MapKey object maps from a Range object, representing a variable in
			 * data, to a color or numeric visual property such as a size or coordinate.
			 * MapKey is abstract. Instances are constructed by calling
			 * {@link aperture.Range range.mappedTo()}, and are used by {@link aperture.Mapping mappings}.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Class
			 */
			init : function(from, to) {
				this.fromRange = from;
				this.toArray = to;
			},

			/**
			 * A label for this map key reflecting the data property
			 * being mapped in readable form. This value is initialized
			 * from the label in the range but may be subsequently changed here.
			 *
			 * @param {String} value If a parameter given, acts as a setter and sets the label.
			 * @returns {String} If no parameter given, returns the MapKey's label. Otherwise sets and returns the label.
			 */
			label : function ( value ) {
				if (arguments.length) {
					// Set the value
					this.label = value;
				}
				return this.label;
			},

			/**
			 * Returns the Range object that this maps from.
			 *
			 * @returns {aperture.Range}
			 */
			from : function () {
				return this.fromRange;
			},

			/**
			 * Returns the set of values that this maps to.
			 *
			 * @returns {Array}
			 */
			to : function () {
				return this.toArray;
			}

			/**
			 * Returns a visual property value mapped from a data value.
			 * This method is abstract and implemented by different types of map keys.
			 *
			 * @name map
			 * @methodOf aperture.MapKey.prototype
			 *
			 * @param dataValue
			 *      the value to be mapped using the key.
			 *
			 * @returns
			 *      the result of the mapping.
			 */

			/**
			 * This method is mostly relevant to scalar mappings,
			 * where it can be used to set a non-linear mapping
			 * function. A string can be passed indicating a standard
			 * non linear-function, or a custom function may be supplied.
			 * Standard types include
			 * <span class="fixedFont">'linear'</span> and
			 * <span class="fixedFont">'area'</span>, for area based
			 * visual properties (such as a circle's radius).
			 * <br><br>
			 * An ordinal map key returns a type of
			 * <span class="fixedFont">'ordinal'</span>.
			 *
			 * @name type
			 * @methodOf aperture.MapKey.prototype
			 *
			 * @param {String|Function} [type]
			 *      if setting the value, the type of mapping function which
			 *      will map the progression of 0 to 1 input values to 0 to 1
			 *      output values, or a custom function.
			 *
			 * @returns {this|Function}
			 *		if getting the mapping function, the type or custom function, else
			 *		if setting the function a reference to <span class="fixedFont">this</span> is
			 *		returned for convenience of chaining method calls.
			 */
		}
	);

	/**
	 * @private
	 * Predefined interpolators for each type
	 */
	var blenders = {
		'number' : function( v0, v1, weight1 ) {
			return v0 + weight1 * ( v1-v0 );
		},

		// objects must implement a blend function
		'object' : function( v0, v1, weight1 ) {
			return v0.blend( v1, weight1 );
		}
	},

	/**
	 * @private
	 * Default interpolation tweens
	 */
	toTypes = {

		// useful for any visual property that is area forming, like a circle's radius,
		// and where the data range is absolute.
		'area' : function ( value ) {
			return Math.sqrt( value );
		}
	};

	/**
	 * Implements mappings for scalar ranges.
	 * We privatize this from jsdoc to encourage direct
	 * construction from a scalar range (nothing else
	 * makes sense) and b/c there is nothing else to
	 * document here.
	 *
	 * @private
	 */
	namespace.ScalarMapKey = namespace.MapKey.extend( 'aperture.ScalarMapKey',
	{
		/**
		 * Constructor
		 * @private
		 */
		init : function( fromRange, toArray ) {
			namespace.MapKey.prototype.init.call( this, fromRange, toArray );

			this.blend = blenders[typeof toArray[0]];
			this.toType  = 'linear';
		},

		/**
		 * Implements the mapping function
		 * @private
		 */
		map : function( source ) {
			var mv = this.fromRange.map( source ),
				to = this.toArray;

			switch ( mv ) {
			case 0:
				// start
				return to[0];

			case 1:
				// end
				return to[to.length-1];

			default:
				// non-linear?
				if ( this.tween ) {
					mv = this.tween( mv, source );
				}

				// interpolate
				var i = Math.floor( mv *= to.length-1 );

				return this.blend( to[i], to[i+1], mv - i );
			}
		},

		/**
		 * A string can be passed indicating a standard
		 * non linear-function, or a custom function may be supplied.
		 * @private
		 * [Documented in MapKey]
		 */
		type : function ( type ) {
			if ( type === undefined ) {
				return this.toType;
			}

			if ( aperture.util.isFunction(type) ) {
				if (type(0) != 0 || type(1) != 1) {
					throw Error('map key type functions must map a progression from 0 to 1');
				}

				this.tween = type;
			} else if ( aperture.util.isString(type) ) {
				this.tween = toTypes[type];
			}

			this.toType = type;

			return this;
		}
	});

	/**
	 * Implements mappings for ordinal ranges.
	 * We privatize this from jsdoc to encourage direct
	 * construction from an ordinal range (nothing else
	 * makes sense) and b/c there is nothing else to
	 * document here.
	 *
	 * @private
	 */
	namespace.OrdinalMapKey = namespace.MapKey.extend( 'aperture.OrdinalMapKey',
	{
		/**
		 * Implements the mapping function
		 * @private
		 */
		map : function( source ) {
			// Map index to index, mod to be safe (to could be smaller than range)
			// Missing in range array leads to -1, array[-1] is undefined as desired
			return this.toArray[ this.fromRange.map(source) % this.toArray.length ];
		},

		/**
		 * For completeness.
		 * @private
		 */
		type : function ( type ) {
			if ( type === undefined ) {
				return 'ordinal';
			}

			return this;
		}
	});

	return namespace;

}(aperture || {}));

