/**
 * Source: BarLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Bar Layer
 */
aperture = (
/** @private */
function(namespace) {
	/**
	 * Given a spec object for describing a bar, this method
	 * creates the corresponding visual representation.
	 */
	var DEFAULT_FILL = '#8aadec',
		renderBar = function(barSpec, index){
			var node = barSpec.node;

			var strokeWidth = this.valueFor('stroke-width', node.data, 1, index),
				lineStroke = this.valueFor('stroke', node.data, 'none', index),
				localFill = this.valueFor('fill', node.data, DEFAULT_FILL, index),
				localOpacity = this.valueFor('opacity', node.data, 1, index);

			var bar = node.graphics.rect(
						barSpec.x,
						barSpec.y,
						barSpec.size.width,
						barSpec.size.height);

			node.graphics.attr(bar, {
				'fill':localFill,
				'stroke':lineStroke,
				'stroke-width':lineStroke==null?0:strokeWidth,
				'stroke-linejoin': 'round',
				'fill-opacity':localOpacity});

		return bar;
	};

	namespace.BarLayer = aperture.Layer.extend( 'aperture.BarLayer',
	/** @lends aperture.BarLayer# */
	{
		/**
		 * @augments aperture.Layer
		 * @class Given a data source, this layer plots simple, bar visual representations of that data
		 * (e.g. on a timeline visualization). For more complex charting capabilities, refer to
		 * {@link aperture.chart.BarSeriesLayer BarSeriesLayer}

		 * @mapping {Number=1} bar-count
		 *   The number of points in a given bar chart data series.
		 *
		 * @mapping {Number=0} x
		 *   The base horizontal position of the bar.
         * @mapping {Number=0} offset-x
         *   An offset from base horizontal position of the bar, in pixels

		 * @mapping {Number=0} y
		 *   The base vertical position of the bar.
         * @mapping {Number=0} offset-y
         *   An offset from the base vertical position of the bar, in pixels

		 * @mapping {String='vertical'} orientation
		 *   Sets the orientation of the chart. Vertically oriented charts will have bars that expand along the y-axis,
		 *   while horizontally oriented charts will have bars expanding along the x-axis. By default, this property
		 *   is set to 'vertical'.

		 * @mapping {Number} width
		 *   Sets the width of each bar in the chart (i.e. the bar's thickness). For charts with a horizontal
		 *   orientation, the width is measured along the y-axis. Similarly, for vertically oriented charts,
		 *   the width is measured along the x-axis. For most conventional usages, the width will be the
		 *   lesser of the two values when compared against length.

		 * @mapping {Number} length
		 *   Mapping for determining the length of each bar in the chart. For charts with a horizontal
		 *   orientation, the length is measured along the x-axis. Similarly, for vertically oriented
		 *   charts, the length is measured along the y-axis.

		 * @mapping {Boolean=true} bar-visible
		 *   Property for toggling the visibility of individual bars in the chart. Setting the global property of
		 *   'visible' to FALSE overrides the value of this property and will hide all the bar visuals.

		 * @mapping {String='#8aadec'} fill
		 *   Sets the fill colour of the bar.
		 *
		 * @mapping {Number=1} opacity
		 *  The opacity of a bar. Values for opacity are bound with the range [0,1], with 1 being opaque.
		 *
		 * @mapping {String='none'} stroke
		 *   By default no stroke is used when drawing the bar charts, only the fill value is used.
		 *   Setting this value will draw a coloured outline around each bar in the chart.

		 * @mapping {Number=1} stroke-width
		 *   The width (in pixels) of the stroke drawn around each bar. This value is only used if the 'stroke'
		 *   property is set to a visible value.

		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			// Create a list of all additions and changes.
			// Determine how the bars should be laid out.
			var seriesSpec = this.applyLayout(changeSet.updates);
			// Render the bars.
			this.updateLayer.call(this, seriesSpec, changeSet.transition);
		},


		/**
		 * @private
		 * Calculate the layout of the bars, taking into account
		 * chart orientation, and visibility.
		 */
		applyLayout : function(dataObject) {
			var seriesSpec = [],
				seriesId,
				index;
			for (seriesId = 0; seriesId < dataObject.length; seriesId++){
				var barSpecs = [];
				var node = dataObject[seriesId];

				var numBars = this.valueFor('bar-count', node.data, 1, seriesId);
				var orientation = this.valueFor('orientation', node.data, 'vertical', index);

				var maxLength = orientation == 'vertical'?node.height:node.width;

				for (index=0; index < numBars; index++){
					var width = this.valueFor('width', node.data, 2, index),
						length = this.valueFor('length', node.data, 0, index),
						xp = this.valueFor('x', node.data, 0, index) * node.width,
						yp = this.valueFor('y', node.data, 0, index) * node.height,
						xd = orientation === 'vertical'? width:length,
						yd = orientation === 'vertical'? length:width;

					var isVisible = this.valueFor('bar-visible', node.data, true, index, seriesId);

					xp += this.valueFor('offset-x', node.data, 0, index);
                    yp += this.valueFor('offset-y', node.data, 0, index);

					if (xd < 0) {
						xp += xd;
						xd = -xd;
					}

					if (yd < 0) {
						yp += yd;
						yd = -yd;
					}

					var barSpec = {
							id : index,
							x : xp+ (node.position[0]||0),
							y : yp+ (node.position[1]||0),
							size : {width: xd, height: yd},
							strokeWidth : 1,
							orientation : orientation,
							visible : isVisible,
							node : node
					};
					barSpecs.push(barSpec);
				}
				seriesSpec[seriesId] = barSpecs;
			}
			return seriesSpec;
		},


		/**
		 * @private
		 * This method takes a collection of specs that describe the size and position
		 * of each bar (or bar segment in the case of stacked bars), applies
		 * additional styling properties if specified, and then passes the objects
		 * off for rendering.
		 *
		 * If the bar element has already been rendered previously, retrieve the existing
		 * visual and update its visual attributes.
		 */
		updateLayer : function(seriesSpec, transition) {
			var seriesId,
				index;
			for (seriesId = 0; seriesId < seriesSpec.length; seriesId++){
				var barSpecs = seriesSpec[seriesId];
				var barCount = barSpecs.length;

				if (barCount > 0){
					for (index=0; index< barCount; index++){
						var barSpec = barSpecs[index];
						var node = barSpec.node;

						if (!node.userData.bars){
							node.userData.bars = {};
						}

						// Check if this bar already exists for this node. If it does
						// we want to do an update. Otherwise we'll create a new graphic
						// object for it.
						var bar = node.userData.bars[index];

						if (!barSpec.visible){
							if (bar) {
								node.graphics.remove(bar);
								delete node.userData.bars[index];
							}
							continue;
						}

						var barSeriesData = barSpec.node.data;
						var lineStroke = this.valueFor('stroke', barSeriesData, 'none', index);
						var barLayout =	this.valueFor('bar-layout', barSeriesData, null, index);

						// Check if the visual exceeds the current context size,
						// culling if necessary.
						// To prevent visuals from seeming to "pop" into the scene
						// when panning, we want to allow a buffer area of N bars,
						// at either end of the corresponding axis, when culling.
						var xPoint = barSpec.x,
							yPoint = barSpec.y,
							renderBarDim = barSpec.size,
							nBarOffset = 2; // Allows for a buffer of 1 bar.

						// Since we only support horizontal panning, we only need to cull along the x-axis.
						if (cullPoint = xPoint > node.width + node.position[0]|| xPoint + nBarOffset*renderBarDim.width < node.position[0]){
							if (bar) {
								node.graphics.remove(bar);
								delete node.userData.bars[index];
							}
							continue;
						}
						// If this bar already exists, update its visual
						// properties.
						if (bar){
							var localFill = this.valueFor('fill', node.data, DEFAULT_FILL, index);
							var localOpacity = this.valueFor('opacity', node.data, 1, index);
							node.graphics.attr(bar, {
								fill:localFill,
								stroke:lineStroke,
								x : xPoint,
								y : yPoint,
								'fill-opacity' : localOpacity,
								'stroke-width':lineStroke==null?0:barSpec.strokeWidth,
								'stroke-linejoin': 'round',
								'width' : renderBarDim.width,
								'height' : renderBarDim.height
							}, transition);
						}
						else {
							// This is a new bar so we'll create a new visual for it.
							bar = renderBar.call(this, barSpec, index);
							// Associate data with the bar visual.
							node.graphics.data(bar, barSeriesData, [index]);
							// Cache the visual for this bar.
							node.userData.bars[index] = bar;
						}
					}
				}
			}
		}
	});

	return namespace;

}(aperture || {}));
