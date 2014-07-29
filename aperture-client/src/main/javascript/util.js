/**
 * Source: util.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines utility functions for Aperture.
 */

/*
 * Portions of this package are inspired by or extended from:
 *
 * Underscore.js 1.2.0
 * (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
 * Underscore is freely distributable under the MIT license.
 * Portions of Underscore are inspired or borrowed from Prototype,
 * Oliver Steele's Functional, and John Resig's Micro-Templating.
 * For all details and documentation:
 * http://documentcloud.github.com/underscore
 */

/**
 * @namespace Aperture makes use of a number of JavaScript utility
 * functions that are exposed through this namespace for general use.
 */
aperture.util = (function(ns) {

	/**
	 * Instantiates a new object whose JavaScript prototype is the
	 * object passed in.
	 *
	 * @param {Object} obj
	 *      the prototype for the new object.
	 *
	 * @returns {Object}
	 *		a new view of the object passed in.
	 *
	 * @name aperture.util.viewOf
	 * @function
	 */
	ns.viewOf = function(obj) {

		// generic constructor function
		function ObjectView() {}

		// inherit from object
		ObjectView.prototype = obj;

		// new
		return new ObjectView();

	};


	// native shortcuts
	var arr = Array.prototype,
		slice = arr.slice,
		nativeForEach = arr.forEach,
		nativeMap = arr.map,
		nativeFilter = arr.filter,
		nativeIndexOf = arr.indexOf,
		nativeIsArray = Array.isArray,
		nativeBind = Function.prototype.bind,
		hasOwnProperty = Object.prototype.hasOwnProperty,
		toString = Object.prototype.toString,
		ctor = function(){};

	/**
	 * Calls a function for each item in a collection. If ECMAScript 5
	 * is supported by the runtime execution environment (e.g. browser)
	 * this method delegates to a native implementation.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to iterate through.
	 *
	 * @param {Function} operation
	 *      the function to call for each item in the collection, with
	 *      the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>.
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the operation as <span class="fixedFont">this</span>.
	 *
	 * @name aperture.util.forEach
	 * @function
	 */
	ns.forEach = function ( obj, operation, context ) {
		if ( obj == null ) return;

		// array, natively?
		if ( nativeForEach && obj.forEach === nativeForEach ) {
			obj.forEach( operation, context );

		// array-like?
		} else if ( obj.length === +obj.length ) {
			for (var i = 0, l = obj.length; i < l; i++) {
				i in obj && operation.call(context, obj[i], i, obj);
			}

		// object
		} else {
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					operation.call(context, obj[key], key, obj);
				}
			}
		}
	};

	/**
	 * Calls a function for each item in a collection, until the return
	 * value === the until condition.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to iterate through.
	 *
	 * @param {Function} operation
	 *      the function to call for each item in the collection, with
	 *      the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>.
	 *
	 * @param [until=true]
	 *      the return value to test for when deciding whether to break iteration.
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the operation as <span class="fixedFont">this</span>.
	 *
	 * @returns
	 *      the return value of the last function iteration.
	 *
	 * @name aperture.util.forEachUntil
	 * @function
	 */
	ns.forEachUntil = function ( obj, operation, until, context ) {
		if ( obj == null || operation == null ) return;

		// default to true
		if (arguments.length === 2) {
			until = true;
		}
		
		var result;

		// array-like?
		if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (i in obj && (result = operation.call(context, obj[i], i, obj)) === until) return result;
			}
		// object
		} else {
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key)) {
					if ((result = operation.call(context, obj[key], key, obj)) === until) return result;
				}
			}
		}
		return result;
	};

	/**
	 * Looks through each value in the collection, returning an array of
	 * all the values that pass a truth test. For arrays this method
	 * delegates to the native ECMAScript 5 array filter method, if present.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Function} test
	 *      the function called for each item to test for inclusion,
	 *      with the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the test as <span class="fixedFont">this</span>.
	 *
	 * @returns {Array}
	 *      an array containing the subset that passed the filter test.
	 *
	 * @name aperture.util.filter
	 * @function
	 */
	ns.filter = function ( obj, test, context ) {
		var results = [];

		if ( obj == null ) return results;

		// array, natively?
		if ( nativeFilter && obj.filter === nativeFilter ) {
			return obj.filter( test, context );
		}

		// any other iterable
		ns.forEach( obj, function( value, index ) {
			if ( test.call( context, value, index, obj )) {
				results[results.length] = value;
			}
		});

		return results;
	};

	/**
	 * Produces a new array of values by mapping each item in the collection
	 * through a transformation function. For arrays this method
	 * delegates to the native ECMAScript 5 array map method, if present.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to map.
	 *
	 * @param {Function} transformation
	 *      the function called for each item that returns a transformed value,
	 *      called with the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the transformation as <span class="fixedFont">this</span>.
	 *
	 * @returns {Array}
	 *      a new array containing the transformed values.
	 *
	 * @name aperture.util.map
	 * @function
	 */
	ns.map = function ( obj, map, context ) {
		var results = [];

		if ( obj != null ) {
			// array, natively?
			if ( nativeMap && obj.map === nativeMap ) {
				return obj.map( map, context );
			}

			// any other iterable
			ns.forEach( obj, function( value, index ) {
				results[results.length] = map.call( context, value, index, obj );
			});
		}

		return results;
	};

	/**
	 * Looks through each value in the collection, returning the first one that
	 * passes a truth test.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Function} test
	 *      the function called for each item that tests for fulfillment,
	 *      called with the three arguments
	 *      <span class="fixedFont">(item, indexOrKey, collection)</span>
	 *
	 * @param [context]
	 *      the optional calling context to use,
	 *      accessible from the test as <span class="fixedFont">this</span>.
	 *
	 * @returns
	 *      The item found, or <span class="fixedFont">undefined</span>.
	 *
	 * @name aperture.util.find
	 * @function
	 */
	ns.find = function ( obj, test, context ) {
		var result;

		if ( obj != null ) {
			ns.forEachUntil( obj, function( value, index ) {
				if ( test.call( context, value, index, obj ) ) {
					result = value;
					return true;
				}
			}, true );
		}

		return result;
	};

	/**
	 * Looks through a collection, returning true if
	 * it includes the specified value.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param value
	 *      the value to look for using the === test.
	 *
	 * @returns
	 *      True if found, else false.
	 *
	 * @name aperture.util.has
	 * @function
	 */
	ns.has = function ( collection, value ) {
		if ( !collection ) return false;

		// TODO: use indexOf here if able.
		return !!ns.forEachUntil( collection, function ( item ) {
			return item === value;
		}, true );
	};

	/**
	 * Looks through a collection, returning true if
	 * it contains any of the specified values.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Array} values
	 *      the values to look for using the === test.
	 *
	 * @returns
	 *      True if any are found, else false.
	 *
	 * @name aperture.util.hasAny
	 * @function
	 */
	ns.hasAny = function ( collection, values ) {
		if ( !collection || !values ) return false;

		return !!ns.forEachUntil( collection, function ( value ) {
			return ns.indexOf( values, value ) !== -1;
		}, true );
	};

	/**
	 * Looks through a collection, returning true if
	 * it contains all of the specified values. If there
	 * are no values to look for this function returns false.
	 *
	 * @param {Array|Object|arguments} collection
	 *      the collection to search.
	 *
	 * @param {Array} values
	 *      the values to look for using the === test.
	 *
	 * @returns
	 *      True if any are found, else false.
	 *
	 * @name aperture.util.hasAll
	 * @function
	 */
	ns.hasAll = function ( collection, values ) {
		if ( !collection || !values ) return false;

		return !!ns.forEachUntil( values, function ( value ) {
			return ns.indexOf( values, value ) !== -1;
		}, false );
	};

	/**
	 * Returns the index at which value can be found in the array,
	 * or -1 if not present. Uses the native array indexOf function
	 * if present.
	 *
	 * @param {Array} array
	 *      the array to search.
	 *
	 * @param item
	 *      the item to look for, using the === check.
	 *
	 * @returns {Number}
	 *      the index of the item if found, otherwise -1.
	 *
	 * @name aperture.util.indexOf
	 * @function
	 */
	ns.indexOf = function( array, item ) {
		if ( array != null ) {
			if ( nativeIndexOf && array.indexOf === nativeIndexOf ) {
				return array.indexOf( item );
			}

			// array-like?
			for ( var i = 0, l = array.length; i < l; i++ ) {
				if (array[i] === item) return i;
			}
		}
		return -1;
	};

	/**
	 * Returns a copy of the array with the specified values removed.
	 *
	 * @param {Array} array
	 *      the array to remove from.
	 *
	 * @param value
	 *      the item to remove, identified using the === check.
	 *
	 * @param etc
	 *      additional items to remove, as additional arguments.
	 *
	 * @returns {Array}
	 *      a new array with values removed
	 *
	 * @name aperture.util.without
	 * @function
	 */
	ns.without = function( array ) {
		var exclusions = slice.call( arguments, 1 );

		return ns.filter( array,
			function ( item ) {
				return !ns.has( exclusions, item );
		});
	};

	/**
	 * Copy all of the properties in the source object(s) over to the
	 * destination object, in order.
	 *
	 * @param {Object} destination
	 *      the object to extend.
	 *
	 * @param {Object} source
	 *      one or more source objects (supplied as additional arguments)
	 *      with properties to add to the destination object.
	 *
	 * @name aperture.util.extend
	 *
	 * @returns {Object}
	 *      the destination object
	 *
	 * @function
	 */
	ns.extend = function( obj ) {
		ns.forEach( slice.call( arguments, 1 ), function ( source ) {
			for ( var prop in source ) {
				if ( source[prop] !== undefined ) obj[prop] = source[prop];
			}
		});

		return obj;
	};

	/**
	 * Bind a function to an object, meaning that whenever the function is called,
	 * the value of <span class="fixedFont">this</span> will be the object.
	 * Optionally, bind initial argument values to the function, also known
	 * as partial application or 'curry'. This method delegates to a native
	 * implementation if ECMAScript 5 is present.
	 *
	 * @param {Function} function
	 *      the function to wrap, with bound context and, optionally, arguments.
	 *
	 * @param {Object} object
	 *      the object to bind to be the value of <span class="fixedFont">this</span>
	 *      when the wrapped function is called.
	 *
	 * @param [arguments...]
	 *      the optional argument values to prepend when the wrapped function
	 *      is called, which will be followed by any arguments supplied by the caller
	 *      of the bound function returned here.
	 *
	 * @returns {Function}
	 *      the bound function.
	 *
	 * @name aperture.util.bind
	 * @function
	 */
	ns.bind = function bind(func, context) {

		// native delegation
		if (nativeBind && func.bind === nativeBind) {
			return nativeBind.apply(func, slice.call(arguments, 1));
		}

		// must be a function
		if ( !ns.isFunction(func) ) throw new TypeError;

		var args = slice.call(arguments, 2), bound;

		// return the bound function
		return bound = function() {

			// normal call pattern: obj.func(), with curried arguments
			if ( !(this instanceof bound) )
				return func.apply( context, args.concat(slice.call(arguments)) );

			// constructor pattern, with curried arguments.
			ctor.prototype = func.prototype;

			var self = new ctor,
				result = func.apply( self, args.concat(slice.call(arguments)) );

			return (Object(result) === result)? result : self;
		};
	};

	/**
	 * Returns true if argument appears to be a number.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isNumber
	 * @function
	 */
	ns.isNumber = function( obj ) {
		return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
	};

	/**
	 * Returns true if argument appears to be a string.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isString
	 * @function
	 */
	ns.isString = function(obj) {
		return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
	};

	/**
	 * Returns true if argument is an array. This method delegates to a native
	 * implementation if ECMAScript 5 is present.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isArray
	 * @function
	 */
	ns.isArray = nativeIsArray || function(obj) {
		return toString.call(obj) === '[object Array]';
	};

	/**
	 * Returns true if argument appears to be a function.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isFunction
	 * @function
	 */
	ns.isFunction = function(obj) {
		return !!(obj && obj.constructor && obj.call && obj.apply);
	};

	/**
	 * Returns true if argument appears to be an object.
	 *
	 * @param candidate
	 *      the candidate to test.
	 *
	 * @returns true if of the queried type
	 *
	 * @name aperture.util.isObject
	 * @function
	 */
	ns.isObject = function(obj) {
		return obj === Object(obj);
	};

	return ns;

}(aperture.util || {}));

