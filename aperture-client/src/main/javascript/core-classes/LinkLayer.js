/**
 * Source: LinkLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Link Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// bow angle is based on the 2/4 control point ratio used below. cached for speed.
	var bowang = Math.atan(0.5),
		bowsin = Math.sin(bowang),
		bowcos = Math.cos(bowang);
	
	/**
	 * Given a link spec, calculate the links two endpoints, accounting
	 * for any offsets.
	 */
	function linkPath(linkSpec, linkStyle) {
		// Create a path connecting the source and target points.
		var sx = linkSpec.sx, sy = linkSpec.sy,
			tx = linkSpec.tx, ty = linkSpec.ty,
			dx = tx - sx, dy = ty - sy,
			len = Math.sqrt(dx*dx + dy*dy);

		if (len) {
			
			var sr = linkSpec.sr / len,
				tr = linkSpec.tr / len;

			// distance is long enough to draw a link?
			if (sr + tr < 1) {
				// offset vectors
				var srX = dx * sr,
					srY = dy * sr,
					trX =-dx * tr,
					trY =-dy * tr;

				// rotate offsets?
				if (linkStyle === 'arc') {
					sx += srX*bowcos + srY*bowsin;
					sy +=-srX*bowsin + srY*bowcos;
					
					tx += trX*bowcos - trY*bowsin;
					ty += trX*bowsin + trY*bowcos;
					
					var c1 = (sx + tx)/2 + (ty - sy)/4,
						c2 = (sy + ty)/2 + (sx - tx)/4;
					
					return 'M'+ sx + ',' + sy + 'Q' + c1 + ',' + c2 + ',' + tx + ',' + ty;
		
				} else {
					sx += srX;
					sy += srY;
					tx += trX;
					ty += trY;
					
					return 'M'+ sx + ',' + sy + 'L' + tx + ',' + ty;
				}
			}
		} 
		
		return '';
	}

	/**
	 * Processes some user constants, translating into dash array.
	 */
	function strokeStyle(attrs, style) {
		switch (style) {
		case 'none':
			attrs.opacity = 0;
		case '':
		case 'solid':
			return '';
		case 'dashed':
			return '- ';
		case 'dotted':
			return '. ';
		}
		
		return style;
	}
	
	// assumes pre-existence of layer.
	namespace.LinkLayer = aperture.Layer.extend( 'aperture.LinkLayer',

		/** @lends aperture.LinkLayer# */
		{
			/**
			 * @class A layer for rendering links between two layer nodes.
			 *
			 * @mapping {String='#aaa'} stroke
			 *  The color of the link.
			 * 
			 * @mapping {Number=1} stroke-width
			 *  The width of the link line.
			 * 
			 * @mapping {'solid'|'dotted'|'dashed'|'none'| String} stroke-style
			 *  The link line style as a predefined option or custom dot/dash/space pattern such as '--.-- '.
			 *  A 'none' value will result in the link not being drawn.
			 * 
			 * @mapping {'line'|'arc'} link-style
			 *  The type of line that should be used to draw the link, currently limited to
			 *  a straight line or clockwise arc of consistent degree.
			 * 
			 * @mapping {Boolean=true} visible
			 *  The visibility of a link.
			 * 
			 * @mapping {Number=1} opacity
			 *  The opacity of a link. Values for opacity are bound with the range [0,1], with 1 being opaque.
			 * 
			 * @mapping {Object} source
			 *  The source node data object representing the starting point of the link. The source node
			 *  data object is supplied for node mappings 'node-x', 'node-y', and 'source-offset' for
			 *  convenience of shared mappings.
			 * 
			 * @mapping {Number=0} source-offset
			 *  The distance from the source node position at which to begin the link. The source-offset
			 *  mapping is supplied the source node as a data object when evaluated.
			 * 
			 * @mapping {Object} target
			 *  The target node data object representing the ending point of the link. The target node
			 *  data object is supplied for node mappings 'node-x', 'node-y', and 'target-offset' for
			 *  convenience of shared mappings.
			 * 
			 * @mapping {Number=0} target-offset
			 *  The distance from the target node position at which to begin the link. The target-offset
			 *  mapping is supplied the target node as a data object when evaluated.
			 * 
			 * @mapping {Number} node-x
			 *  A node's horizontal position, evaluated for both source and target nodes.
			 * 
			 * @mapping {Number} node-y
			 *  A node's vertical position, evaluated for both source and target nodes.
			 * 
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 *
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
				var i, 
					links = changeSet.updates, 
					n = links.length,
					transition = changeSet.transition;
				
				for (i=0; i<n; i++) {
					var link = links[i];
					var linkData   = link.data;
					var sourceData = this.valueFor('source', linkData, null);
					var targetData = this.valueFor('target', linkData, null);
					
					var endpoints = {
						'sx': this.valueFor('node-x', sourceData, 0, linkData),
						'sy': this.valueFor('node-y', sourceData, 0, linkData),
						'sr': this.valueFor('source-offset', sourceData, 0, linkData),
						'tx': this.valueFor('node-x', targetData, 0, linkData),
						'ty': this.valueFor('node-y', targetData, 0, linkData),
						'tr': this.valueFor('target-offset', targetData, 0, linkData)
					};
								
					// create a path.
					var path= linkPath(endpoints, this.valueFor('link-style', linkData, 'line'));

					var attrs = {
						'opacity': this.valueFor('opacity', linkData, 1),
						'stroke' : this.valueFor('stroke', linkData, 'link'),
						'stroke-width' : this.valueFor('stroke-width', linkData, 1)
					};
					
					// extra processing on stroke style
					attrs['stroke-dasharray'] = strokeStyle(attrs, this.valueFor('stroke-style', linkData, ''));

					// now render it.
					if (link.cache) {
						attrs.path = path;
						link.graphics.attr(link.cache, attrs, transition);
						
					} else {
						link.cache = link.graphics.path(path);
						link.graphics.attr(link.cache, attrs);
					}
				}
					
			}
		}
	);

	return namespace;

}(aperture || {}));

