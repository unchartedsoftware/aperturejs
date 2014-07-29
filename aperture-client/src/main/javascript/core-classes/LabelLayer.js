/**
 * Source: LabelLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Text Layer
 */

aperture = (
/** @private */
function(namespace) {

	// predefined orientations.
	var orientations = {
		horizontal : 0,
		vertical: -90
	}, isString = aperture.util.isString;
	
	namespace.LabelLayer = namespace.Layer.extend( 'aperture.LabelLayer',
	/** @lends aperture.LabelLayer# */
	{
		/**
		 * @augments aperture.Layer
		 * @requires a vector canvas
		 * @class Creates a layer displaying text at specific locations.

		 * @mapping {Number=1} label-count
		 *   The number of labels to be drawn.

		 * @mapping {Number=1} label-visible
		 *   The visibility of a label.

		 * @mapping {String} text
		 *   The text to be displayed.

		 * @mapping {String='black'} fill
		 *   The color of a label.

		 * @mapping {Number=0} x
		 *   The horizontal position at which the label will be anchored.

		 * @mapping {Number=0} y
		 *   The vertical position at which the label will be anchored.

		 * @mapping {Number=0} offset-x
		 *   The offset along the x-axis by which to shift the text after it has been positioned at (x,y).

		 * @mapping {Number=0} offset-y
		 *   The offset along the y-axis by which to shift the text after it has been positioned at (x,y).

		 * @mapping {Number=1.0} opacity
		 *   How opaque the label will be in the range [0,1].

		 * @mapping {'middle'|'start'|'end'} text-anchor
		 *   How the label is aligned with respect to its x position.

		 * @mapping {'middle'|'top'|'bottom'} text-anchor-y
		 *   How the label is aligned with respect to its y position.

		 * @mapping {'horizontal'|'vertical'| Number} orientation
		 *   The orientation of the text as a counter-clockwise angle of rotation, or constants 'vertical'
		 *   or 'horizontal'.

		 * @mapping {String='Arial'} font-family
		 *   One or more comma separated named font families,
		 *   starting with the ideal font to be used if present.

		 * @mapping {Number=10} font-size
		 *   The font size (in pixels).

		 * @mapping {String='normal'} font-weight
		 *   The font weight as a valid CSS value.

		 * @mapping {String='none'} font-outline
		 *   The colour of the outline drawn around each character of text. 
		 *   
		 * @mapping {Number=3} font-outline-width
		 *   The width of the outline drawn around each character of text, if font-outline is not none.
		 *   
		 * @mapping {Number=1.0} font-outline-opacity
		 *   How opaque the font outline will be.
		 *   
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings){
			aperture.Layer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			var node, i, n, g, labels;

			// Create a list of all additions and changes.
			var toProcess = changeSet.updates;

			for (i=0; i < toProcess.length; i++){
				node = toProcess[i];

				labels = node.userData.labels = node.userData.labels || [];

				// Get the number of labels to be rendered.
				var index, itemCount= this.valueFor('label-count', node.data, 1);
				g = node.graphics;
				
				// remove any extraneous labels
				for (index=itemCount; index < labels.count; index++){
					g.remove(labels[index].back);
					g.remove(labels[index].front);
				}
				
				labels.length = itemCount;
				
				for (index=0; index < itemCount; index++) {
					var visible = !!this.valueFor('label-visible', node.data, true, index);
					var label = labels[index];
					
					if (!visible){
						if (label) {
							g.remove(label.back);
							g.remove(label.front);
							labels[index] = null;
						}
						// Since all the labels are re-rendered on each update, there is
						// nothing more to do if the label is not visible.
						continue;
					}

					// Make the outline and fill colour the same.
					var fillColor = this.valueFor('fill', node.data, '#000000', index);
					var opacity = this.valueFor('opacity', node.data, '', index);
					var outlineColor = this.valueFor('font-outline', node.data, 'none', index);
					var xPoint = (this.valueFor('x', node.data, 0, index) * node.width) + (node.position[0]||0);
					var yPoint = (this.valueFor('y', node.data, 0, index) * node.height) + (node.position[1]||0);
					var outlineWidth = outlineColor !== 'none' && this.valueFor('font-outline-width', node.data, 3, index);
					
					var connect = this.valueFor('connect', node.data, false, index);

					var str = this.valueFor('text', node.data, '', index);

					var fontFamily = this.valueFor('font-family', node.data, "Arial", index);
					var fontSize = this.valueFor('font-size', node.data, 10, index);
					var fontWeight = this.valueFor('font-weight', node.data, "normal", index);

					var moreLines = str.match(/\n/g),
						textHeight = fontSize *1.4 + fontSize* (moreLines? moreLines.length: 0);

					// Check to see if there are any transformations that need to be applied.
					// The expected format is a string following Raphael's convention for
					// defining transforms on an element.
					var transform = '';
					var rotate = this.valueFor('orientation', node.data, null, index);
					if (isString(rotate)) {
						rotate = orientations[rotate] || rotate;
					}
					if (rotate) {
						transform += 'r'+rotate;
					}

					var offsetX = this.valueFor('offset-x', node.data, 0, index);
					var offsetY = this.valueFor('offset-y', node.data, 0, index);
					var textAnchor = this.valueFor('text-anchor', node.data, 'middle', index);
					var vAlign  = this.valueFor('text-anchor-y', node.data, 'middle', index);

					// convert to a number
					vAlign = vAlign !== 'middle'? 0.5*textHeight * (vAlign === 'top'? 1: -1): 0;
					
					// If there are already elements in this transformation, add
					// a delimiter.
					if (transform){
						transform += ',t0,'+ vAlign;
					} else {
						offsetY += vAlign;
					}
					xPoint+= offsetX;
					yPoint+= offsetY;

					var attr = {
							'x': xPoint,
							'y': yPoint,
							'text': str,
							'stroke': 'none',
							'font-family': fontFamily,
							'font-size': fontSize,
							'font-weight': fontWeight,
							'text-anchor': textAnchor,
							'transform': transform,
							'opacity': opacity
							};
					var fattr;

					if (!label) {
						label = labels[index] = {};
					}
					
					// if outlined we create geometry behind the main text.
					if (outlineWidth) {
						fattr = aperture.util.extend({
							'fill': fillColor
						}, attr);
						
						var oopacity = 
							this.valueFor('font-outline-opacity', node.data, 1.0, index);
						
						if (oopacity !== '' && oopacity != null && oopacity !== 1) {
							if (opacity !== '' && opacity != null) {
								oopacity = Math.min(1.0, opacity * oopacity);
							}
						} else {
							oopacity = opacity;
						}
						
						attr['opacity']= oopacity !== 1? oopacity : '';
						attr['stroke-width']= outlineWidth;
						attr['stroke']= outlineColor;
						attr['stroke-linecap']= 'round';
						attr['stroke-linejoin']= 'round';
					} else {
						if (label.front) {
							g.remove(label.front);
							label.front = null;
						}
						attr['stroke']= 'none';
						attr['fill']= fillColor;
					}
					
					index = [index];
					
					// always deal with the back one first.
					if (!label.back) {
						label.back = g.text(xPoint, yPoint, str);
						g.data(label.back, node.data, index);
						g.attr(label.back, attr);
						g.apparate(label.back, changeSet.transition);
					} else {
						g.attr(label.back, attr, changeSet.transition);
					}
					
					if (connect) {
						var connectX = this.valueFor('connect-x', node.data, 0, index);
						var connectY = this.valueFor('connect-y', node.data, 0, index);
						var pathStr = 'M'+(xPoint-offsetX+connectX)+' '+(yPoint-offsetY+connectY)+'L'+xPoint+' '+yPoint;
						if (!label.path) {
							label.path = g.path(pathStr);
						} else {
							var pathattr = {path:pathStr};
							g.attr(label.path, pathattr, changeSet.transition);
						}
					} else {
						if (label.path) {
							g.remove(label.path);
						}
					}
					
					// then the front.
					if (outlineWidth) {
						if (!label.front) {
							label.front = g.text(xPoint, yPoint, str);
							
							g.data(label.front, node.data, index);
							g.attr(label.front, fattr);
							g.apparate(label.front, changeSet.transition);
						} else {
							g.attr(label.front, fattr, changeSet.transition);
						}
					}
				}
			}
		}
	});

	return namespace;

}(aperture || {}));
