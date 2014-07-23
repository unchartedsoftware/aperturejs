/**
 * Source: AxisLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Axis Layer
 */

/**
 * @namespace
 * The chart visualization package. If not used, the chart package may be excluded.
 */
aperture.chart = (
/** @private */
function(namespace) {
	/**
	 * @private
	 * Creates the {@link aperture.LabelLayer} used to
	 * display a title for this axis.
	 */
	var DEFAULT_TICK_LENGTH = 4,
		DEFAULT_TICK_WIDTH = 1,
		palette = aperture.palette.color,

	createTitleLayer = function(node){
		// Lazy creation of the title LabelLayer.
		this.titleLayer = this.addLayer(aperture.LabelLayer);
		// Detach the title of the axis from inheriting any parent x-mappings.
		// We don't want the label to be able to pan horizontally.
		this.titleLayer.map('x').from('x').only().using(this.DEFAULT_RANGE.mappedTo([0,1]));
		this.titleLayer.map('y').from('y').using(this.DEFAULT_RANGE.mappedTo([1,0]));
		this.titleLayer.map('text').from('text');
		this.titleLayer.map('text-anchor').asValue('middle');

		// Setup optional mappings.
		this.titleLayer.map('orientation').from('orientation');
		this.titleLayer.map('offset-x').from('offset-x');
		this.titleLayer.map('offset-y').from('offset-y');
		this.titleLayer.map('font-family').asValue(this.valueFor('font-family', node.data, null));
		this.titleLayer.map('font-size').asValue(this.valueFor('font-size', node.data,null));
		this.titleLayer.map('font-weight').asValue(this.valueFor('font-weight', node.data, null));
	},

	setDefaultValues = function(){
		var type = this.valueFor('axis');
		var vAlign = this.valueFor('text-anchor-y');
		var textAlign = this.valueFor('text-anchor');
		var layout = this.valueFor('layout');
		if (type === 'x'){
			if (!layout){
				this.map('layout').asValue('bottom');
			}
			if (!vAlign){
				this.map('text-anchor-y').asValue('top');
			}
			if (!textAlign){
				this.map('text-anchor').asValue('middle');
			}
		}
		else{
			if (!layout){
				this.map('layout').asValue('left');
			}
			if (!vAlign){
				this.map('text-anchor-y').asValue('middle');
			}
			if (!textAlign){
				this.map('text-anchor').asValue('end');
			}
		}
	},

	getLabelPadding = function(type, layout, vAlign, textAlign){
		var xPadding=0, yPadding=0;
		var labelOffsetX = this.valueFor('label-offset-x', null, 0);
		var labelOffsetY = this.valueFor('label-offset-y', null, 0);
		if (type === 'x') {
			if (layout === 'top'){
				yPadding = -labelOffsetY;
			}
			else if (layout === 'bottom'){
				yPadding = labelOffsetY;
			}

			if (textAlign === 'start'){
				xPadding = labelOffsetX;
			}
			else if (textAlign === 'end'){
				xPadding = -labelOffsetX;
			}
		}
		else {
			if (layout === 'left'){
				xPadding = -labelOffsetX;
			}
			else if (layout === 'right'){
				xPadding = labelOffsetX;
			}
			if (vAlign === 'bottom'){
				yPadding = labelOffsetY;
			}
			else if (vAlign === 'top'){
				yPadding = -labelOffsetY;
			}
		}
		return {'x':xPadding, 'y':yPadding};
	},

	/**
	 * @private
	 * Renders the tick marks for this label and creates a list of
	 * tick mark labels that will be passed on to the child {@link aperture.LabelLayer}
	 * for rendering.
	 * @param {Object} node Render node for this layer
	 */
	createAxis = function(node){
		var w,
			h,
			left = node.position[0],
			top = node.position[1],
			right = left + node.width,
			bottom = top + node.height,
			type = this.valueFor('axis', node.data, null);

		node.userData[type] = node.userData[type] || {};
		node.graphics.removeAll(node.userData[type].axis);

		// The margin defines the width of the axis for vertical AxisLayers;
		// the height of the axis for horizontal AxisLayers.
		var axisMargin = this.valueFor('margin',node.data,0),
			ruleWidth = this.valueFor('rule-width',node.data,0);

		setDefaultValues.call(this);

		var tickWidth = this.valueFor('tick-width',node.data, DEFAULT_TICK_WIDTH);
		var tickLength = this.valueFor('tick-length',node.data, DEFAULT_TICK_LENGTH);
		// The offset of the tick mark from the chart layer.
		var offset = this.valueFor('tick-offset',node.data,0);

		// Check the type of axis we are drawing.
		// x-axis = horizontal
		// y-axis = vertical

		var vAlign = (this.valueFor('text-anchor-y', null, 'bottom')).toLowerCase();
		var layout = null;

		if (type == 'x') {
			w = node.width;
			h = axisMargin || node.height;
			layout = (this.valueFor('layout', null, 'bottom')).toLowerCase();
			if (layout === 'top'){
				tickLength *= -1;
				offset *= -1;
			}
		}
		else {
			w = axisMargin || node.width;
			h = node.height;
			layout = (this.valueFor('layout', null, 'left')).toLowerCase();
			if (layout === 'right'){
				tickLength *= -1;
				offset *= -1;
			}
		}

		//TODO:
		// Create set for storing tick visuals for updating/removal.

		// Now we render the ticks at the specifed intervals.
		var path = '';

		var min=0, max=0;
		var mapKey = node.data;
		var axisRange = node.data.from();

		// no range? show no ticks.
		if (axisRange.get()) {
			var tickArray = {ticks:axisRange.get()};
			var xPos=0,yPos=0;
			var tickLabels = [];

			// Check if the label layer is visible.
			if (this.labelLayer){
				if (type === 'y'){
					// We use a default mapper for the x-coordinate of the labels so that we can
					// align the vertical labels with the left side of the chart by mapping them
					// to zero.
					this.labelLayer.map('x').from('labels[].x').using(this.DEFAULT_RANGE.mappedTo([0,1]));
					this.labelLayer.map('y').from('labels[].y');
					//this.labelLayer.map('text-anchor').asValue('end');
				}
				else if (type === 'x'){
					this.labelLayer.map('x').from('labels[].x');
					// We use a default mapper for the y-coordinate of the labels so that we can
					// align the horizontal labels with the bottom of the chart by mapping them
					// to zero.
					this.labelLayer.map('y').from('labels[].y').using(this.DEFAULT_RANGE.mappedTo([1,0]));
					//this.labelLayer.map('text-anchor').asValue('middle');
				}

				// Setup optional font attribute mappings. Default values are provided by label layer
				// if no explicit value is provided locally.
				this.labelLayer.map('font-family').asValue(this.valueFor('font-family', node.data, null));
				this.labelLayer.map('font-size').asValue(this.valueFor('font-size',node.data,null));
				this.labelLayer.map('font-weight').asValue(this.valueFor('font-weight', node.data, null));
			}

			// Draw the tick marks for a banded or ordinal range.
			var hasBands = axisRange.typeOf(/banded/),
				mappedValue, tickId, tick, tickMin, tickLimit;

			if (hasBands || axisRange.typeOf(aperture.Ordinal)){
				var tickLast = false;

				for (tickId=0; tickId < tickArray.ticks.length; tickId++){
					tick = tickArray.ticks[tickId];
					if (!tick) {
						continue;
					}
					tickMin = hasBands?tick.min:tick;
					tickLimit = hasBands?tick.limit:tick;

					if (tickMin === -Number.MAX_VALUE) {
						if (tickId === 0 && hasBands && this.valueFor('tick-first', null, 'band') === 'edge') {
							tickMin = axisRange.start();
						} else {
							continue;
						}
					}

					if (tickId === tickArray.ticks.length - 1) {
						tickLast = true;
						if (tickLimit === Number.MAX_VALUE) {
							if (hasBands && this.valueFor('tick-last', null, 'band') === 'edge') {
								tickLimit = axisRange.end();
							} else {
								tickLast = false;
							}
						}
					}

					if (type === 'x'){
						mappedValue = this.valueFor('x', tickArray, 0, tickId);
						xPos = (mappedValue*node.width) + left;
						yPos = bottom + offset;
						if (xPos < left || xPos > right){
							continue;
						}

						path += 'M' + xPos + ',' + yPos + 'L' + xPos + ',' + (yPos+tickLength);
						tickLabels.push({'x':tickMin,'y':0, 'text':axisRange.format(tickMin)});
						// If we're on the last tick, and there is a bounded upper limit,
						// include a tick mark for the upper boundary value as well.
						if (tickLast) {
							var mapX = this.mappings()['x'];

							if (mapX) {
								var isScalar = axisRange.typeOf(aperture.Scalar);
								// if scalar pick upper limit, if ordinal pick end of list.
								mappedValue = isScalar? mapX.value(tickLimit) : mapX.filteredValue(1);
								xPos = (mappedValue*node.width) + left;
								path += 'M' + xPos + ',' + yPos + 'L' + xPos + ',' + (yPos+tickLength);
								// If this is a banded scalar, we want to show the label.
								if (isScalar) {
									tickLabels.push({'x':tickLimit,'y':0, 'text':axisRange.format(tickLimit)});
								}
							}
						}
					}
					else if (type === 'y'){
						mappedValue = this.valueFor('y', tickArray, 0, tickId);
						xPos = left - (tickLength + offset) - (0.5*ruleWidth);
						yPos = (mappedValue*h) + top;
						path += 'M' + xPos + ',' + yPos + 'L' + (xPos+tickLength) + ',' + yPos;

						// If we're on the last tick, and there is a bounded upper limit,
						// include a tick mark for the upper boundary value as well.
						if (tickLast){
							mappedValue = this.valueFor('y', {'ticks':[{'min':tickLimit}]}, 0, 0);
							yPos = (mappedValue*h) + top;
							path += 'M' + xPos + ',' + yPos + 'L' + (xPos+tickLength) + ',' + yPos;
							tickLabels.push({'x':0,'y':tickLimit, 'text':axisRange.format(tickLimit)});
						}
						tickLabels.push({'x':0,'y':tickMin, 'text':axisRange.format(tickMin)});
					}
				}
			}

			// Draw the tick marks for a scalar range.
			else {
				for (tickId=0; tickId < tickArray.ticks.length; tickId++){
					tick = tickArray.ticks[tickId];
					if (tick !== -Number.MAX_VALUE){
						mappedValue = axisRange.map(tick);
						if (type === 'x'){
							xPos = mappedValue*node.width + left;
							if (xPos < left || xPos > right){
								continue;
							}
							// Calculate the axis position in a top-down fashion since the origin
							// is in the top-left corner.
							yPos = bottom + offset;
							path += 'M' + xPos + ',' + yPos + 'L' + xPos + ',' + (yPos+tickLength);
							tickLabels.push({'x':tick,'y':0, 'text':axisRange.format(tick)});
						}

						else if (type === 'y'){
							xPos = left - (tickLength + offset) - ruleWidth;
							// Calculate the axis position in a top-down fashion since the origin
							// is in the top-left corner.
							yPos = mappedValue*node.height + top;
							if (yPos < top || yPos > bottom){
								continue;
							}

							path += 'M' + xPos + ',' + yPos + 'L' + (xPos+tickLength) + ',' + yPos;
							tickLabels.push({'x':0,'y':tick, 'text':axisRange.format(tick)});
						}
					}
				}
			}

			this.labelLayer.all({'labels':tickLabels});
		}
		// Unless specifically overridden, the axis colour will be the same as the
		// border colour of the parent ChartLayer.
		var axisColor = this.valueFor('stroke') || palette('rule');

		var axisSet = [];
		if (!!ruleWidth){
			var rulePath;
			if (type === 'y'){
				rulePath = 'M'+left + ',' + top + 'L' + left + ',' + bottom;
			}
			else if (type === 'x'){
				yPos = bottom + offset;
				rulePath = 'M'+left + ',' + yPos + 'L' + right + ',' + yPos;
			}
			var axisRule = node.graphics.path(rulePath);
			node.graphics.attr(axisRule, {fill:null, stroke:axisColor, 'stroke-width':ruleWidth});
			axisSet.push(axisRule);
		}

		// Take the path of the ticks and create a Raphael visual for it.
		var axisTicks = node.graphics.path(path);
		node.graphics.attr(axisTicks, {fill:null, stroke:axisColor, 'stroke-width':tickWidth});
		axisSet.push(axisTicks);
		node.userData[type].axis = axisSet;

		// Check to see if this axis layer has a title.
		var title = this.valueFor('title', node.data, null);
		if (title){
			var axisTitle;
			if (!this.titleLayer){
				createTitleLayer.call(this, node);
			}
			// For vertical titles, we need to rotate the text so that it is aligned
			// parallel to the axis.
			if (type === 'y'){
				axisTitle = {'x':0, 'y':0.5, 'text':title, 'orientation':-90, 'offset-x': -axisMargin};
			}
			else if (type === 'x'){
				axisTitle = {'x':0.5, 'y':0, 'text':title, 'offset-y': axisMargin};
			}
			this.titleLayer.all(axisTitle);
		}
	};

	/**
	 * @exports AxisLayer as aperture.chart.AxisLayer
	 */
	var AxisLayer = aperture.PlotLayer.extend( 'aperture.chart.AxisLayer',
	/** @lends AxisLayer# */
	{
		/**
		 * @augments aperture.PlotLayer
		 * @class An AxisLayer provides visual representation of a single axis
		 * for its parent {@link aperture.chart.ChartLayer ChartLayer}. AxisLayers are not added
		 * to a chart in conventional layer fashion, rather they are instantiated the first time
		 * they are referenced via chart.{@link aperture.chart.ChartLayer#xAxis xAxis} or
		 * chart.{@link aperture.chart.ChartLayer#yAxis yAxis}

		 * @mapping {String} stroke
		 *   The color of the axis rule and ticks.
		 *
		 * @mapping {Number=0} rule-width
		 *   The width of the line (in pixels) used to visually represent the baseline of an axis. Typically, the
		 *   parent {@link aperture.chart.ChartLayer ChartLayer} will have a border visible, which subsequently provides
		 *   the baseline for the axis, thus 'rule-width' is set to zero by default. If no border is present in
		 *   the parent chart, then this property should be assigned a non-zero value.
		 *   Tick marks will extend perpendicularly out from this line.
		 *
		 * @mapping {Number=0} tick-length
		 *   The length of a tick mark on the chart axis.
		 *
		 * @mapping {Number=0} tick-width
		 *   The width of a tick mark on the chart axis.
		 *
		 * @mapping {Number=0} tick-offset
		 *   The gap (in pixels) between the beginning of the tick mark and the axis it belongs too.
		 *
		 * @mapping {'band'|'edge'} tick-first
		 *   When an axis range is banded but not rounded, the default behavior is to mark the first tick
		 *   at the start of the first whole band. Specifying 'edge' will force a tick at the edge of the axis range.
		 *
		 * @mapping {'band'|'edge'} tick-last
		 *   When an axis range is banded but not rounded, the default behavior is to mark the last tick
		 *   at the end of the last whole band. Specifying 'edge' will force a tick at the edge of the axis range.
		 *
		 * @mapping {Number=0} label-offset-x
		 *   The horizontal gap (in pixels) between the end of a tick mark, and the beginning of the tick mark's label.
		 *
		 * @mapping {Number=0} label-offset-y
		 *   The vertical gap (in pixels) between the end of a tick mark, and the beginning of the tick mark's label.
		 *
		 * @mapping {Number} margin
		 *   The space (in pixels) to allocate for this axis.
		 *   For vertical (y) axes, this refers to the width reserved for the axis.
		 *   For horizontal (x) axes, this refers to the height reserved for the axis.
		 *
		 * @mapping {String} title
		 *   The text of the axis title.
		 *
		 * @mapping {String='Arial'} font-family
		 *   The font family used to render all the text of this layer.
		 *
		 * @mapping {Number=10} font-size
		 *   The font size (in pixels) used to render all the text of this layer.
		 *
		 * @mapping {String='normal'} font-weight
		 *   The font weight used to render all the text of this layer.
		 *
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
			// Add a LabelLayer for rendering the tick mark labels.
			this.labelLayer = this.addLayer(aperture.LabelLayer);
			// Set up the expected mappings for the LabelLayer.
			this.labelLayer.map('text').from('labels[].text');
			this.labelLayer.map('label-count').from('labels.length');

			// Setup optional mappings.
			this.labelLayer.map('orientation').from('orientation');
			this.labelLayer.map('offset-x').from('offset-x');
			this.labelLayer.map('offset-y').from('offset-y');
			this.labelLayer.map('font-family').from('font-family');
			this.labelLayer.map('font-size').from('font-size');
			this.labelLayer.map('font-weight').from('font-weight');

			this.DEFAULT_RANGE = new aperture.Scalar('default_range', [0,1]);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {

			// Process the modified components.
			aperture.util.forEach(changeSet.updates, function(node) {
				createAxis.call(this, node);
			}, this);


			// will call renderChild for each child.
			aperture.PlotLayer.prototype.render.call(this, changeSet);
		},

		/**
		 * @private
		 * Before the child {@link aperture.LabelLayer} is rendered, we need to adjust
		 * the position of the child layer to account for the tick marks of the axis.
		 */
		renderChild : function(layer, changeSet) {
			// The type of axis we are drawing.
			// Vertical axes are drawn on the left (typically the y-axis)
			// Horizontal axes are drawn at the bottom of the graph (typically the x-axis).

			var i;

			// Before we create the child LabelLayer, we may need to change the starting
			// position and anchor point of the layer depending on the type of axis
			// we are drawing, and how the parent ChartLayer is oriented.
			var toProcess = changeSet.updates;
			for (i=0; i < toProcess.length; i++){
				var node = toProcess[i],
					left = node.position[0],
					top = node.position[1];

				var ruleWidth = this.valueFor('rule-width', null, 1);

				var type = this.valueFor('axis', null, null);

				// (may be better to use these constant values instead).
				var anchorMap = {left: 'start', right: 'end', middle: 'middle'};

				if (layer === this.labelLayer){
					var vAlign = this.valueFor('text-anchor-y', null, 'bottom');
					var textAlign = this.valueFor('text-anchor', null, null);
					var layout = this.valueFor('layout', null, null);

					// Set the anchor position of the label based on
					// the alignment properties of this axis.
					layer.map('text-anchor-y').asValue(vAlign);

					// Handle the case of a banded or ordinal range.

					//TODO: Re-work the handling of the changed
					// nodes. This seems inefficient.
					// If this node is an existing one, just leave
					// it where it is. The label is already positioned
					// in the correct location.
					if (aperture.util.has(changeSet.changed, node)){
						continue;
					}

					var tickWidth = this.valueFor('tick-width', node.data, DEFAULT_TICK_WIDTH);
					var tickLength = this.valueFor('tick-length', node.data, DEFAULT_TICK_LENGTH);
					var offset = this.valueFor('tick-offset', node.data, 0);
					var axisMargin = this.valueFor('margin', node.data, 0); // TODO: smart default based on what's showing

					var mapKey = node.parent.data;
					var axisRange = mapKey.from();
					var tickArray = axisRange.get();
					var childPos, bandWidth;

					// If the axis ticks/labels are being drawn in the interior
					// of the plot area, flip these values to correspond with
					// that.
					if ((type === 'x' && layout === 'top')||
							(type === 'y' && layout === 'right')){
						tickLength *= -1;
						offset *= -1;
					}

					if (axisRange.typeOf(/banded|Ordinal/)){
						if (type === 'x'){
							// If this is a banded scalar value, we want to align the tick labels
							// with the tick marks. For ordinals, the labels are shifted to fall
							// between tick marks.
							if (axisRange.typeOf(aperture.Scalar)){
								childPos = [left, top + (tickLength+offset)];
							}
							else {
								bandWidth = (node.width-(2*tickWidth))/tickArray.length;
								childPos = [left + (0.5*bandWidth), top + (tickLength+offset)];
							}
							node.position = childPos;
						}
						else if (type === 'y'){
							// Get the orientation of the parent chart layer.
							// The default orientation is vertical.
							// e.g For the case of a bar chart, a vertical orientation draws
							// the bars top-to-bottom. Whereas a horizontal orientation would
							// draw the bars left-to-right.
							var orientation = this.valueFor('orientation', node.data, 'vertical');
							// Handle a horizontal orientation.
							if (orientation == 'horizontal'){
								// Special case for a banded scalar range.
								// If this is a vertical axis (e.g. Y-axis) but the chart is oriented
								// horizontally, we want the label of any scalar tick marks to
								// align with the tick itself, and not be slotted in between tick marks
								// as we do for ordinal tick marks.
								if (axisRange.typeOf(aperture.Scalar)){
									childPos = [left-(tickLength+offset), top];
								}
								else {
									bandWidth = (node.height-(2*tickWidth))/tickArray.length;
									childPos = [left-(tickLength+offset), top-(0.5*bandWidth)];
								}
							}
							// Default assumption is a vertical orientation.
							else {
								childPos = [left-(tickLength+offset), top];
							}
							node.position = childPos;
						}
					}
					// Handle the default case of an unbanded or scalar range.
					else {
						if (type === 'x'){
							childPos = [left, top + (tickLength+offset)];
							node.position = childPos;
						}
						else if (type === 'y'){
							childPos = [left-(tickLength+offset), top];
							node.position = childPos;
						}
					}
					var padding = getLabelPadding.call(this, type, layout, vAlign, textAlign);
					node.position[0] = node.position[0] + padding.x;
					node.position[1] = node.position[1] + padding.y;
				}
				else if (layer.uid == (this.titleLayer && this.titleLayer.uid)){
					childPos = [left, top];
					node.position = childPos;

					this.titleLayer.map('text-anchor-y').asValue(type === 'y'? 'top': 'bottom');
				}
			}
			layer.render( changeSet );
		}
	});

	namespace.AxisLayer = AxisLayer;
	return namespace;
}(aperture.chart || {}));
