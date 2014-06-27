/**
 * Source: base.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines the Aperture namespace and base functions.
 */

/*
 * TODO Provide runtime version, vml vs svg methods
 * TODO Check core dependency order here and report errors?
 */

/**
 * @namespace The root Aperture namespace, encapsulating all
 * Aperture functions and classes.
 */
aperture = (function(aperture) {

	/**
	 * The aperture release version number.
	 * @type String
	 */
	aperture.VERSION = '${project.version}';

	return aperture;

}(aperture || {}));


/*
 * Common functions that are private to all aperture code
 */

/**
 * @private
 * Regular expression that matches fieldName followed by a . or the end of the string.
 * Case insensitive, where fieldName is a string containing letters, numbers _, -, and
 * or $.  Technically any string can be a field name but we need to be a little restrictive
 * here because . and [] are special characters in the definition of nested fields.
 *
 * Used to parse mappings to data object fields
 */
var jsIdentifierRegEx = /([$0-9a-z_\-]+)(\[\])*(\.|$)/ig;

/**
 * @private
 * Function that takes an array of field names (the chain) and an optional index.
 * It will traverse down the field chain on the object in the "this" context and
 * return the result.
 *
 * @param {Array} chain
 *      An array of field identifiers where element of the array represents a
 *      field.  Each field may end with zero or more [] which indicate that an
 *      index into an array field is required.
 * @param {Array} indexes
 *      An array of index numbers to be used to index into any fields ending with []
 *      in the chain array.  The indexes in this array will be used in order with the
 *      []s found in the chain array.  The number of values in this array must match
 *      the number of []s in the chain array.
 *
 * @returns the value of the field specified by the chain and indices arrays
 */
var findFieldChainValue = function( chain, indexes ) {
	// Mutate the chain, shift of front
	var field = chain.shift(),
		arrayIdx, numArrays,
		value;

	// Pop []s off the end using the index
	if( (arrayIdx = field.indexOf('[]')) > 0 ) {
		numArrays = (field.length - arrayIdx)/2;
		// Remove the [] if in the field name (assume is at the end, only way valid)
		field = field.slice(0,arrayIdx);
		// Start by getting the array
		value = this[field];
		if (value == null) {
			return value;
		}
		// Now start digging down through the indexes
		while( numArrays > 0 ) {
			value = value[indexes.shift()];
			numArrays -= 1;
		}
	} else {
		// Straight-up non-indexed field
		value = this[field];
	}

	if( !chain.length ) {
		// Last item in chain, return property
		return value;
	} else {
		// Otherwise, dereference field, continue down the chain
		return findFieldChainValue.call( value, chain, indexes );
	}
};

