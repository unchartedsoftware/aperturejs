/**
 * Source: Range.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The Range implementation
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

	// we use this to check for VALID numbers (NaN not allowed)
	function isValidNumber( value ) {
		return !isNaN( value );
	}

	namespace.Range = aperture.Class.extend( 'aperture.Range',

		/** @lends aperture.Range.prototype */
		{
			/**
			 * @class Represents an abstract model property range. Range is
			 * implemented for both scalar and ordinal properties by
			 * {@link aperture.Scalar Scalar} and
			 * {@link aperture.Ordinal Ordinal}.
			 * <p>
			 *
			 * @constructs
			 * @description
			 * This constructor is abstract and may not be called.
			 * @extends aperture.Class
			 *
			 * @param {String} name
			 *      the label of the property described.
			 *
			 * @returns {this}
			 *      a new Range
			 */
			init : function( name ) {

				// views may allow the user to override label.
				this.label = name;

				// default formatting.
				this.formatter_ = new namespace.Format();

			},

			/**
			 * Gets or sets the value of the name for this property.
			 * If this is a view, the base range will be left untouched.
			 * To delete a view's name and once again fallback to the base
			 * label set the view's name value to null.
			 *
			 * @param {String} [text]
			 *      the value, if setting it rather than getting it
			 *
			 * @returns {String|this}
			 *      the label of this property if a get, or this if a set.
			 */
			name : function( text ) {

				// get
				if ( text === undefined ) {
					return this.label;
				}
				// set
				if ( text === null ) {
					delete this.label;
				} else {
					this.label = text;
				}

				return this;
			},

			/**
			 * Expands the property range to encompass the value, if necessary.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @param {Array|Number|String} value
			 *      a case or set of cases to include in the property range.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 *
			 * @name aperture.Range.prototype.expand
			 * @function
			 */

			/**
			 * Clears the property range, then optionally expands
			 * it with new values.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @param {Array|Number} [values]
			 *
			 * @returns {this}
			 *      a reference to this property.
			 *
			 * @name aperture.Range.prototype.reset
			 * @function
			 */

			/**
			 * Returns a new banded scalar view of this range. Banded views are used for
			 * axis articulation, and for scalars can also be used for quantizing values
			 * to labeled ordinal bands of values.
			 * Banded views are live, meaning subsequent range changes are allowed through either
			 * the view or its source.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @returns {aperture.Range}
			 *      a new scalar view of this Range.
			 *
			 * @name aperture.Range.prototype.banded
			 * @function
			 */

			/**
			 * See the mappedTo function.
			 *
			 * @deprecated
			 */
			mapKey : function ( to ) {
				return this.mappedTo( to );
			},

			/**
			 * Creates a key for mapping from this model range to a visual property
			 * range. This method is abstract and implemented by specific types
			 * of ranges.
			 *
			 * @param {Array} to
			 *      the ordered set of colors or numbers to map to, from this property's
			 *      range.
			 *
			 * @returns {aperture.MapKey}
			 *      a new map key.
			 *
			 * @name aperture.Range.prototype.mappedTo
			 * @function
			 */

			/**
			 * Returns the value's position within the Range object.
			 * Ranges implement this function to map data values into the range.
			 * This method is abstract and implemented by specific types of ranges.
			 * @param value
			 *      the value to map within the Range
			 *
			 * @returns the mapped value.
			 *
			 * @name aperture.Range.prototype.map
			 * @function
			 */

			/**
			 * Retrieves the contents of this range as an array.  The content of the array
			 * depends on the type of range (e.g. Scalar, Ordinal, etc). Ordinals return
			 * the sum set of cases in the order added, whereas Scalars return a two element
			 * array of min, max or undefined if the range is yet unset.
			 * This method is abstract and implemented by specific types of ranges.
			 *
			 * @returns {Array} array with the contents of the range
			 */
			get : function() {

				if (!this.range.values || !this.range.values.length) {
					return this.range.values;
				}
				// if range has been revised but not view, refresh view now.
				if (this.revision !== this.range.revision) {
					this.revision = this.range.revision;
					this.view = this.doView();
				}

				return this.view;
			},

			/**
			 * Returns the start of the range. For scalars this will be the minimum of the extents, and
			 * for ordinals it will be the first case. To reset the start and end extents use the reset function.
			 */
			start : function() {
				return this.get()[0];
			},

			/**
			 * Returns the end of the range. For scalars this will be the maximum of the extents, and
			 * for ordinals it will be the last case. To reset the start and end extents use the reset function.
			 */
			end : function() {
				var e = this.get();

				return e && e[e.length-1];
			},

			/**
			 * Formats a value as a String using the current formatter.
			 *
			 * @param value
			 *      the value to format into a string
			 *
			 * @returns {String}
			 *      the formatted value.
			 */
			format : function ( value ) {
				return this.formatter_.format( value );
			},

			/**
			 * Gets or sets the current formatter as a function.
			 * The default formatter simply uses the JavaScript String function.
			 *
			 * @param {aperture.Format} [formatter]
			 *      if setting the formatter, a Format object which
			 *      will format values.
			 *
			 * @returns {aperture.Format|this}
			 *      if getting the formatter, it will be returned,
			 *      otherwise a reference to this,
			 *      convenient for chained method calls.
			 */
			formatter : function ( f ) {
				// get
				if ( f == null ) {
					return this.formatter_;
				}
				if ( !f.typeOf || !f.typeOf(namespace.Format) ) {
					throw new Error('Range formatter must be a Format object');
				}

				this.formatter_ = f;

				return this;
			},

			/**
			 * Returns a displayable string which
			 * includes the property label and extent of the property.
			 *
			 * @returns {String}
			 *      a string.
			 */
			toString : function ( ) {
				var range = this.get();

				return this.label + range? (' [' + range.toString() + ']') : '';
			}
		}
	);

	/**
	 * @private
	 * Increment revision so views have a quick dirty check option.
	 * Used by both scalars and ordinals, on themselves.
	 */
	var revise = function () {
		this.revision++;

		if (this.revision === Number.MAX_VALUE) {
			this.revision = 0;
		}
	},

	/**
	 * @private
	 * Throw an error for this case.
	 */
	noBandedViews = function () {
		throw new Error('Cannot create a scalar view of a banded scalar!');
	},

	/**
	 * @private
	 * The range factory function for scalars.
	 */
	range = (

		/**
		 * @private
		 */
		function() {

			/**
			 * @private
			 * Modify range
			 */
			var set = function ( min, max ) {

				var rv = this.values;

				if( rv ) {
					// Have an existing range, expand
					if( min < rv[0] ) {
						rv[0] = min;
						this.revise();
					}
					if( max > rv[1] ) {
						rv[1] = max;
						this.revise();
					}
				} else {
					// No range set yet, set with min/max
					this.values = [min, max];
					this.revise();
				}
			},

			/**
			 * @private
			 * Clear any existing values.
			 */
			reset = function() {
				this.values = null;
				this.revise();
			};

			/**
			 * @private
			 * Factory method.
			 */
			return function () {
				return {
					values : null,
					revision : 0,
					revise : revise,
					set : set,
					reset : reset
				};
			};
	}());


	namespace.Scalar = namespace.Range.extend( 'aperture.Scalar',

		/** @lends aperture.Scalar.prototype */
		{
			/**
			 * @class Represents a scalar model property range. Unlike
			 * in the case of Ordinals, Scalar property map keys
			 * use interpolation when mapping values to visual
			 * properties. If the desired visual mapping of a raw scalar value
			 * is ordinal rather than scalar (for instance a change value
			 * where positive is an 'up' color and negative is a 'down' color), call
			 * <span class="fixedFont">quantized</span> to derive an ordinal view of
			 * the Scalar.
			 * <p>
			 *
			 * @augments aperture.Range
			 * @constructs
			 * @description
			 * Constructs a new scalar range.
			 *
			 * @param {String} name
			 *      the name of the property described.
			 * @param {Array|Number|String|Date} [values]
			 *      an optional array of values (or a single value) with which to
			 *      populate the range. Equivalent to calling {@link #expand} after construction.
			 *
			 * @returns {this}
			 *      a new Scalar
			 */
			init : function( name, values ) {
				namespace.Range.prototype.init.call(this, name);

				// create a range object,
				// shareable and settable by both base and view
				this.range = range();

				// starting view revision is 0
				// this gets checked later against range revision
				this.revision = 0;

				// handle initial value expansion
				if( values != null ) {
					this.expand(values);
				}
			},

			/**
			 * Expands the property range to encompass the value, if necessary.
			 *
			 * @param {Array|Number|String|Date} value
			 *      a case or set of cases to include in the property range. Each must
			 *      be a Number, a String representation of a number, or a
			 *      Date.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			expand : function ( value ) {
				var min, max, rv = this.range.values;

				if( util.isArray(value) ) {
					// Ensure they're all valid numbers
					var numbers = util.filter(util.map(value,Number), isValidNumber);
					if (!numbers.length) {
						return this;
					}
					// Find the min/max
					min = Math.min.apply(Math,numbers);
					max = Math.max.apply(Math,numbers);
				} else {
					// A single value
					min = max = Number(value);
					if (isNaN(min)) {
						return this;
					}
				}

				this.range.set( min, max );

				return this;
			},

			/**
			 * Clears the property range, then optionally expands
			 * it with new values.
			 *
			 * @param {Array|Number|String|Date} [values]
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			reset : function ( values ) {
				this.range.reset();

				if ( values != null ) {
					this.expand ( values );
				}

				return this;
			},

			/**
			 * Returns the value's normalized position within the Range
			 * object.  The return value will be in the range of [0,1].
			 *
			 * @param {Number} value
			 *      the value to normalize by the Range
			 *
			 * @return {Number} the normalized value of the input in the range [0,1]
			 */
			map : function( value ) {
				// call function in case extended.
				var d = this.get();

				// if anything is invalid (null or NaN(!==NaN)), return 0 to keep our clamped contract.
				if( !d || value == null || (value = Number(value)) !== value) {
					return 0;
				}

				// return limit or interpolate
				return value <= d[0]? 0
						: value >= d[1]? 1
								: (value-d[0]) / (d[1]-d[0]);
			},

			/**
			 * Creates and returns a key for mapping from this model range to a visual property
			 * range. Mappings are evaluated dynamically, meaning subsequent
			 * range changes are allowed. Multiple map keys may be generated from the
			 * same range object.
			 *
			 * @param {Array} to
			 *      the ordered set of colors or numbers to map to, from this property's
			 *      range.
			 *
			 * @returns {aperture.MapKey}
			 *      a new map key.
			 */
			mappedTo : function ( to ) {

				// allow for array wrapping or not.
				if (arguments.length > 1) {
					to = Array.prototype.slice.call(arguments);
				}
				// diagnose problems early so they don't cascade later
				if ( to.length === 0 || (util.isNumber(to[0]) && isNaN(to[0]))) {
					aperture.log.error('Cannot map a scalar range to array length zero or NaN values.');
					return;
				}

				if ( !util.isNumber(to[0]) && !to[0].blend ) {
					// assume colors are strings
					if (util.isString(to[0])) {
						to = util.map(to, function(s) {
							return new aperture.Color(s);
						});
					} else {
						aperture.log.error('Mappings of Scalar ranges must map to numbers or objects with a blend function.');
						return;
					}
				}

				return new namespace.ScalarMapKey( this, to );
			},

			/**
			 * @private
			 *
			 * Views override this to chain updates together. This will never
			 * be called if the range is empty / null. The default implementation
			 * returns a single copy of the source range which is subsequently transformed
			 * by downstream views, in place.
			 */
			doView : function() {
				return this.range.values.slice();
			}
		}
	);

	/**
	 * Returns a new scalar view of this range which is symmetric about zero.
	 * Views are dynamic, adapting to any subsequent changes
	 * in the base range.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.Scalar.prototype.symmetric
	 * @function
	 */
	namespace.Scalar.addView( 'symmetric',
		{
			init : function ( ) {
				this.revision = 0;
			},

			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView();

				// then balance around zero
				if( Math.abs(v[0]) > Math.abs(v[1]) ) {
					v[1] = -v[0];
				} else {
					v[0] = -v[1];
				}

				// return value for downstream views.
				return v;
			}
		}
	);

	/**
	 * Returns a new scalar view which ranges from zero to the greatest absolute
	 * distance from zero and which maps the absolute magnitude of values.
	 * Views are dynamic, adapting to any subsequent changes
	 * in the base range.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.Scalar.prototype.absolute
	 * @function
	 */
	namespace.Scalar.addView( 'absolute',
		{
			init : function ( ) {
				this.revision = 0;
			},

			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView();

				v[1] = Math.max ( Math.abs(v[0]), Math.abs(v[1]) );
				v[0] = 0;

				// return value for downstream views.
				return v;
			},

			// Override of map function for absolute cases.
			map : function ( value ) {

				// error check (note that math.abs below will take care of other invalid cases)
				if( value == null ) {
					return 0;
				}
				return this._base.map.call( this, Math.abs(value) );
			}
		}
	);

	// used in banding
	function roundStep( step ) {
		var round = Math.pow( 10, Math.floor( Math.log( step ) * Math.LOG10E ) );

		// round steps are considered 1, 2, or 5.
		step /= round;

		if (step <= 2) {
			step = 2;
		} else if (step <= 5) {
			step = 5;
		} else {
			step = 10;
		}

		return step * round;
	}

	/**
	 * Returns a new banded scalar view of this range based on the specification
	 * supplied. Bands are used for axis articulation, or
	 * for subsequently quantizing scalars into labeled ordinals
	 * (e.g. up / down, or good / bad) for visual mapping (e.g. up color, down color).
	 * A banded view returns multiple band object values for
	 * <span class="fixedFont">get()</span>, where each object has a
	 * <span class="fixedFont">min</span>,
	 * <span class="fixedFont">label</span>, and
	 * <span class="fixedFont">limit</span> property.
	 * <br><br>
	 * Banded views are live, meaning subsequent range changes are allowed. Multiple
	 * bands may be generated from the same range object for different visual
	 * applications. Scalar bands may be specified simply by supplying a desired
	 * approximate count, appropriate to the visual range available, or by specifying
	 * predefined labeled value bands based on the domain of the values, such
	 * as 'Very Good' or 'Very Poor'. Bounds are always evaluated by a
	 * minimum threshold condition and must be contiguous.
	 * <br><br>
	 * Banded or quantized views must be the last in the chain of views -
	 * other optional views such as logarithmic, absolute, or symmetric can be
	 * the source of a banded view but cannot be derived from one.For example:
	 *
	 * @example
	 *
	 * // default banded view
	 * myTimeRange.banded();
	 *
	 * // view with around five bands, or a little less
	 * myTimeRange.banded(5);
	 *
	 * // view with around five bands, and don't round the edges
	 * myTimeRange.banded(5, false);
	 *
	 * // or, view banded every thousand
	 * myTimeRange.banded({ span: 1000 });
	 *
	 * // or, view with these exact bands
	 * myTimeRange.banded([{min: 0}, {min: 500}]);
	 *
	 * // or, using shortcut for above.
	 * myTimeRange.banded([0, 500]);
	 *
	 * @param {Number|Object|Array} [bands=1(minimum)]
	 *      the approximate count of bands to create, OR a band specification object
	 *      containing a span field indicating the regular interval for bands, OR an
	 *      array of predefined bands supplied as objects with min and label properties,
	 *      in ascending order. If this value is not supplied one band will be created,
	 *      or two if the range extents span zero.
	 *
	 * @param {boolean} [roundTo=true]
	 *      whether or not to round the range extents to band edges
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range, with limitations on further view creation.
	 *
	 * @name aperture.Scalar.prototype.banded
	 * @function
	 */
	namespace.Scalar.addView( 'banded',
		{
			init : function ( bands, roundTo ) {
				this.revision = 0;

				// prevent derivation of more views. would be nice to support secondary
				// banding, but not supported yet.
				this.abs = this.log = this.symmetric = noBandedViews;
				this.bandSpec = {roundTo : this.bandSpec? false : roundTo === undefined? true : roundTo};

				// predefined bands? validate labels.
				if ( util.isNumber(bands) ) {
					if ( isNaN(bands) || bands < 1 ) {
						bands = 1;
					}
				} else if ( bands && bands.span && !isNaN(bands.span)) {
					this.bandSpec.autoBands = bands;
				} else if ( util.isArray(bands) ) {
					// don't continue as array if not valid...
					if ( bands.length < 1 ) {
						bands = 1;
					} else {
						var band, limit, i;

						// copy (hmm, but note this does not deep copy)
						this.bandSpec.bands = bands = bands.slice();

						// process in descending order.
						for ( i = bands.length; i-->0; ) {
							band = bands[i];

							// replace numbers with objects.
							if ( util.isNumber(band) ) {
								band = { min : band };
								bands.splice( i, 1, band );
							}

							// set limit for convenience if not set.
							if (band.limit === undefined && limit !== undefined) {
								band.limit = limit;
							}

							limit = band.min;
						}
					}

				} else {
					bands = 1;
				}

				// a number. generate them from the source data.
				if (!this.bandSpec.bands) {
					this.bandSpec.autoBands = bands;
				}
			},

			doView : function ( ) {

				var v = this._base.doView(),
					bands = this.bandSpec.bands;

				// second order bands
				if (!util.isNumber(v[0])) {
					v = this._base.extents;
				}
				if (this.bandSpec.autoBands) {

					// TODO: cover log case.

					// first get extents, forcing an update.
					// note end and start here may vary from the actual v[0] and v[1] values
					var spec = this.bandSpec.autoBands,
						start = v[0],
						end = v[1];

					// if zero range, handle problem case by bumping up the end of range by a tenth (or 1 if zero).
					if (end === start) {
						end = (end? end + 0.1* Math.abs(end) : 1);
					}

					// delegate to any specialized class/view, or handle standard cases here.
					if (this.doBands) {
						bands = this.doBands(start, end, spec);
					} else {
						bands = [];

						var step = spec.span;

						if (!step || step < 0) {
							// if range spans zero, want an increment to fall on zero,
							// so use the larger half to calculate the round step.
							if (end * start < 0) {
								// cannot properly create only one band if it spans zero.
								if (spec === 1) {
									spec = 2;
								}
								// use the greater absolute.
								if (end > -start) {
									spec *= end / (end-start);
									start = 0;

								} else {
									spec *= -start / (end-start);
									end = 0;
								}
							}

							step = roundStep((end - start) / spec);
						}

						var next = Math.floor( v[0] / step ) * step,
							min;

						// build the range.
						do {
							min = next;
							next += step;
							bands.push({
								min : min,
								limit : next
							});

						} while (next < v[1]);
					}
				} else {
					var first = 0, last = bands.length;

					while ( --last > 0 ) {
						if ( v[1] > bands[last].min ) {
							first = last+ 1;
							while ( --first > 0 ) {
								if ( v[0] >= bands[first].min ) {
									break;
								}
							}
							break;
						}
					}

					// take a copy of the active subset
					bands = bands.slice(first, last+1);
				}

				// if not rounded, replace any partial bands with unbounded bands,
				// signaling that the bottom should not be ticked.
				if ( !this.bandSpec.roundTo ) {
					// Only do this if there is more than 1 band, otherwise
					// both the band min and limit values will be unbounded
					// and there will not be a top or bottom tick.
					if ( v[0] !== bands[0].min && bands.length > 1) {
						bands[0] = {
							min : -Number.MAX_VALUE,
							limit : bands[0].limit,
							label : bands[0].label
						};
					}

					var e = bands.length - 1;

					if ( v[1] !== bands[e].limit ) {
						bands[e] = {
							min : bands[e].min,
							limit : Number.MAX_VALUE,
							label : bands[e].label
						};
					}

				} else {
					// else revise the extents for update below.
					if (bands[0].min != null) {
						v[0] = bands[0].min;
					}
					if (bands[bands.length-1].limit != null) {
						v[1] = bands[bands.length-1].limit;
					}
				}

				// store extents for mapping
				this.extents = v;

				return bands;
			},

			// override to use extents instead of the result of get.
			start : function() {
				this.get();
				return this.extents && this.extents[0];
			},
			end : function() {
				this.get();
				return this.extents && this.extents[1];
			},
			map : function( value ) {

				// call function to update if necessary.
				this.get();

				var d = this.extents;

				// if anything is invalid, return 0 to keep our clamped contract.
				if( !d || value == null || isNaN(value = Number(value)) ) {
					return 0;
				}
				// return limit or interpolate
				return value <= d[0]? 0
						: value >= d[1]? 1
								: (value-d[0]) / (d[1]-d[0]);
			}
		}
	);

	/**
	 * Returns a quantized ordinal view of a banded scalar view range.
	 * Quantized views map ordinally (and produce ordinal mappings)
	 * and format scalar values by returning the ordinal band they fall into.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range, with ordinal mapping.
	 *
	 * @name aperture.Scalar.prototype.quantized
	 * @function
	 */
	namespace.Scalar.addView( 'quantized',
		{
			init : function ( ) {
				if ( !this.typeOf( namespace.Scalar.prototype.banded ) ) {
					throw new Error('Only banded scalars can be quantized.');
				}
				this.banded = noBandedViews;
				this.revision = 0;
			},

			// In our view implementation we add labels to a copy of the
			// banded set.
			doView : function ( ) {
				var src = this._base.doView();

				if (this.bandSpec.autoBands) {
					var label,
						band,
						bands = [],
						i = src.length;

					// process in descending order. make sure we have labels etc.
					while ( i-- > 0 ) {
						band = src[i];

						if (band.min !== -Math.MAX_VALUE) {
							label = view.format( band.min );

							if (band.limit !== Math.MAX_VALUE) {
								label += ' - ' + view.format( band.limit );
							} else {
								label += ' +';
							}

						} else {
							if (band.limit !== Math.MAX_VALUE) {
								label = '< ' + view.format( band.limit );
							} else {
								label = 'all';
							}
						}

						// push new def
						bands.push({
							min : band.min,
							limit : band.limit,
							label : label
						});
					}

					return bands;
				}

				return src;
			},

			// Implemented to create an ordinal mapping.
			mappedTo : function ( to ) {

				// co-opt this method from ordinal
				return namespace.Ordinal.prototype.mappedTo.call( this, to );
			},

			// Implemented to map a scalar value to an ordinal value by finding its band.
			map : function ( value ) {
				var v = this.get();

				// if anything is invalid, return 0 to keep our clamped contract. otherwise...
				if( v && value != null && !isNaN(value = Number(value)) ) {
					var i = v.length;

					while (i-- > 0) {
						if ( value >= v[i].min ) {
							return i;
						}
					}
				}

				return 0;
			},

			/**
			 * Implemented to return the band label for a value
			 */
			format : function ( value ) {
				return this.get()[this.map( value )].label;
			}
		}
	);

	/**
	 * Returns a new scalar view which maps the order of magnitude of source values.
	 * Log views are constructed with a <span class="fixedFont">zero</span>
	 * threshold specifying the absolute value under which values should be no longer
	 * be mapped logarithmically, even if in range. Specifying this value enables
	 * a range to safely approach or span zero and still map effectively.
	 * Log views can map negative or positive values and are
	 * dynamic, adapting to any subsequent changes in the base range.
	 *
	 * @param zero
	 *      the minimum absolute value above which to map logarithmically.
	 *      if not supplied this value will default to 0.1.
	 *
	 * @returns {aperture.Scalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.Scalar.prototype.logarithmic
	 * @function
	 */
	namespace.Scalar.addView( 'logarithmic',
		{
			init : function ( zero ) {
				this.revision = 0;
				this.absMin = zero || 0.1;
			},

			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView();

				// constraint the range boundaries based on the
				// log minimum configured.
				if ( v[0] < 0 ) {
					v[0] = Math.min( v[0], -this.absMin );
					v[1] = ( v[1] < 0 )?
						Math.min( v[1], -this.absMin ): // both neg
						Math.max( v[1],  this.absMin ); // spans zero
				} else {
					// both positive
					v[0] = Math.max( v[0], this.absMin );
					v[1] = Math.max( v[1], this.absMin );
				}

				// cache derived constants for fast map calculations.
				var log0 = Math.log(Math.abs( v[0] ))* Math.LOG10E;
				var log1 = Math.log(Math.abs( v[1] ))* Math.LOG10E;

				// find our abs log min and max - if spans, the zeroish value, else the smaller
				this.logMin = v[0]*v[1] < 0? Math.log(this.absMin)* Math.LOG10E : Math.min( log0, log1 );
				this.mappedLogMin = 0;
				this.oneOverLogRange = 0;

				// establish the range
				var logRange = log0 - this.logMin + log1 - this.logMin;

				if (logRange) {
					this.oneOverLogRange = 1 / logRange;

					// now find mapped closest-to-zero value (between 0 and 1)
					this.mappedLogMin = v[0] >= 0? 0: v[1] <= 0? 1:
						(log0 - this.logMin) * this.oneOverLogRange;
				}

				// return value for downstream views.
				return v;
			},

			// Override of map function for logarithmic cases.
			map : function ( value ) {

				// call base map impl, which also updates view if necessary.
				// handles simple edge cases, out of bounds, bad value check, etc.
				switch (this._base.map.call( this, value )) {
				case 0:
					return 0;
				case 1:
					return 1;
				}

				var absValue = Math.abs( value = Number(value) );

				// otherwise do a log mapping
				return this.mappedLogMin +

					// zero(ish)?
					( absValue <= this.absMin? 0 :
						// or - direction * mapped log value
						( value > 0? 1 : -1 ) *
							( Math.log( absValue )* Math.LOG10E - this.logMin ) * this.oneOverLogRange );
			}
		}
	);

	// time banding has specialized rules for rounding.
	// band options here are broken into hierarchical orders.
	var timeOrders = (function () {

		function roundY( date, base ) {
			date.set({
				FullYear: Math.floor(date.get('FullYear') / base) * base, 
				Month: 0,
				Date: 1, 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundM( date, base ) {
			date.set({
				Month: Math.floor(date.get('Month') / base) * base,
				Date: 1, 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundW( date, base ) {
			date.set({
				Date: date.get('Date') - date.get('Day'), 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundD( date, base ) {
			date.set({
				Date: 1 + Math.floor((date.get('Date') - 1) / base) * base, 
				Hours: 0,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundH( date, base ) {
			date.set({
				Hours: Math.floor(date.get('Hours') / base) * base,
				Minutes: 0,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundMin( date, base ) {
			date.set({
				Minutes: Math.floor(date.get('Minutes') / base) * base,
				Seconds: 0,
				MilliSeconds: 0});
		}
		function roundS( date, base ) {
			date.set({
				Seconds: Math.floor(date.get('Seconds') / base) * base,
				MilliSeconds: 0});
		}
		function roundMs( date, base ) {
			date.set({MilliSeconds: Math.floor(date.get('Milliseconds') / base) * base});
		}

		// define using logical schema...
		var orders = [
				// above one year, normal scalar band rules apply
				{ field: 'FullYear', span: /*366 days*/316224e5, round: roundY, steps: [ 1 ] },
				{ field: 'Month', span: /*31 days*/26784e5, round: roundM, steps: [ 3, 1 ] },
				{ field: 'Date', span: 864e5, round: roundW, steps: [ 7 ] },
				{ field: 'Date', span: 864e5, round: roundD, steps: [ 1 ] },
				{ field: 'Hours', span:36e5, round: roundH, steps: [ 12, 6, 3, 1 ] },
				{ field: 'Minutes', span: 6e4, round: roundMin, steps: [ 30, 15, 5, 1 ] },
				{ field: 'Seconds', span: 1e3, round: roundS, steps: [ 30, 15, 5, 1 ] },
				{ field: 'Milliseconds', span: 1, round: roundMs, steps: [ 500, 250, 100, 50, 25, 10, 5, 1 ] }
				// below seconds, normal scalar band rules apply
		], timeOrders = [], last, dateProto = Date.prototype;

		// ...then flatten for convenience.
		util.forEach( orders, function( order ) {
			util.forEach( order.steps, function( step ) {
				timeOrders.push(last = {
					name   : order.field,
					span   : order.span * step,
					next   : last,
					base   : step,
					round  : order.round
				});
			});
		});

		return timeOrders;
	}());

	// log warning if using unsupported view functions
	function noTimeView() {
		aperture.log.warn('Absolute, logarithmic or symmetric views are inappropriate for time scalars and are intentionally excluded.');
	}

	var fieldAliases = { 'Year' : 'FullYear', 'Day' : 'Date' };

	namespace.TimeScalar = namespace.Scalar.extend( 'aperture.TimeScalar',

		/** @lends aperture.TimeScalar.prototype */
		{
			/** @private */
			_utc: true,

			/**
			 * @class Extends a scalar model property range with
			 * modest specialization of formatting and banding for
			 * JavaScript Dates. Dates are mappable by time by simple
			 * scalars as well, however this class is more appropriate
			 * for determining and labeling bands within a scalar range.
			 * When banded, default date formatting is used
			 * (for the purposes of axis labeling) unless explicitly
			 * overridden in the banded view.
			 * <p>
			 *
			 * @augments aperture.Scalar
			 * @constructs
			 * @description
			 * Constructs a new scalar time range.
			 *
			 * @param {String} name
			 *      the name of the property described.
			 * @param {Array|Number|String|Date} [values]
			 *      an optional array of values (or a single value) with which to
			 *      populate the range. Equivalent to calling {@link #expand} after construction.
			 *
			 * @returns {this}
			 *      a new Scalar
			 */
			init : function( name, values ) {
				namespace.Scalar.prototype.init.call(this, name, values);
				this.formatter_ = new namespace.TimeFormat();
			},

			/**
			 * Overrides the implementation in {@link aperture.Scalar Scalar}
			 * to expect a units field if the band specification object option
			 * is exercised. The units field in that case will be a
			 * string for the span, corresponding to the exact name of a
			 * common field in the Date class. For example:
			 *
			 * @example
			 * // band every three years
			 * myTimeRange.banded( {
			 *     span: 3,
			 *     units: 'FullYear',
			 * };
			 *
			 * @param {Number|Object|Array} [bands=1(minimum)]
			 *      the approximate count of bands to create, OR a band specification object
			 *      containing a span field indicating the regular interval for bands, OR an
			 *      array of predefined bands supplied as objects with min and label properties,
			 *      in ascending order. If this value is not supplied one band will be created,
			 *      or two if the range extents span zero.
			 *
			 * @param {boolean} [roundTo=true]
			 *      whether or not to round the range extents to band edges
			 *
			 * @returns {aperture.TimeScalar}
			 *      a new view of this Range, with limitations on further view creation.
			 *
			 */
			banded : function( bands, roundTo ) {
				var view = namespace.Scalar.prototype.banded.call(this, bands, roundTo);

				// update unless overridden.
				view.autoFormat = true;
				view.get(); // Force the view to populate all its properties.
				return view;
			},

			// unregister these view factories
			absolute : noTimeView,
			logarithmic : noTimeView,
			symmetric : noTimeView,

			// band specialization - only called by banded views.
			doBands : function(start, end, spec) {
				var order, base, i = 0;

				// is span predetermined?
				if (spec.span) {
					base = !isNaN(spec.span) && spec.span > 1? spec.span : 1;

					if (spec.units) {
						var units = fieldAliases[spec.units] || spec.units;

						// find appropriate order (excluding week, unless matched exactly)
						for (len = timeOrders.length; i < len; i++) {
							if (timeOrders[i].name === units) {
								if ((order = timeOrders[i]).base <= base
										&& (order.base !== 7 || base === 7) ) {
									break;
								}
							}
						}
					}
					if (!order) {
						aperture.log.error('Invalid units in band specification: ' + units);
						spec = 1;
						i = 0;
					}
				}
				if (!order) {
					var interval = Math.max(1, (end - start) / spec), len;

					// find first under interval.
					for (len = timeOrders.length; i < len; i++) {
						if ((order = timeOrders[i]).span < interval) {
							order = order.next || order; // then pick the next higher
							break;
						}
					}

					// step in base units. in years? use multiple of base then.
					base = order.next? order.base : Math.max(1, roundStep( interval / 31536e6 )); // in years (/365 day yr)
				}

				// only auto update format if we haven't had it overridden.
				if (this.autoFormat) {
					this.formatter_ = new namespace.TimeFormat( {precision: order.name, local: !this._utc} )
				}

				// round the start date
				var date = new aperture.Date(start, {local: !this._utc}), band, bands = [];
				order.round(date, base);

				// stepping function for bands, in milliseconds
				// (this arbitrary threshold limit kills any chance of an infinite loop, jic.)
				while (i++ < 1000) {
					var next = date.valueOf();

					// last limit is this
					if (band) {
						band.limit = next;
					}

					// break once we're at or past the end
					if (next >= end) {
						break;
					}

					// create band (set limit next round)
					bands.push(band = {min: next});

					date.add(base, order.name);
				}

				return bands;
			}
		}
	);

	/**
	 * Returns a new time scalar view which operates in the local timezone. This
	 * applies to banding and time display.
	 *
	 * @returns {aperture.TimeScalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.TimeScalar.prototype.local
	 * @function
	 */
	namespace.TimeScalar.addView( 'local', {
		init : function () {
			this._utc = false;
			this.formatter_._utc = false;
		}
	});

	/**
	 * Returns a new time scalar view which operates in the UTC timezone. This
	 * applies to banding and time display.
	 *
	 * @returns {aperture.TimeScalar}
	 *      a new view of this Range.
	 *
	 * @name aperture.TimeScalar.prototype.utc
	 * @function
	 */
	namespace.TimeScalar.addView( 'utc', {
		init : function () {
			this._utc = true;
			this.formatter_._utc = true;
		}
	});

	namespace.Ordinal = namespace.Range.extend( 'aperture.Ordinal',

		/** @lends aperture.Ordinal.prototype */
		{
			/**
			 * @class Represents an ordinal model property range. Unlike Scalar
			 * property mappings, which interpolate, Ordinals map ordered
			 * model cases to order visual property options: for instance
			 * series colors, or up / down indicators.
			 * <p>
			 *
			 * @augments aperture.Range
			 * @constructs
			 * @description
			 * Constructs a new ordinal range.
			 *
			 * @param {String} name
			 *      the name of the property described.
			 * @param {Array|Object} [values]
			 *      an optional array of ordinal values/cases with witch to populate
			 *      the object, or a single such value.
			 *
			 * @returns {this}
			 *      a new Ordinal
			 */
			init : function( name, values ) {
				namespace.Range.prototype.init.call(this, name);

				/**
				 * @private
				 * a record of the values (and their order) that we've seen so far
				 */
				this.range = {values : [], revision : 0, revise : revise};

				// starting view revision is 0
				// this gets checked later against range revision
				this.revision = 0;

				if( values != null ) {
					this.expand(values);
				}
			},

			/**
			 * Removes a property value from the set of ordinal cases.
			 *
			 * @param value
			 *      a case to remove from the property.
			 *
			 * @returns
			 *      the value removed, or null if not found.
			 */
			revoke : function ( value ) {
				if( util.isArray(value) ) {
					// Revoking an array of things
					var args = [this.range.values];
					this.range.values = util.without.apply(util, args.concat(value));
				} else {
					// Revoking a single thing
					this.range.values = util.without(this.range.values, value);
				}

				this.range.revise();

				return this;
			},

			/**
			 * Clears the property range, then optionally expands
			 * it with new values.
			 *
			 * @param {Array|Object} [values]
			 *      an optional array of ordinal values/cases with witch to repopulate
			 *      the object, or a single such value.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			reset : function ( values ) {
				this.range.values = [];
				this.range.revise();

				if ( values != null ) {
					this.expand ( values );
				}

				return this;
			},


			/**
			 * Expands the property range to encompass the value, if necessary.
			 *
			 * @param {Array|Object} value
			 *      a case or set of cases to include in the property range.
			 *
			 * @returns {this}
			 *      a reference to this property.
			 */
			expand : function ( value ) {
				var values = this.range.values,
					size = values.length,
					changed, i= 0, n;

				if ( util.isArray(value) ) {
					for (n= value.length; i< n; i++) {
						changed = ( util.indexOf(values, value[i]) === -1 && values.push(value[i])) || changed;
					}
				} else {
					changed = ( util.indexOf(values, value) === -1 && values.push(value));
				}

				if (changed) {
					this.range.revise();
				}
				return this;
			},

			/**
			 * Creates a key for mapping from this model range to a visual property
			 * range.
			 *
			 * @param {Array} to
			 *      the ordered set of colors or numbers to map to, from this property's
			 *      range.
			 *
			 * @returns {aperture.MapKey}
			 *      a new map key.
			 */
			mappedTo : function ( to ) {

				// allow for array wrapping or not.
				if (arguments.length > 1) {
					to = Array.prototype.slice.call(arguments);
				}
				// diagnose problems early so they don't cascade later
				if ( to.length === 0 ) {
					return;
				}

				return new namespace.OrdinalMapKey( this, to );
			},

			/**
			 * Returns the mapped index of the specified value, adding
			 * it if it has not already been seen.
			 */
			map : function ( value ) {
				var values = this.range.values,
					i = util.indexOf( values, value );

				// add if have not yet seen.
				if (i < 0) {
					i = values.length;

					values.push( value );
				}

				return i;
			},

			/**
			 * Returns the index of the specified value, or -1 if not found.
			 */
			indexOf : function ( value ) {
				return util.indexOf( this.range.values, value );
			},

			/**
			 * @private
			 *
			 * Views override this to chain updates together. This will never
			 * be called if the range is empty / null. The default implementation
			 * returns the source range (not a copy) which is subsequently transformed
			 * by downstream views, in place.
			 */
			doView : function() {
				return this.range.values;
			}
		}
	);

	/**
	 * Returns a new banded scalar view of this range which maps to the normalized
	 * center of band. Banded views are used for axis articulation.
	 * Banded views are live, meaning subsequent range changes are allowed.
	 *
	 * @returns {aperture.Ordinal}
	 *      a new scalar view of this Range, with limitations on further view creation.
	 *
	 * @name aperture.Ordinal.prototype.banded
	 * @function
	 */
	namespace.Ordinal.addView( 'banded',
		{
			init : function ( view ) {
				this.revision = 0;
			},

			// implemented to return a banded version.
			doView : function ( ) {

				// start by copying our upstream view.
				var v = this._base.doView(),
					bands = [],
					i= v.length,
					limit = '';

				bands.length = i;

				while (i-- > 0) {
					bands[i]= {
						min: v[i],
						label: v[i].toString(),
						limit: limit
					};
					limit = v[i];
				}

				return bands;
			},

			// Implemented to create an ordinal mapping.
			mappedTo : function ( to ) {

				// co-opt this method from scalar
				return namespace.Scalar.prototype.mappedTo.call( this, to );
			},

			// Implemented to map an ordinal value to a scalar value.
			map : function ( value ) {

				var n = this.get().length;

				// normalize.
				return n === 0? 0: this._base.map( value ) / n;
			},

			// would be nice to support this for aggregated bins, but not right now.
			banded : function () {
				throw new Error('Cannot create a view of a banded ordinal!');
			}
		}
	);

	return namespace;

}(aperture || {}));
