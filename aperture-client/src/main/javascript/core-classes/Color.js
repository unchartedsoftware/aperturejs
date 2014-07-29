/**
 * Source: Color.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Color APIs
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// PRIVATE

	var int = Math.round, // shortcut

		// base utility fn for parsing a color channel that handles percentages
		chAny = function ( str, pctF ) {

			// match number and optional pct
			var m = str.match( /([0-9\.]+)(%*)/ );

			// convert number
			var n = parseFloat( m[1] );

			// return result - if pct multiply by factor.
			return m[2]? n * pctF : n;
		},

		// derivativchAnyannel for ranges 0-255
		ch255 = function ( str ) {
			return int( chAny( str, 2.55 ));
		},

		// hsl to rgb conversion. h in degrees, s and l in 0 to 1.
		// because color is immutable we place this fn in private space.
		hsl = function( h, s, l, color ) {

			// clamp to legitimate ranges
			s = Math.min(1, Math.max(0, s));
			l = Math.min(1, Math.max(0, l));

			// shortcut for gray
			if (s == 0) {
				color.r = color.g = color.b = int( 255 * l );
				return;
			}

			// constants derived from s,l for calc below
			var q = (l <= 0.5) ? (l * (1 + s)) : (l + s - l * s);
			var p = 2 * l - q;

			// channel from offset in hue, subject to s+l
			function rgb1(h) {

				// clamp
				h-= Math.floor(h/360) * 360;

				// switch on four bands
				if (h < 60)  {
					return p + (q - p) * h / 60;
				} if (h < 180) {
					return q;
				} if (h < 240) {
					return p + (q - p) * (240 - h) / 60;
				}
				return p;
			}
			function rgb255( h ) {

				return int( 255 * rgb1( h ));
			}

			// push result to color
			color.r = rgb255( h + 120 );
			color.g = rgb255( h );
			color.b = rgb255( h - 120 );
			
			color.h = h;
			color.s = s;
			color.l = l;
			color.v = Math.max( color.r, color.g, color.b )/255;
		},

		// hsv to rgb conversion. h in degrees, s and v in 0 to 1.
		// because color is immutable we place this fn in private space.
		hsv = function( h, s, v, color ) {
			color.h = h;
			color.s = s;
			color.v = v;
		    
			h /= 60;
			
			var i = Math.floor(h),
				f = h - i,
				p = v * (1 - s),
				q = v * (1 - f * s),
				t = v * (1 - (1 - f) * s);

			switch(i % 6) {
				case 0: color.r = v; color.g = t; color.b = p; break;
				case 1: color.r = q; color.g = v; color.b = p; break;
				case 2: color.r = p; color.g = v; color.b = t; break;
				case 3: color.r = p; color.g = q; color.b = v; break;
				case 4: color.r = t; color.g = p; color.b = v; break;
				case 5: color.r = v; color.g = p; color.b = q; break;
			}
		    
			color.l = (Math.max(color.r, color.g, color.b) 
					+ Math.min(color.r, color.g, color.b)) / 2;
		    
			color.r = Math.round(color.r* 255);
			color.g = Math.round(color.g* 255);
			color.b = Math.round(color.b* 255);

		},

		// sets the hsl storage from the color's rgb.
		setHslv = function(color) {
			if (color.h != null) {
				return;
			}
			
			var r = color.r/ 255, 
				g = color.g/ 255,
				b = color.b/ 255;
		    
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if (max == min) {
				h = s = 0; // grayscale
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max){
					case r: h = (g - b) / d; break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h = ((h + 360) % 6) * 60;
			}

			color.h = h;
			color.s = s;
			color.l = l;
			color.v = max;
		},
		
		// two digit hexidecimalizer
		hex2 = function( num ) {
			num = num.toString(16);

			return num.length < 2? '0' + num : num;
		},

		// rgb[a] to string
		strFromVals = function ( r, g, b, a ) {
			// preserve alpha in the result color only if relevant.
			return ( a > 0.9999 )?
					('#'
						+ hex2( r )
						+ hex2( g )
						+ hex2( b ))
					: ('rgba('
						+ r.toString() + ','
						+ g.toString() + ','
						+ b.toString() + ','
						+ a.toString() + ')'
				);
		},

		// initialize the color string from the rgba values
		setStr = function ( color ) {
			color.color = strFromVals( color.r, color.g, color.b, color.a );
		},
		
		fromHSL, fromHSB;

		namespace.Color = aperture.Class.extend( 'aperture.Color',
		/** @lends aperture.Color.prototype */
		{
			/**
			 * @class Represents a color with support for runtime access of
			 * channel values. Since Aperture supports the use of CSS color string
			 * values, Color objects are used primarily for efficient manipulation
			 * of color, such as in mapping or filter operations.
			 *
			 * Colors are designed to be immutable.
			 * <br><br>
			 *
			 * Color values may be specified in hexadecimal, RGB, RGBA, HSL, HSLA,
			 * or named color form. Named colors include any colors configured in
			 * aperture.palette along with the standard 17 defined by CSS 2.1.<p>
			 *
			 * @constructs
			 * @extends aperture.Class
			 *
			 * @param {String} color
			 *   a name or css color value string.
			 *
			 * @returns {this}
			 *   a new Color
			 */
			init : function( color ) {

				// default in the no argument case is transparent black.
				if ( !color ) {
					this.r = this.g = this.b = this.a = 0;
					this.color = '#000000';
					return;
				}

				// case insensitive
				// TODO: consider always converting to rgb by calling setStr
				this.color = color = color.toLowerCase();

				// hexadecimal colors
				if (color.charAt(0) == '#') {

					// offset of second digit (covering #rgb and #rrggbb forms)
					var digit2 = (color.length === 7? 1:0),
						i = 0;

					// parse using base 16.
					this.r = parseInt( color.charAt( ++i ) + color.charAt( i+=digit2 ), 16 );
					this.g = parseInt( color.charAt( ++i ) + color.charAt( i+=digit2 ), 16 );
					this.b = parseInt( color.charAt( ++i ) + color.charAt( i+=digit2 ), 16 );
					this.a = 1;

					return;
				}

				var matchFn = color.match(/([a-z]+)\((.*)\)/i);

				// rgb, rgba, hsl, hsla
				if (matchFn) {

					// pull the three left chars and split up the arguments
					var func = matchFn[1].substring(0,3),
						args = matchFn[2].split(','),
						h,s,l;

					// alpha, or default opacity which is 1
					this.a = args.length > 3? chAny( args[3], 0.01 ) : 1;

					switch (func) {
					case 'rgb':
						this.r = ch255(args[0]);
						this.g = ch255(args[1]);
						this.b = ch255(args[2]);

						return;

					case 'hsl':
						// convert (leave hsl precision - we round post-op)
						h = chAny(args[0], 3.60);
						s = chAny(args[1], 0.01);
						l = chAny(args[2], 0.01);
						hsl( h, s, l, this );

						return;
					}
				}

				// assume named.
				color = aperture.palette.color( color );

				// log name lookups that are missing
				if ( !color ) {
					aperture.log.warn( 'unrecognized color ' + color );
				}

				// recurse once only to set from value
				this.init( color );
			},

			/**
			 * Blends this color with the supplied color and returns
			 * a resulting color. Blending provides comprehensive
			 * coverage of color derivation use cases in one function by
			 * intuitively specifying what the destination is and how much
			 * weight should be given the destination versus the source.
			 * For instance, rather than darken or lighten a foreground color blend it
			 * to the background color so it better adapts to a different
			 * color scheme.<p>
			 *
			 * If the color is supplied as a string value a Color object
			 * will be created for it, so in cases where this method is
			 * called frequently with the same color value but different weights
			 * it is better to pre-construct the color as an object and
			 * pass that in instead.
			 *
			 * @param {Color|String} color
			 *  the color to blend with.
			 *
			 * @param {Number} weight
			 *  the weighting of the supplied color in the blend
			 *  process, as a value from 0.0 to 1.0.
			 *
			 * @returns {aperture.Color}
			 *  a blended color
			 */
			blend : function ( color, weight ) {

				// convert to an object if isn't already
				if ( typeof color === 'string' ) {
					color = new namespace.Color( color );
				}

				var w1 = 1 - weight,
					c = new namespace.Color();
				
				c.r = int( w1 * this.r + weight * color.r );
				c.g = int( w1 * this.g + weight * color.g );
				c.b = int( w1 * this.b + weight * color.b );
				c.a = int((w1 * this.a + weight * color.a) * 1000 ) * 0.001;
				
				// initialize the color string
				setStr(c);
				
				return c;
			},

			/**
			 * Returns an array of interpolated colors between this color and the 
			 * toColor suitable for use in a map key. The first color will be 
			 * this color and the last will be the toColor.
			 * 
			 * @param {aperture.Color} toColor
			 *  the end color to interpolate to
			 * 
			 * @param {Number} bands
			 *  the number of colors to create
			 * 
			 * @returns {Array}
			 *  an array of colors, of length bands
			 */
			band : function ( toColor, bands ) {
				var a = [this];
				
				if (bands > 1) {
					a.length = bands;
	
					var base = bands-1, i;
					for (i=1; i< bands; i++) {
						a[i] = this.blend( toColor, i/base );
					}
				}
				return a;
			},
			
			/**
			 * Gets the hue as a value between 0 and 360, or if an
			 * argument is supplied returns a new color with the hue
			 * given but the same saturation and lightness.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for hue, or a new color with the hue specified.
			 */
			hue : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSL(value, this.s, this.l, this.a);
				}
				
				return this.h;
			},
			
			/**
			 * Gets the saturation as a value between 0 and 1, or if an
			 * argument is supplied returns a new color with the saturation
			 * given but the same hue and lightness as this color.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for saturation, or a new color with the saturation specified.
			 */
			saturation : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSL(this.h, value, this.l, this.a);
				}
				
				return this.s;
			},
			
			/**
			 * Gets the lightness as a value between 0 and 1, or if an
			 * argument is supplied returns a new color with the lightness
			 * given but the same hue and saturation as this color.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for lightness, or a new color with the lightness specified.
			 */
			lightness : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSL(this.h, this.s, value, this.a);
				}
				
				return this.l;
			},
			
			/**
			 * Gets the brightness as a value between 0 and 1, or if an
			 * argument is supplied returns a new color with the brightness
			 * given but the same hue and saturation as this color.
			 * 
			 * @returns {Number|aperture.Color}
			 *  a value for brightness, or a new color with the brightness specified.
			 */
			brightness : function( value ) {
				setHslv(this);
				
				if (value != null) {
					return fromHSB(this.h, this.s, value, this.a);
				}
				
				return this.v;
			},
			
			/**
			 * Returns the color value as a valid CSS color string.
			 *
			 * @returns {String}
			 *  a CSS color string.
			 */
			css : function () {
				return this.color;
			},

			/**
			 * Overrides Object.toString() to return the value of {@link css}().
			 *
			 * @returns {String}
			 *  a CSS color string.
			 */
			toString : function ( ) {
				// temp debug
				//return this.r + ',' + this.g + ',' + this.b + ',' + this.a;
				return this.color;
			}
		}
	);

	/**
	 * Constructs a new color from numeric hue/ saturation/ lightness values.
	 * Alternatively, the class constructor can be used to construct a color
	 * from an hsl[a] string.
	 *
	 * @param {Number} h
	 *  the hue as a number in degrees (0-360), or an object
	 *  with h,s,l[,a] properties.
	 * @param {Number} s
	 *  the saturation as a number from 0-1
	 * @param {Number} l
	 *  the lightness as a number from 0-1
	 * @param {Number} [a]
	 *  the alpha value as a number from 0-1
	 *
	 * @returns {aperture.Color}
	 *  the new color
	 * 
	 * @name aperture.Color.fromHSL
	 * @function
	 */
	namespace.Color.fromHSL = fromHSL = function (h, s, l, a) {
		var color = new namespace.Color();

		// object handler
		if (typeof h != 'number') {
			if (h.h == null) {
				return color;
			}

			s = h.s;
			l = h.l;
			a = h.a;
			h = h.h;
		}

		// assign alpha if present
		color.a = a != null? a : 1;

		// normalize percentages if specified as such
//		s > 1 && (s *= 0.01);
//		l > 1 && (l *= 0.01);

		// convert to rgb and store in color
		hsl(h, s, l, color);

		// initialize the color string
		setStr(color);

		return color;
	};

	/**
	 * Constructs a new color from numeric hue/ saturation/ brightness values.
	 *
	 * @param {Number} h
	 *  the hue as a number in degrees (0-360), or an object
	 *  with h,s,b[,a] properties.
	 * @param {Number} s
	 *  the saturation as a number from 0-1
	 * @param {Number} b
	 *  the brightness as a number from 0-1
	 * @param {Number} [a]
	 *  the alpha value as a number from 0-1
	 *
	 * @returns {aperture.Color}
	 *  the new color
	 * 
	 * @name aperture.Color.fromHSL
	 * @function
	 */
	namespace.Color.fromHSB = fromHSB = function (h, s, b, a) {
		var color = new namespace.Color();

		// object handler
		if (typeof h != 'number') {
			if (h.h == null) {
				return color;
			}

			s = h.s;
			b = h.b;
			a = h.a;
			h = h.h;
		}

		// assign alpha if present
		color.a = a != null? a : 1;

		// normalize percentages if specified as such
//		s > 1 && (s *= 0.01);
//		l > 1 && (l *= 0.01);

		// convert to rgb and store in color
		hsv(h, s, b, color);

		// initialize the color string
		setStr(color);

		return color;
	};

	/**
	 * Constructs a new color from numeric red/ green /blue values.
	 * Alternatively, the class constructor can be used to construct a color
	 * from an rgb[a] string.
	 *
	 * @param {Number} r
	 *  the red component as a number from 0-255, or an object
	 *  with r,g,b[,a] properties.
	 * @param {Number} g
	 *  the green component as a number from 0-255
	 * @param {Number} b
	 *  the blue component as a number from 0-255
	 * @param {Number} [a]
	 *  the alpha value as a number from 0-1
	 *
	 * @returns {aperture.Color}
	 *  the new color
	 * 
	 * @name aperture.Color.fromRGB
	 * @function
	 *
	 */
	namespace.Color.fromRGB = function (r, g, b, a) {
		var color = new namespace.Color();

		// object handler
		if (typeof r != 'number') {
			if (r.r == null) {
				return color;
			}

			g = r.g;
			b = r.b;
			a = r.a;
			r = r.r;
		}

		// assign
		color.r = r;
		color.g = g;
		color.b = b;
		color.a = a != null? a : 1;

		// initialize the color string
		setStr(color);

		return color;
	};

	/**
	 * Returns an array of interpolated colors between the first and 
	 * last color in the set of colors supplied, suitable for use in a 
	 * map key. This is a convenience function for rebanding colors
	 * (or banding colors from a scalar color map key) which simply
	 * calls the band function on the first color with the last color.
	 * 
	 * @param {Array} colors
	 *  the colors to band or reband between.
	 * 
	 * @param {Number} bands
	 *  the number of colors to create
	 * 
	 * @returns {Array}
	 *  an array of colors, of length bands
	 * 
	 * @name aperture.Color.band
	 * @function
	 */
	namespace.Color.band = function( colors, bands ) {
		if (colors && colors.length) {
			return colors[0].band(colors[colors.length-1], bands);
		}
	};
	
	return namespace;

}(aperture || {}));
