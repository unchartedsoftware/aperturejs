/**
 * Source: palette.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines the palette functions for Aperture.
 */

/**
 * @namespace Aperture exposes a global base palette in order to promote
 *	and ease use of coordinated, complementary, cognitively effective visual
 *  attributes in a display context. Palettes support derivation,
 *  providing a concise and systematic method of defining properties
 *  through the articulation of relationships.
 *  <br><br>
 *
 *  The base palette is populated at load time from the aperture.palette
 *  configuration provider. Its prototype includes the 17 named colors
 *  defined by CSS 2.1 for runtime access only. Support for exporting
 *  <a href="http://www.lesscss.org">LESS CSS</a> compatible variable
 *  lists for import is also provided for deriving CSS style sheet values
 *  from base palette entries. LESS provides a concise and systematic
 *  method of defining CSS properties for style sheets, however
 *  if use of LESS is not an option, export of
 *  named CSS classes for specifically targeted style sheet properties
 *  (e.g. color, border-color, etc) is also supported.
 */
aperture.palette = (function(ns) {

	var // CSS 2.1 colors
		baseColors = {
			'white'  : '#ffffff',
			'silver' : '#c0c0c0',
			'gray'	 : '#808080',
			'black'  : '#000000',
			'red'    : '#FF0000',
			'maroon' : '#800000',
			'orange' : '#ffa500',
			'yellow' : '#ffff00',
			'olive'  : '#808000',
			'lime'   : '#00ff00',
			'green'  : '#008000',
			'aqua'   : '#00ffff',
			'teal'   : '#008080',
			'blue'   : '#0000ff',
			'navy'   : '#000080',
			'fuchsia': '#ff00ff',
			'purple' : '#800080'
		},

		// TODO: this is the protovis ten - pick a good ten that don't include something too
		// close to our indicative colors like straight red and green, or the highlight color.
		baseColorSets = {
			'default' : [
				'#1f77b4',
				'#ff7f0e',
				'#2ca02c',
				'#d62728',
				'#9467bd',
				'#8c564b',
				'#e377c2',
				'#7f7f7f',
				'#bcbd22',
				'#17becf'
				]
		},

		// inheritance makes it easier to distinguish overrides from
		// standard entries but still use the same lookup.
		colors = aperture.util.viewOf(baseColors),
		colorSets = baseColorSets,
		restUrl = aperture.io.restUrl;
	
	/**
	 * @private
	 * 
	 * enforce implemented value constraints already on client side so that we
	 * are not hitting the server or storing more images client side than we need to.
	 */
	function constrain100(value) {
		if (value == null) {
			return 100;
		} 
		
		return 20* Math.round(5* Math.max(0, Math.min(1, value)));
	}


	// parchment color constants.
	var rgb = aperture.Color.fromRGB,
		c00 = rgb(248,210,158),
	    c10 = rgb(253,231,192),
	    c01 = rgb(202,202,202),
	    c11 = rgb(255,255,255),
	    black = rgb(0,0,0);
	
	/**
	 * @private
	 * 
	 * returns a color for the parchment by bilinear interpolation. roughly the same as the image.
	 */
	function parchmentColor(v_, _v) {
		return c00.blend(c10, v_).blend(c01.blend(c11, v_), _v);
	}
	
	/**
	 * @private
	 * 
	 * returns the url for the parchment background.
	 */
	function parchmentUrl(confidence, currency) {
		return restUrl('/parchment/' + confidence + '/' + currency);
	}
	
	/**
	 * @name aperture.palette.color
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {aperture.Color}
	 *		a color object
	 */
	ns.color = function(id) {
		return colors[id];
	};

	/**
	 * @name aperture.palette.colors
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {Array}
	 *		an Array of color objects
	 */
	ns.colors = function (id) {
		return colorSets[id || 'default'];
	};

	/**
	 * @name aperture.palette.size
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {Number}
	 *		a Number
	 */
	ns.size = function (id) {
		return sizes[id];
	};

	/**
	 * @name aperture.palette.sizes
	 * @function
	 *
	 * @param {String} id
	 *      the identifying name of the palette entry.
	 *
	 * @returns {Array}
	 *		an array of Numbers
	 */
	ns.sizes = function (id) {
		return sizeSets[id];
	};

	/**
	 * @name aperture.palette.parchmentCSS
	 * @function
	 * 
	 * @description
	 * Returns CSS properties to reflect confidence using background texture. Confidence of information is 
	 * indicated by how pristine the parchment is, and currency of information is indicated by
	 * how white the parchment is. Dated information yellows with time.
	 * 
	 * @param {Number} confidence 
	 *      an indication of confidence, as a value between 0 and 1 (confident).
	 *
	 * @param {Number} [currency] 
	 *      an indication of how current the information is, as a value between 0 and 1 (current).
	 * 
	 * @returns {Object}
	 *      an object with CSS properties, that includes background image and border color.
	 */
	ns.parchmentCSS = function(confidence, currency) {
		
		// constrain these
		confidence = constrain100(confidence);
		currency = constrain100(currency);

		var color = parchmentColor(0.01*confidence, 0.01*currency);
		
		return {
			'background-color': color.toString(),
			'background-image': confidence < 99? 'url('+ parchmentUrl(confidence, currency)+ ')' : '',
			'border-color': color.blend(black, 0.25).toString()
		};
	};
	
	/**
	 * @name aperture.palette.parchmentClass
	 * @function
	 * 
	 * @description
	 * Returns a CSS class used to reflect confidence using background texture. Confidence of information is 
	 * indicated by how pristine the parchment is, and currency of information is indicated by
	 * how white the parchment is. Dated information yellows with time.
	 * 
	 * @param {Number} confidence 
	 *      an indication of confidence, as a value between 0 and 1 (confident).
	 *
	 * @param {Number} [currency] 
	 *      an indication of how current the information is, as a value between 0 and 1 (current).
	 * 
	 * @returns {String}
	 *      the name of a CSS class defined in rest/parchment.css.
	 */
	ns.parchmentClass = function(confidence, currency) {
		return 'aperture-parchment-' + constrain100(confidence) + '-' + constrain100(currency);
	};

	/**
	 * @name aperture.palette.asLESS
	 * @function
	 *
	 * @returns {String}
	 *		a string representation in LESS CSS variable format.
	 *
	 * @see <a href="http://lesscss.org">lesscss.org</a>
	 */
	ns.asLESS = function () {

		// header and color block
		var str = '// Generated Aperture Palette Export for LESS CSS\n\n// COLORS (excluding CSS 2.1)\n';

		// write each
		aperture.util.forEach( colors, function ( color, key ) {
			str += '@' + key + ': ' + color + ';\n';
		});

		// color set block
		str += '\n// COLOR SETS\n';

		// write each
		aperture.util.forEach( colorSets, function ( colorSet, key ) {
			var prefix = '@' + key + '-';

			aperture.util.forEach( colorSet, function ( color, index ) {
				str += prefix + index + ': '+ color + ';\n';
			});
		});

		return str;
	};

	//
	// Register to receive style information
	//
	aperture.config.register('aperture.palette', function(cfg) {
		var paletteExts = cfg['aperture.palette'];

		if( paletteExts ) {
			var c = paletteExts.color, p;
			
			// extend colors with configured colors
			if ( c ) {
				for ( p in c ) {
					if (c.hasOwnProperty(p)) {
						if (p.toLowerCase) {
							p = p.toLowerCase();
							colors[p] = c[p];
						}
					}
				}
			}

			// extend default color sets with clones of configured color sets.
			if ( paletteExts.colors ) {
				aperture.util.forEach( paletteExts.colors, function ( value, key ) {
					colorSets[key] = value.slice();
				});
			}

			// TODO: sizes etc.
		}
	});

	// used in the function below.
	var u = encodeURIComponent,
		supportsSvg = !!(window.SVGAngle || document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')),
		logSvgWarn = true;

	/**
	 * @name aperture.palette.icon
	 * @function
	 *
	 * @requires an Aperture icon service
	 * @requires jQuery
	 *
	 * @param {Object} properties
	 *      the specification of the icon
	 *
	 * @param {String} properties.type
	 *      The ontological type for the icon service to resolve within the namespace of the ontology.
	 *
	 * @param {String} [properties.ontology='aperture-hscb']
	 *      Refers to the namespace used by any active icon services to resolve types with attributes to icons.
	 *      Note that the mapping of ontology to symbology is a function of the icon services configured and
	 *      running. The default symbology is a core set of icons with a specific focus on
	 *      socio-cultural themes and media artifacts of socio-cultural analysis.

	 * @param {Object} [properties.attributes]
	 *      The optional attributes of the ontological type, for interpretation by the icon service.
	 *
	 * @param {Number} [properties.width=24]
	 *      The width of the icon. Defaults to 24.
	 *
	 * @param {Number} [properties.height=24]
	 *      The height of the icon. Defaults to 24.
	 *
	 * @param {String} [properties.format]
	 *      The image format of the icon. When absent the format is left to the discretion of the
	 *      icon service. Support for specific formats is service dependent, however the default
	 *      aperture-hscb ontology supports
	 *      <span class="fixedFont">png</span> (a lossless compressed raster format with transparency),
	 *      <span class="fixedFont">svg</span> (a vector format that can draw nicely at any scale), and
	 *      <span class="fixedFont">jpeg</span> (an opaque, lossy but highly compressible format).
	 *
	 * @returns {String}
	 *		a url
	 */
	ns.icon = function (properties) {
		var frmt = properties.format,
			attr = properties.attributes,
			path = '/icon/' +
				u(properties.ontology || 'aperture-hscb') + '/' +
				u(properties.type) +
				'?iconWidth=' + (properties.width || 24) +
				'&iconHeight=' + (properties.height || 24);

		if (frmt) {
			// check - can't use svg if running in vml.
			if (!supportsSvg && frmt.toLowerCase() === 'svg') {

				if (logSvgWarn) {
					aperture.log.warn("SVG icon format requested but this browser doesn't support it. Using PNG.");

					// only warn once
					logSvgWarn = false;
				}

				frmt = 'png';
			}

			path += '&iconFormat=' + frmt;
		}

		aperture.util.forEach( attr, function ( value, name ) {
			path += '&' + u(name) + '=' + u(value);
		});

		return restUrl(path);
	};

	return ns;

}(aperture.palette || {}));

