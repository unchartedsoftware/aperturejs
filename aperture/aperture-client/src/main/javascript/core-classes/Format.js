/**
 * Source: Format.js
 * Copyright (c) 2013 Oculus Info Inc.
 * @fileOverview Formats values.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// TODO: extend these to take precise format specifications as a string.

	/**
	 * @class Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values for display, but may be used independently as well.
	 *
	 * @extends aperture.Class
	 *
	 * @description
	 * The default implementation of Format does nothing other than use
	 * the String() function to coerce the value to a String. Default formats
	 * for numbers and times are provided by the appropriate static method.
	 *
	 * @name aperture.Format
	 */
	namespace.Format = namespace.Class.extend( 'aperture.Format',
		/** @lends aperture.Format.prototype */
		{
			/**
			 * Formats the specified value.
			 *
			 * @param value
			 *      The value to format.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function ( value ) {
				return String(value);
			},

			/**
			 * Given a level of precision in type specific form, returns
			 * the next (lesser) level of precision in type specific form,
			 * if and only if such orders of formatting are required for
			 * full expression of the value.
			 *
			 * This method is often used for a date axis and is best expressed
			 * by an example.
			 * <br><br>
			 * When an axis is labeled to the precision of
			 * hours for instance, best practice would dictate that each
			 * hour not be labeled repeatedly by date, month and year,
			 * even those exist in the data. However if the axis spanned
			 * days, it would be desirable to label the beginning of each
			 * day, secondarily to each hour. This method provides the means
			 * of doing so:
			 *
			 * @example
			 * var hourFormat = aperture.Format.getTimeFormat( 'Hours' );
			 *
			 * // displays 'Date'
			 * alert( hourFormat.nextOrder() );
			 *
			 * @returns
			 *      The next precision level, or undefined if there isn't one.
			 */
			nextOrder : function () {
			}
		}
	);


	/**
	 * @private
	 * @class A Format object that translates numbers to
	 * Strings. Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values, but may be used independently as well.
	 *
	 * @extends aperture.Format
	 *
	 * @description
	 * Constructs a number format.
	 *
	 * @name aperture.NumberFormat
	 */
	namespace.NumberFormat = namespace.Format.extend( 'aperture.NumberFormat',
		{
			/**
			 * @private
			 *
			 * @param {Number} [precision]
			 *      The optional precision of the value to format. For numbers this
			 *      will be a base number to round to, such as 1 or 0.001.
			 *
			 * @returns {aperture.NumberFormat}
			 *      A new time format object.
			 */
			init : function ( precision ) {
				if (precision) {
					if (isNaN(precision)) {
						aperture.log.warn('Invalid precision "' + precision + '" in NumberFormat');
					} else {
						this.precision = precision;
					}
				}
			},

			/**
			 * @private
			 * Formats the specified value.
			 *
			 * @param {Number} value
			 *      The value to format.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function ( value ) {

				// precision based formatting?
				if ( value != null && this.precision ) {
					value = Math.round( value / this.precision ) * this.precision;
				} else {
					value = Number(value);
				}

				return String(value);
			}
		}
	);

	/**
	 * Returns a number format object, suitable for formatting numeric values.
	 *
	 * @param {Number} [precision]
	 *      The optional precision of the value to format. For numbers this
	 *      will be a base number to round to, such as 1 or 0.001.
	 *
	 * @returns {aperture.Format}
	 *      a number format object.
	 *
	 * @name aperture.Format.getNumberFormat
	 * @function
	 */
	namespace.Format.getNumberFormat = function( precision ) {
		return new namespace.NumberFormat( precision );
	};

	// create the hash of time orders.
	// use discrete format functions for speed but don't pollute our closure with them.
	var timeOrders = (function () {

		// DATE FORMATTING THINGS
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
			days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			y = 'FullYear', d = 'Date', m = 'Minutes';

		// time format functions.
		function pad2( num ) {
			return num < 10? '0' + num : String(num);
		}
		function hh12( date ) {
			var h = date.getHours();
			return h? (h < 13? String(h) : String(h - 12)) : '12';
		}
		function ampm( date ) {
			return date.getHours() < 12? 'am' : 'pm';
		}
		function millis( date ) {
			return ':' + ((date.getSeconds()*1000 + date.getMilliseconds())/1000) + 's';
		}
		function ss( date ) {
			return ':' + pad2(date.getSeconds()) + 's';
		}
		function hhmm( date ) {
			return hh12(date) + ':' + pad2(date.getMinutes()) + ampm(date);
		}
		function hh( date ) {
			return hh12(date) + ampm(date);
		}
		function mondd( date ) {
			return months[date.getMonth()] + ' '+ date.getDate();
		}
		function day( date ) {
			return days[date.getDay()] + ' ' + mondd(date);
		}
		function mon( date ) {
			return months[date.getMonth()];
		}
		function year( date ) {
			return String(date.getFullYear());
		}
		function yy( date ) {
			return "'" + String(date.getFullYear()).substring(start, end);
		}

		return {
			'FullYear'     : { format : year },
			'Year'         : { format : yy },
			'Month'        : { format : mon,    next : y },
			'Date'         : { format : mondd,  next : y },
			'Day'          : { format : mondd,  next : y },
			'Hours'        : { format : hh,     next : d },
			'Minutes'      : { format : hhmm,   next : d },
			'Seconds'      : { format : ss,     next : m },
			'Milliseconds' : { format : millis, next : m }
		};

	}());

	/**
	 * @private
	 * @class A Format object that translates times to
	 * Strings. Format objects are used by {@link aperture.Scalar Scalars} for formatting
	 * values, but may be used independently as well.
	 *
	 * @extends aperture.Format
	 *
	 * @description
	 * Constructs a time format.
	 *
	 * @name aperture.TimeFormat
	 */
	namespace.TimeFormat = namespace.Format.extend( 'aperture.TimeFormat',

		{
			/**
			 * @private
			 *
			 * @param {String} [precision]
			 *      The optional precision of the value to format. For times this
			 *      will be a Date field reference, such as 'FullYear' or 'Seconds'.
			 *
			 * @returns {aperture.TimeFormat}
			 *      A new time format object.
			 */
			init : function ( precision ) {
				if (precision) {
					this.order = timeOrders[precision];

					if (!this.order) {
						aperture.log.warn('Invalid precision "' + precision + '" in TimeFormat');
					}
				}
			},

			/**
			 * @private
			 * Formats the specified value.
			 *
			 * @param {Date|Number} value
			 *      The value to format, as a Date or time in milliseconds.
			 *
			 * @returns {String}
			 *      The formatted value.
			 */
			format : function ( value ) {

				// precision based formatting?
				if ( value != null ) {
					if (!value.getTime) {
						value = new Date(value);
					}
					if ( this.order ) {
						return this.order.format( value );
					}
				}

				return String(value);
			},

			/**
			 * @private
			 * @returns the next (lesser) logical level of precision, if and only if such
			 * orders of formatting are required for full expression of the value.
			 */
			nextOrder : function () {
				if ( this.order ) {
					return this.order.next;
				}
			}
		}
	);

	/**
	 * Returns a time format object, suitable for formatting dates and times.
	 *
	 * @param {String} [precision]
	 *      The optional precision of the value to format. For times this
	 *      will be a Date field reference, such as 'FullYear' or 'Seconds'.
	 *
	 * @returns {aperture.Format}
	 *      a time format object.
	 *
	 * @name aperture.Format.getTimeFormat
	 * @function
	 */
	namespace.Format.getTimeFormat = function( precision ) {
		return new namespace.TimeFormat( precision );
	};

	return namespace;

}(aperture || {}));

