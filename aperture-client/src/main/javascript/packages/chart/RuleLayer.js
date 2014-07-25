/**
 * Source: RuleLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Rule Layer
 */

/**
 * @namespace
 * The chart visualization package. If not used, the chart package may be excluded.
 */
aperture.chart = (
/** @private */
function(namespace) {

	var palette = aperture.palette.color;
	
	/**
	 * @private
	 * Renders a single horizontal or vertical rule.
	 * @param {Object} node
	 */
	var createRule = function(node){
		if (!(node)) {
			return;
		}

		var borderWidth = this.valueFor('border-width', node.data, 0);
		var opacity = this.valueFor('opacity', node.data, 1);

		var axis = this.valueFor('axis', node.data, 'x');
		var value = this.valueFor('rule', node.data, 0);
		
		var lineColor = this.valueFor('stroke', node.data, palette('rule'));
		var lineWidth = this.valueFor('stroke-width', node.data, 1);
		
		// Get the stroke-style, if any, and translate into the corresponding
		// stroke dasharray value.
		var lineStyle = this.valueFor('stroke-style', node.data, '');
		switch (lineStyle) {
		case 'dashed':
			lineStyle = '- ';
			break;
		case 'dotted':
			lineStyle = '. ';
			break;
		case 'none':
			opacity = 0;
		case '':
		case 'solid':
			lineStyle = '';
		}

		var path = '';

		var xPos=0,yPos=0, xOffset=0, yOffset=0;
		var rangeX = this.mappings().x.transformation.from();
		var rangeY = this.mappings().y.transformation.from();
		
		// If this is a banded range, we need to offset the x-position by
		// half the bandwidth.
		if (rangeX.typeOf(aperture.Ordinal)){
			xOffset = 0.5*(node.width/rangeX.get().length);	
		}
		if (rangeY.typeOf(aperture.Ordinal)){
			yOffset = 0.5*(node.height/rangeY.get().length);	
		}
		// Check if the rule line orientation is vertical.
		if (axis === 'x'){
			xPos = (value*node.width) + node.position[0] + xOffset;
			yPos = node.position[1] + yOffset;
			path += 'M' + xPos + ',' + yPos + 'L' + xPos + ',' + (yPos+node.height-borderWidth);
		}
		// Default rule line orientation is horizontal.
		else {

			xPos = node.position[0] - xOffset;
			yPos = (value*node.height) + node.position[1] + yOffset;

			path += 'M' + xPos + ',' + yPos + 'L' + (xPos+node.width-borderWidth) + ',' + yPos;
		}

		//TODO: Add logic for caching rule lines for reuse.
		var line = node.graphics.path(path);
		node.graphics.attr(line, {
				'fill':null, 
				'stroke':lineColor, 
				'stroke-width':lineWidth,
				'stroke-dasharray':lineStyle,
				'opacity':opacity
			});
		node.userData.rulelines.push(line);
	};

	/**
	 * @exports RuleLayer as aperture.chart.RuleLayer
	 */
	var RuleLayer = aperture.Layer.extend( 'aperture.chart.RuleLayer',
	/** @lends RuleLayer# */
	{
		/**
		 * @augments aperture.Layer
		 * @class A layer that renders horizontal or vertical lines
		 * across a {@link aperture.chart.ChartLayer ChartLayer}. RuleLayers are not added 
		 * to a chart in conventional layer fashion, rather they are instantiated the first time
		 * they are referenced via chart.{@link aperture.chart.ChartLayer#ruleLayer ruleLayer}
		 * 
		 * @mapping {'x'|'y'} axis
		 *   Specifies whether the line is vertically or horizontally aligned.
		 * 
		 * @mapping {Number} rule
		 *   Raw data value to be mapped to a pixel position on the chart.
		 * 
		 * @mapping {Number=1} opacity
		 *   The opacity of the rule line.
		 * 
		 * @mapping {String='rule'} stroke
		 *   The colour used to draw the rule lines.
		 * 
		 * @mapping {Number=1} stroke-width
		 *   The width of the rule line.
		 *   
		 * @mapping {'solid'|'dotted'|'dashed'|'none'| String} stroke-style
		 *  The line style as a predefined option or custom dot/dash/space pattern such as '--.-- '.
		 *  A 'none' value will result in the rule not being drawn.
		 * 
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			// Get the changed components.
			aperture.util.forEach( changeSet.updates, function (node) {
				node.graphics.removeAll(node.userData.rulelines);
				node.userData.rulelines = [];
				createRule.call(this, node);
			}, this);
		}
	});

	namespace.RuleLayer = RuleLayer;
	return namespace;
}(aperture.chart || {}));
