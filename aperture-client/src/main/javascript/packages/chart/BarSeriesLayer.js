/**
 * Source: BarSeriesLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Bar Chart Layer
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
	 * Creates a simple identifier for a given bar segment. For
	 * unstacked bars, there will only ever be one segment.
	 * @param {Object} Spec used to generate the identifier.
	 */
	var getBarId = function (barSpec){
		return barSpec.x.toString() + barSpec.y.toString();
	},

	/**
	 * @private
	 * Calculates the actual dimensions to render a bar, accounting for chart
	 * orientation and border width.
	 * @param {String} Orientation of the chart (i.e. 'bar-layout').
	 * @param {Number[0,1]} Normalized value of the x-coordinate data value .
	 * @param {Number[0,1]} Normalized value of the y-coordinate data value.
	 * @param {Number} Width of a bar visual.
	 * @param {Number} Width of the border around the chart.
	 */
	getBarRect = function(orientation, w, h, barWidth, borderWidth, seriesId, index, barOffset, footprint, node){
		var barSeriesData = node.data,
			xValue = this.valueFor('x', barSeriesData, 0, index),
			yValue = this.valueFor('y', barSeriesData, 0, index),
			strokeWidth = this.valueFor('stroke-width', barSeriesData, 1),
			barLayout = this.valueFor('bar-layout', null, this.DEFAULT_BAR_LAYOUT),
			canvasY = yValue*h;
		
		var localBarWidth=0,localBarHeight=0;
		var xPoint=0, yPoint=0;

		if (orientation === 'horizontal'){
			localBarHeight = barWidth-borderWidth;

			
			// position
			yPoint = canvasY + node.position[1];
			// Account for the bar offset and the height of the
			// top/bottom borders of the bar.
			yPoint += barOffset - 0.5*(footprint);
			if (seriesId > 0 && barLayout !== 'stacked'){
				yPoint -= 0.5*strokeWidth;
			}
			
			
			// MAP VALUE
			var x1 = xValue*w;
			
			// map zero
			var x0 = this.map('x').using()? w*this.map('x').using().map(0) : 0;
			
			
			if (x1 > x0) {
				xPoint = node.position[0] + x0+ borderWidth;
				localBarWidth = Math.max(x1-x0, 0);
			} else {
				xPoint = node.position[0] + x1- borderWidth;
				localBarWidth = Math.max(x0-x1, 0);
			}
		}
		else {
			// Take the y-point and calculate the height of the corresponding bar.
			// We subtract the stroke width of the top and bottom borders so that
			// the bar doesn't blead over the border.
			localBarWidth = barWidth;
			
			
			// position
			xPoint = (xValue*w) + node.position[0];
			
			// Adjust the positioning of the bar if there are multiple series
			// and center the width of the bar wrt the data point.
			xPoint += barOffset - 0.5*(footprint);
			if (seriesId > 0 && barLayout !== 'stacked'){
				xPoint += 0.5*strokeWidth;
			}

			// MAP VALUE
			var y1 = Math.max(canvasY - borderWidth, 0);
			
			// map zero
			var y0 = this.map('y').using()? h*this.map('y').using().map(0) : 0;
			
			if (y1 < y0) {
				yPoint = node.position[1] + y1- 0.5*(borderWidth+strokeWidth);
				localBarHeight = Math.max(y0-y1, 0);
			} else {
				yPoint = node.position[1] + y0+ 0.5*(borderWidth+strokeWidth);
				localBarHeight = Math.max(y1-y0, 0);
			}
		}
		
		return {'x': xPoint, 'y': yPoint, 'width':localBarWidth, 'height':localBarHeight};
	},

	/**
	 * @private
	 * Calculates the width of a bar visual.
	 * @param {Object} Node object
	 * @param {Number} Width of the chart
	 * @param {Number} Height of the chart
	 * @param {Number} Number of series.
	 */
	getBarWidth = function(node, canvasWidth, canvasHeight, seriesCount){
		var barSeriesData = node.data,
			strokeWidth = this.valueFor('stroke-width', barSeriesData, 1),
			numPoints = this.valueFor('point-count', barSeriesData, 0),
			spacer = this.valueFor('spacer', null, 0),
			orientation = this.valueFor('orientation', null, 'vertical'),
			bandWidth = (orientation==='horizontal'?canvasHeight:canvasWidth)/numPoints,
			maxBarWidth = (bandWidth-((seriesCount-1)*spacer)-(seriesCount*2*strokeWidth))/seriesCount;

		// See if a value has been provided for the bar width, if there isn't
		// we'll use the one we calculated. If the user provided a bar width,
		// make sure it doesn't exceed the max bar width.
		var barWidth = Math.min(this.valueFor('width', node.data, maxBarWidth), maxBarWidth);

		// If the bar width is less than or equal to zero, return a bar width of 1 pixel anyways.
		// The user should understand that the chart is too crowded and either reduce the number
		// of bars to plot or increase the chart's dimensions.
		if (barWidth <= 0){
			return 1;
		}

		return barWidth;
	};

	/**
	 * @exports BarSeriesLayer as aperture.chart.BarSeriesLayer
	 */
	var BarSeriesLayer = aperture.BarLayer.extend( 'aperture.chart.BarSeriesLayer',
	/** @lends BarSeriesLayer# */
	{
		/**
		 * @augments aperture.BarLayer
		 * 
		 * @class A layer that takes a list of data points and plots a bar chart. This layer
		 * is capable of handling data with multiple series, as well as producing stacked bar charts.
		 * For plotting simpler bar visuals, refer to {@link aperture.BarLayer}

		 * @mapping {Number} point-count
		 *   The number of points in a given bar chart data series.
		 * 
		 * @mapping {String='vertical'} orientation
		 *   Sets the orientation of the chart. Vertically oriented charts will have bars that expand along the y-axis,
		 *   while horizontally oriented charts will have bars expanding along the x-axis. By default, this property
		 *   is set to 'vertical'.
		 *  
		 * @mapping {Number} width
		 *   Sets the width of each bar in the chart (i.e. the bar's thickness). If no mapping for this attribute is
		 *   provided, the width of the bars will be automatically calculated. For charts with a
		 *   horizontal orientation, the width is measured along the y-axis. Similarly, for vertically
		 *   oriented charts, the width is measured along the x-axis.
		 * 
		 * @mapping {Number} length
		 *   Mapping for determining the length of each bar in the chart. For charts with a horizontal
		 *   orientation, the length is measured along the x-axis. Similarly, for vertically oriented
		 *   charts, the length is measured along the y-axis.
		 * 
		 * @mapping {'clustered'|'stacked'} bar-layout
		 *   Determines how the bar series of the chart are positioned, either 
		 *   adjacent or stacked on top of each other.
		 * 
		 * @mapping {Number=0} spacer
		 *   Sets the space between bars from different bands<br>
		 *   i.e. the gap between the last bar of Band#0 and the first bar of Band#1.
		 * 
		 * @mapping {String} fill
		 *   Sets the fill colour of the bar.<br>

		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings){
			aperture.BarLayer.prototype.init.call(this, spec, mappings);

			this.DEFAULT_BAR_LAYOUT = 'clustered';
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			this.updateLayer(this.applyLayout(changeSet.updates), changeSet.transition);
		}
		
	});
	
	
	/**
	 * Overrides the layout methods of BarLayer. This method provides logic
	 * for handling multiples series as well as stacked bar charts.
	 */
	BarSeriesLayer.prototype.applyLayout = function(dataObjects){
		
		var seriesId= -1;
		var masterBarWidth = 0,
			barOffset = 0;

		var seriesSpec = [],
			barSpecs;
		
		var totalBarLength = {};

		aperture.util.forEach( dataObjects, function (node) {
			seriesId++;
			barSpecs = [];
			if (!node.userData.bars){
				node.userData.bars = {};
			}

			var barSeriesData = node.data;
			if (barSeriesData.length != 0) {

				// If the barchart style is stacked, we can treat this chart as if it
				// only contained a single series.
				var barLayout = this.valueFor('bar-layout', barSeriesData, this.DEFAULT_BAR_LAYOUT);
	
				// FIX: this count is incorrect if added in multiple steps.
				var seriesCount = barLayout === 'stacked'?1:dataObjects.length;
	
				var strokeWidth = this.valueFor('stroke-width', barSeriesData, 1);
	
				var w = node.width;
				var h = node.height;
	
				// For calculating the x-axis scale, we need to take into account
				// how many series are being plotted.
				// For multiple series, the bars of subsequent series are placed
				// adjacent to each other. This needs to be accounted for in the
				// x-axis scale, otherwise they will get clipped and not visible.
				var orientation = this.valueFor('orientation', barSeriesData, 'vertical');
				var numPoints = this.valueFor('point-count', barSeriesData, 0);
				var borderWidth = this.valueFor('border-width', barSeriesData, 0);
				if (numPoints > 0) {
					// If no bar width is provided, calculate one based on the
					// the number of points.
					if (!masterBarWidth) {
						masterBarWidth = getBarWidth.call(this, node, w, h, seriesCount);
					}
	
					// Calculate the total effective footprint of all the bars in a given band.
					var footprint = (seriesCount*masterBarWidth) + (seriesCount-1)*(strokeWidth);
					// Now shift each bar an appropriate distance such that all the bars for a
					// given band are (as a group) centered on the band's midpoint.
					// If the bar is stacked, we treat it as if it was a chart with only
					// 1 series.
					var seriesIndex = barLayout==='stacked'?0:seriesId;
					barOffset = seriesIndex*(masterBarWidth + strokeWidth);
				}

				for (index=0; index< numPoints; index++){
					var renderBarDim = getBarRect.call(this, orientation, w, h, masterBarWidth, borderWidth, 
							seriesId, index, barOffset, footprint, node);
	
					var xPoint = renderBarDim.x,
						yPoint = renderBarDim.y;

					// If we are dealing with stacked bars, we need to account for the length of the previous
					// bar for a given bin.
					if (barLayout === 'stacked'){
						var lOffset = 0;
						if (!totalBarLength ){
							totalBarLength  = {};
						}
						if (!totalBarLength[index]){
							totalBarLength[index] = 0;
							totalBarLength[index] = orientation === 'vertical'?-renderBarDim.height:renderBarDim.width;
						}
						else {
							lOffset = totalBarLength[index];
							totalBarLength[index] += orientation === 'vertical'?-renderBarDim.height:renderBarDim.width;
						}
						if (orientation === 'vertical') {
							yPoint += lOffset;
						} else {
							xPoint += lOffset;
						}
					}
					
					var barSpec = {
						node : node,
						x : xPoint,
						y : yPoint,
						size : renderBarDim,
						strokeWidth : strokeWidth,
						orientation : orientation,
						visible: true
					};
					barSpecs.push(barSpec);
				}
				seriesSpec.push(barSpecs);
			}
		}, this);
		return seriesSpec; 
	};
	
	namespace.BarSeriesLayer = BarSeriesLayer;
	return namespace;
	
}(aperture.chart || {}));
