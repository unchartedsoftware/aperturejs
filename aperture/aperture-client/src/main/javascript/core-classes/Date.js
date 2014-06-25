/**
 * Source: Date.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Date APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var util = aperture.util;

	var dateFields = ['FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'];

	namespace.Date = aperture.Class.extend( 'aperture.Date', {
		/** @private */
		_utc: true,
		/** @private */
		_date: null,

		/**
		 * @class 
		 *
		 * @constructs
		 * @description
		 * Constructs a new Date object. By default the date will be represented (e.g. via 
		 * methods like get('Hours')) in UTC.
		 *
		 * @param {String|Number|Date} date
		 *      the date value (as a string to be parsed, number of milliseconds past epoch,
		 *      or existing aperture/javascript Date object)
		 * @param {Object} [options]
		 *      an optional options object. Currently only supports local: true which directs
		 *      the date object to represent time units in local time.
		 *
		 * @returns {this}
		 *      a new Date
		 */
		init: function(date, options) {
			if (Object.prototype.toString.call(date) === '[object Date]') {
				this._date = date;
			} else {
				this._date = new Date(date.valueOf());
			}
			this._utc = !(options && options.local);
		},

		/**
		 * Returns the unit value (e.g. year, minute, etc) of the date. If no unit given, returns
		 * a hash of all date unit fields to values
		 *
		 * @param {String} [unit]
		 *  If given, one of 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'.
		 *  If not specified, will return an object containing values for all fields.
		 *
		 * @returns {Number|Object}
		 *  If a unit is given, returns the numerical value. If no unit, returns an object containing
		 *  values for each field where the keys are the supported unit names.
		 */
		get: function(unit) {
			if (unit) {
				var getter = 'get' + (this._utc ? 'UTC' : '') + unit;
				if (!this._date[getter]) {
					throw new Error('Unrecognized date unit: ' + unit);
				}
				return this._date[getter]();
			} else {
				var self = this, 
					result = {};
				util.forEach(dateFields, function(unit) {
					result[unit] = self.get(unit);
				});
				return result;
			}
		},

		/**
		 * Sets one or more units of this date to a given value. Supports setting one unit at a time
		 * or multiple units at once. This function mutates the Date object.
		 *
		 * @example
		 * // Set only the year to 1997
		 * date.set(1997, 'FullYear');
		 *
		 * // Date and Hour
		 * date.set({
		 *   Date: 18,
		 *   Hours: 7
		 * });
		 *
		 * @param {Number|Object} value
		 *  If a number is given it must be combined with a unit. The number + unit will be used to set
		 *  the desired value. If an object is given it must contain keys from the set of allowed units.
		 *
		 * @param {String} [unit]
		 *  Optional, one of 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		set: function(value, unit) {
			var prefix = (this._utc ? 'setUTC' : 'set');

			if (util.isObject(value)) {
				var newValues = util.extend(this.get(), value);
				this._date[prefix+'FullYear']( newValues.FullYear, newValues.Month, newValues.Date );
				this._date[prefix+'Hours']( newValues.Hours, newValues.Minutes, newValues.Seconds, newValues.Milliseconds );
			} else {
				if (!this._date[prefix+unit]) {
					throw new Error('Unrecognized date unit: ' + unit);
				}
				this._date[prefix+unit](value);
			}

			return this;
		},

		/**
		 * Alters the date's timezone, sets to UTC. The actual date-time represented by this object
		 * remains unchanged. Calling this only affects the numbers returned via get('Hours'), etc.
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		utc: function() {
			this._utc = true;
			return this;
		},



		/**
		 * Alters the date's timezone, sets to the local timezone. The actual date-time represented by this object
		 * remains unchanged. Calling this only affects the numbers returned via get('Hours'), etc.
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		local: function() {
			this._utc = false;
			return this;
		},

		/**
		 * Returns the number of milliseconds since the Unix Epoch. Equivalent to JavaScript built-in Date
		 * .valueOf() and .getTime().
		 *
		 * @returns {Number}
		 *  The number of milliseconds since the unix epoch.
		 */
		valueOf: function() {
			return this._date.valueOf();
		},

		/**
		 * Adds the specified value and unit of time to this Date object.
		 *
		 * @example
		 * // Adds 12 hours to the date
		 * date.add(12, 'Hours');
		 *
		 * @param {Number} value
		 *  The numerical value of the value/unit combination to add to the current date.allowed units.
		 *
		 * @param {String} unit
		 *  One of 'FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds', 'Milliseconds'
		 *
		 * @returns {this}
		 *  The modified date object.
		 */
		add: function(value, unit) {
			var normalizedUnit = (this._utc ? 'UTC' : '') + unit;
			this._date['set'+normalizedUnit]( this._date['get'+normalizedUnit]() + value);
			return this;
		},

		/**
		 * JavaScript standard toString function. Delegates to JavaScript built-in Date object's
		 * toString or toUTCString depending on date's timezone setting.
		 *
		 * @returns {String}
		 *  String representation of the current date.
		 */
		toString: function() {
			if (this._utc) {
				return this._date.toUTCString();
			} else {
				return this._date.toString();
			}
		}
	});

	return namespace;
}(aperture || {}));