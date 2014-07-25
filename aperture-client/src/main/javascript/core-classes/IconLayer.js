/**
 * Source: IconLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Icon Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	var defaults = {
			'x' : 0,
			'y' : 0,
			'width' : 24,
			'height' : 24,
			'opacity': ''
		},
		ontoDefaults = {
			'ontology' : 'aperture-hscb',
			'type' : 'undefined',
			'attributes' : {},
			'format' : undefined
		};

	// assumes pre-existence of layer.
	namespace.IconLayer = aperture.Layer.extend( 'aperture.IconLayer',

		/** @lends aperture.IconLayer# */
		{
			/**
			 * @class Represents a layer of point located icons representing ontological
			 * types with attributes. Icons may vary in size.<br><br>
			 *
			 * In addition to core {@link aperture.Layer Layer} properties, icon layer properties include all icon
			 * <a href='aperture.palette.html#.icon'>palette</a> properties, and the following:
			 *
			 * @mapping {String} url
			 *   The url of the icon to use. This optional property is provided for situations when a
			 *   specific image is desired, outside of the ontological resolution of types to symbols.
			 *
			 * @mapping {Number=0.5} anchor-x
			 *   The x-anchor point in the range [0,1] for the icon, where 0.5 is the centre.
			 *
			 * @mapping {Number=0.5} anchor-y
			 *   The y-anchor point in the range [0,1] for the icon, where 0.5 is the centre.
			 *
			 * @mapping {Number=1.0} opacity
			 *   How opaque the icon will be in the range [0,1].
			 *
			 * @mapping {Number=1} icon-count
			 *   The number of icons to be drawn.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 */
			init : function( spec, mappings ) {
				aperture.Layer.prototype.init.call(this, spec, mappings );
			},

			// type flag
			canvasType : aperture.canvas.VECTOR_CANVAS,

			/*
			 * Render implementation
			 */
			render : function( changeSet ) {

				// FOR NOW - process all changes INEFFICIENTLY as total rebuilds.
				var toProcess = changeSet.updates,
					nIcons = toProcess.length, i;

				// Handle adds
				for( i=nIcons-1; i>=0; i-- ) {
					var node = toProcess[i],
						data = node.data,
						gfx = node.graphics,
						w = node.width,
						h = node.height,
						icons = node.userData.icons || (node.userData.icons = []),
						index;

					var numIcons = this.valueFor('icon-count', data, 1);
					var visiblePoints = 0;
					for (index = 0; index < numIcons; index++){
						rattrs = this.valuesFor(defaults, data, [index]);

						// either a hard-coded url or use the palette to resolve it
						rattrs.x = rattrs.x * w + node.position[0] - this.valueFor('anchor-x', data, 0.5, index) * rattrs.width;
						rattrs.y = rattrs.y * h + node.position[1] - this.valueFor('anchor-y', data, 0.5, index) * rattrs.height;
						rattrs.src = this.valueFor('url', data, '', index);
						if (!rattrs.src) {
							var oattrs = this.valuesFor(ontoDefaults, data);

							if (oattrs.format !== 'svg') {
								oattrs.width = rattrs.width;
								oattrs.height = rattrs.height;
							}
							rattrs.src = aperture.palette.icon(oattrs);
						}

						var visual = icons[visiblePoints];

						// PROCESS GRAPHICS.
						if (visual) {
							gfx.attr(visual, rattrs, changeSet.transition);
						} else {
							visual = gfx.image(
									rattrs.src,
									rattrs.x,
									rattrs.y,
									rattrs.width,
									rattrs.height);

							gfx.attr(visual, rattrs);
							gfx.apparate(visual, changeSet.transition);
							icons.push(visual);
						}

						gfx.data( visual, data );
						visiblePoints++;
					}
					// Remove any obsolete visuals.
					if (icons.length > visiblePoints){
						gfx.removeAll(icons.splice(visiblePoints));
					}
				}
			}
		}
	);

	return namespace;

}(aperture || {}));

