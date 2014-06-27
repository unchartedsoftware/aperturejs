/**
 * Source: Format.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
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

	var util = namespace.util;

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
			 * var hourFormat = aperture.Format.getTimeFormat( {precision: 'Hours'} );
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
			 */
			decimals : 0,
			
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
						var p = this.precision = Number(precision);
						if (p < 1) {
							var s = p.toString();
							var i = s.indexOf('.');
							if (i !== -1) {
								this.decimals = s.length-1-i;
							}
						}
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

				var s = value.toFixed(this.decimals);
				var i = s.indexOf('.');
				
				for (i = (i!==-1?i:s.length)-3; i > 0; i -= 3) {
					s = s.substring(0, i).concat(',').concat(s.substring(i));
				}
				
				return s;
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
	
	/**
	 * @private
	 * @class A Format object that translates numbers to currency
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
	namespace.CurrencyFormat = namespace.NumberFormat.extend( 'aperture.CurrencyFormat',
		{
			/**
			 * @private
			 *
			 * @param {Number} [precision] [prefix] [suffix]
			 *      The optional precision of the value to format. For numbers this
			 *      will be a base number to round to, such as 1 or 0.01.
			 *      
			 *      The optional prefix is a string value for the currency (i.e. '$')
			 *      
			 *      The optional prefix is a string value for the currency (i.e. 'USD')
			 *
			 * @returns {aperture.NumberFormat}
			 *      A new time format object.
			 */
			init : function (precision, prefix, suffix) {
				if (precision) {
					if (isNaN(precision)) {
						aperture.log.warn('Invalid precision "' + precision + '" in CurrencyFormat');
					} else {
						var p = this.precision = Number(precision);
						if (p < 1) {
							var s = p.toString();
							var i = s.indexOf('.');
							if (i !== -1) {
								this.decimals = s.length-1-i;
							}
						}
					}
				}
				this.prefix = prefix || '';
				this.suffix = suffix || '';
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
			format : function (value) {

				value = Number(value);
				
				var numberSuffix = '';
				
				var number = Math.abs(value);
				
				if (number >= 1000000000000) {
					numberSuffix = 'T';
					number *= 0.000000000001;
				} else if (number >= 1000000000) {
					numberSuffix = 'B';
					number *= 0.000000001;
				} else if (number >= 1000000) {
					numberSuffix = 'M';
					number *= 0.000001;
				} else if (number >= 1000) {
					numberSuffix = 'K';
					number *= 0.001;
				}
				
				if (this.precision) {
					number = Math.round(number / this.precision) * this.precision;
				}
				
				var sign = (value < 0) ? '-' : '';
				
				var s = number.toFixed(this.decimals);
				var i = s.indexOf('.');
				
				for (i = (i!==-1?i:s.length)-3; i > 0; i -= 3) {
					s = s.substring(0, i).concat(',').concat(s.substring(i));
				}
				
				return sign + this.prefix + s + numberSuffix + this.suffix;
			}
		}
	);

	/**
	 * Returns a number format object, suitable for formatting numeric values.
	 *
	 * @param {Number} [precision] [prefix] [suffix]
	 *      The optional precision of the value to format. For numbers this
	 *      will be a base number to round to, such as 1 or 0.01.
	 *      
	 *      The optional prefix is a string value for the currency (i.e. '$')
	 *      
	 *      The optional prefix is a string value for the currency (i.e. 'USD')
	 *
	 * @returns {aperture.Format}
	 *      a number format object.
	 *
	 * @name aperture.Format.getNumberFormat
	 * @function
	 */
	namespace.Format.getCurrencyFormat = function(precision, prefix, suffix) {
		return new namespace.CurrencyFormat(precision, prefix, suffix);
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
			var h = date.get('Hours');
			return h? (h < 13? String(h) : String(h - 12)) : '12';
		}
		function ampm( date ) {
			return date.get('Hours') < 12? 'am' : 'pm';
		}
		function millis( date ) {
			return ':' + ((date.get('Seconds')*1000 + date.get('Milliseconds'))/1000) + 's';
		}
		function ss( date ) {
			return ':' + pad2(date.get('Seconds')) + 's';
		}
		function hhmm( date ) {
			return hh12(date) + ':' + pad2(date.get('Minutes')) + ampm(date);
		}
		function hh( date ) {
			return hh12(date) + ampm(date);
		}
		function mondd( date ) {
			return months[date.get('Month')] + ' '+ date.get('Date');
		}
		function day( date ) {
			return days[date.get('Day')] + ' ' + mondd(date);
		}
		function mon( date ) {
			return months[date.get('Month')];
		}
		function year( date ) {
			return String(date.get('FullYear'));
		}
		function yy( date ) {
			return "'" + String(date.get('FullYear')).substring(start, end);
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
			/** @private */
			_utc: true,

			/**
			 * @private
			 *
			 * @param {Object|String} [options]
			 *      Optional options hash to affect time formatting behaviour. For backwards 
			 *      compatibility also supports passing precision (see below) as a string
			 *
			 * @param {String} [options.precision]
			 *      The optional precision of the value to format. For times this
			 *      will be a Date field reference, such as 'FullYear' or 'Seconds'.
			 *
			 * @param {Boolean} [options.local]
			 *      When true, causes the formatter to display times using the local 
			 *      timezone (vs the default UTC)
			 *
			 * @returns {aperture.TimeFormat}
			 *      A new time format object.
			 */
			init : function ( options ) {
				if (util.isString(options)) {
					options = {
						precision: options
					}
				}
				if (options && options.precision) {
					this.order = timeOrders[options.precision];

					if (!this.order) {
						aperture.log.warn('Invalid precision "' + options.precision + '" in TimeFormat');
					}
				}

				this._utc = !(options && options.local);
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
					if (!value.typeOf || !value.typeOf(aperture.Date)) {
						value = new aperture.Date(value, {local: !this._utc});
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
	 * @param {Object|String} [options]
	 *      Optional options hash to affect time formatting behaviour. For backwards 
	 *      compatibility also supports passing precision (see below) as a string
	 *
	 * @param {String} [options.precision]
	 *      The optional precision of the value to format. For times this
	 *      will be a Date field reference, such as 'FullYear' or 'Seconds'.
	 *
	 * @param {Boolean} [options.local]
	 *      When true, causes the formatter to display times using the local 
	 *      timezone (vs the default UTC)
	 *
	 * @returns {aperture.Format}
	 *      a time format object.
	 *
	 * @name aperture.Format.getTimeFormat
	 * @function
	 */
	namespace.Format.getTimeFormat = function( options ) {
		return new namespace.TimeFormat( options );
	};

	return namespace;

}(aperture || {}));

