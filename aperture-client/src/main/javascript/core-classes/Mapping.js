/**
 * Source: Mapping.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Mappings are used to define supply pipelines for visual
 * properties of layers.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var util = aperture.util,
		forEach = util.forEach;


	namespace.Mapping = aperture.Class.extend( 'aperture.Mapping',
	/** @lends aperture.Mapping# */
	{
		/**
		 * @class A Mapping is responsible for mapping value(s) for a visual property
		 * as a constant ({@link #asValue}) or {@link #from} a data source,
		 * {@link #using} an optional map key. Layer Mappings are
		 * accessed and defined by calling {@link aperture.Layer#map layer.map}.
		 *
		 * @constructs
		 * @factoryMade
		 * @extends aperture.Class
		 */
		init : function( property ) {
			/**
			 * The visual property to which this mapping pertains
			 * @private
			 */
			this.property = property;

			/**
			 * @private
			 */
			this.filters = [];

			/**
			 * @private
			 */
			this.dataAccessor = undefined;

			/**
			 * @private
			 */
			this.transformation = undefined;
		},

		/**
		 * Specifies that this mapping should not inherit
		 * from parent mappings.
		 *
		 * @returns {aperture.Mapping}
		 *      this mapping object
		 */
		only : function () {
			if (!this.hasOwnProperty('filters')) {
				this.filters = [];
			}
			if (!this.hasOwnProperty('dataAccessor')) {
				this.dataAccessor = undefined;
			}
			if (!this.hasOwnProperty('transformation')) {
				this.transformation = undefined;
			}

			return this;
		},

		/**
		 * Maps the graphic property from a source of values from the data object.
		 * A visual property may be mapped using one or more of the following constructs:
		 * <ul>
		 * <li>Field: A visual property may be mapped to a given field in the data.</li>
		 * <li>Function: A visual property may be mapped to a function that will be called and provided
		 * the data item and expected to return a value for the property.</li>
		 * </ul>
		 *
		 * @example
		 * // Map x to a field in the data object called 'xCoord'
		 * layer.map('x').from('xCoord');
		 * 
		 * // Map label to the value returned by the given function
		 * layer.map('label').from( function() { return 'Name: ' + this.name; } );
		 * 
		 * // Map label to the value returned by the given data object's prototype function
		 * layer.map('label').from( MyDataType.prototype.getName );
		 * 
		 * // Map x to a sequence of values and count to a static value of 20
		 * layer.map('x').from('xCoord[]');
		 * 
		 * // Map y to a function and count to the length of the array field 'points'
		 * layer.map('y').from( function(data, index) { return points[index].y; } );
		 * layer.map('count').from('points.length');
		 *
		 * @param {String|Function} source
		 *      the source of the data to map the graphic property.  May be a function that
		 *      maps a given data object to the desired source data in the form
		 *      <code>function(dataObject)</code>, or may be a data object field name
		 *      in the form <code>'a.b.c'</code> where the data will be sourced from
		 *      <code>dataObject.a.b.c</code>.  The length of an array field may be mapped
		 *      using <code>'fieldName.length'</code>.
		 *
		 * @returns {aperture.Mapping}
		 *      this mapping object
		 */
		from : function( source ) {
			// Preprocess the source to determine if it's a function, field reference, or constant
			if( util.isFunction(source) ) {
				/**
				 * @private
				 * Given a function, use it as the mapping function straight up
				 */
				this.dataAccessor = source;

			} else if( util.isString(source) ) {
				// Validate that this is a valid looking field definition
				var fieldChain = source.match(jsIdentifierRegEx);
				// Is a field definition?
				if( fieldChain ) {
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

					/**
					 * @private
					 * Create a function that dereferences the given data item down the
					 * calculated field chain
					 */
					this.dataAccessor = function() {
						// Make a clone since the array will be changed
						// TODO Hide this need to copy?
						var chain = fieldChain.slice();
						// Pass in array of arguments = array of indexes
						return findFieldChainValue.call( this, chain, Array.prototype.slice.call(arguments) );
					};

					// TODO A faster version of the above for a single field
				} else {
					// String, but not a valid js field identifier
					// TODO logging
					throw new Error('Invalid object field "'+source+'" used for mapping');
				}
			} else {
				// Not a function, not a field
				// TODO log
				throw new Error('Mapping may only be done from a field name or a function');
			}

			return this;
		},

		/**
		 * Maps this property to a constant value.  The value may be a string, number, boolean
		 * array, or object.  A mapping to a constant value is an alternative to mapping do
		 * data using {@link #from}.
		 *
		 * @param {Object} value
		 *      The value to bind to this property.
		 *
		 * @returns {aperture.Mapping}
		 *      this mapping object
		 */
		asValue : function( value ) {
			/**
			 * @private
			 * Is just a static value string
			 */
			this.dataAccessor = function() {
				return value;
			};

			return this;
		},

		/**
		 * Provides a codified representational key for mapping between source data and the graphic
		 * property via a MapKey object. A MapKey object encapsulates the function of mapping from
		 * data value to graphic representation and the information necessary to express that mapping
		 * visually in a legend. Map keys can be created from Range objects, which describe
		 * the data range for a variable.
		 *
		 * A map key may be combined with a constant, field, or function provided data value source,
		 * providing the mapping from a variable source to visual property value for each data item, subject
		 * to any final filtering.
		 *
		 * The map key object will be used to translate the data value to an appropriate value
		 * for the visual property.  For example, it may map a numeric data value to a color.
		 *
		 * Calling this function without an argument returns the current map key, if any.
		 * 
		 * @param {aperture.MapKey} mapKey
		 *      The map key object to use in mapping data values to graphic property values.
		 *      Passing in null removes any existing key, leaving the source value untransformed,
		 *      subject to any final filtering.
		 *
		 * @returns {aperture.Mapping|aperture.MapKey}
		 *      this mapping object if setting the value, else the map key if getting.
		 */
		using : function( mapKey ) {
			if ( mapKey === undefined ) {
				return this.transformation;
			}
			this.transformation = mapKey;

			return this;
		},

		/**
		 * Applies a filter to this visual property, or clears all filters if no filter is supplied.
		 * A filter is applied after a visual value
		 * is calculated using the values passed into {@link #from}, {@link #asValue}, and
		 * {@link #using}.  Filters can be used to alter the visual value, for example, making
		 * a color brighter or overriding the stroke with on certain conditions.  A filter is a
		 * function in the form:
		 *
		 * @example
		 * function( value, etc... ) {
		 *     // value:  the visual value to be modified by the filter
		 *     // etc:    other values (such as indexes) passed in by the renderer
		 *     // this:   the data item to which this value pertains
		 *
		 *     return modifiedValue;
		 * }
		 *
		 * @param {Function} filter
		 *      A filter function in the form specified above, or nothing / null if clearing.
		 */
		filter : function( filter ) {
			if( filter ) {
				// only add to our own set of filters.
				if (!this.hasOwnProperty('filters')) {
					this.filters = [filter];
				} else {
					this.filters.push( filter );
				}
			} else {
				// Clear
				this.filters = [];
			}

			return this;
		},

		/**
		 * Removes a pre-existing filter, leaving any other filters intact.
		 *
		 * @param {Function} filter
		 *   A filter function to find and remove.
		 */
		filterWithout : function ( filter ) {
			this.filters = util.without(this.filters, filter);
		},

		/**
		 * Retrieves the visual property value for the given dataItem and optional indices.
		 *
		 * @param {Object} dataItem
		 *   The data object to retrieve a value for, which will be the value of <code>this</code> 
		 *   if evaluation involves calling a {@link #from from} and / or {@link #filter filter}function. 
		 *
		 * @param {Array} [index] 
		 *   An optional array of indices
		 *
		 *
		 */
		valueFor : function( dataItem, index ) {
			var value;

			// Get value (if no accessor, undefined)
			if( this.dataAccessor ) {
				// Get value from function, provide all arguments after dataItem
				value = this.dataAccessor.apply( dataItem, index || [] );
			}

			return this.value( value, dataItem, index );
		},

		/**
		 * Maps a raw value by transforming it and applying filters, returning
		 * a visual property value.
		 * 
		 * @param {Object} value
		 *   The source value to map. 
		 *   
		 * @param {Object} [context]
		 *   The optional context to supply to any filters. If omitted the value
		 *   of this in the filter call will be the Mapping instance.
		 *
		 * @param {Array} [index] 
		 *   Optional indices to pass to the filters.
		 *  
		 * @returns {Object}
		 *   A transformed and filtered value.
		 */
		value : function( value, context, index ) {
			
			// Transform
			if( this.transformation ) {
				value = this.transformation.map( value );
			}

			return this.filteredValue( value, context, index );
		},
		
		/**
		 * @protected
		 * Execute the filter.
		 */
		filteredValue : function( value, context, index ) {
			
			// Filter
			if( this.filters.length ) {
				context = context || this;
				var args = [value].concat(index);
				
				forEach( this.filters, function(filter) {
					// Apply the filter
					value = filter.apply(context, args);
					// Update value in args for next filter
					args[0] = value;
				});
			}

			return value;
		}
		
	});

	return namespace;

}(aperture || {}));
