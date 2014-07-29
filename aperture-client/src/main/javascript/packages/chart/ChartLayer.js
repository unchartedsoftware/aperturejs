/**
 * Source: ChartLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Chart Layer
 */

/**
 * @namespace
 * The chart visualization package. If not used, the chart package may be excluded.
 */
aperture.chart = (
function(namespace) {

	var palette = aperture.palette.color,
		updatePlotVisual = function(node){
		var fill = this.valueFor('background-color', node.data, '#fff');
		var borderStroke = this.valueFor('border-stroke', node.data, palette('border'));
		var borderWidth = this.valueFor('border-width', node.data, 1);
		var opacity = this.valueFor('opacity', node.data, 1);
		var plotWidth = node.userData.plotBounds.width;
		var plotHeight = node.userData.plotBounds.height;
		var borderXPos = node.userData.plotBounds.position[0];
		var borderYPos = node.userData.plotBounds.position[1];
		// Subtract the width of the border to get the
		// actual dimensions of the chart.
		var chartWidth = plotWidth - borderWidth;
		var chartHeight = plotHeight - borderWidth;
		var chart = node.userData.plotVisual;
		if (!chart){
			chart = node.graphics.rect(borderXPos,
				borderYPos,
				chartWidth,
				chartHeight);
			node.userData.plotVisual = chart;
		}
		node.graphics.attr(chart, {'stroke':borderWidth?borderStroke:null,
				'stroke-width':borderWidth,
				'opacity':opacity,
				'x': borderXPos,
				'y': borderYPos,
				'fill':fill, //Fill can't be a null value otherwise the chart will not be pannable.
				'width':chartWidth,
				'height':chartHeight});
	},

	calculateChartSpecs = function(node){
		var chart = node.userData.chart;
		var innerCanvas = node.userData.chart.innerCanvas = {};

		var titleSpec = this.valueFor('title-spec', node.data, null);

		// Check if any axes margins have been specified.
		var yMargin = this.valueFor('y-margin', node.data, 0),
			xMargin = this.valueFor('x-margin', node.data, 0);

		if (!yMargin && this.axisArray.y[0]){
			yMargin = this.axisArray.y[0].valueFor('margin', node.data, 0);
		}
		if (!xMargin && this.axisArray.x[0]){
			xMargin = this.axisArray.x[0].valueFor('margin', node.data, 0);
		}

		// Get the size of the title margin, if any. There are 2 scenarios to consider:
		// 1. If a title has been specified, use the associated title margin value.
		// If none has been provided, use the minimum default title margin value.
		// 2. If the y-axis is visible, we want to make sure there is a little space
		// reserved for the topmost tick label to bleed into. Since the labels are typically
		// aligned with the centre of a tick mark, if the topmost tick falls inline with the
		// top of the chart border, then the top half of the accompanying label will actually
		// be positioned above the chart. We leave a little space so that the top of the label
		// doesn't get clipped.
		var yVisible = this.axisArray.y[0] && this.axisArray.y[0].valueFor('visible', null, false);
		var	titleMargin = (titleSpec && this.valueFor('title-margin', node.data, this.MIN_TITLE_MARGIN))
			|| (yVisible && yMargin && this.MIN_TITLE_MARGIN)||0;

		// If the axis layer is not visible AND no axis margin has been
		// allocated, we can shortcut the rest of the chart dimension
		// calculations.
		if (yMargin === 0 && xMargin === 0){
			node.userData.plotBounds = {width:chart.width,
				height:chart.height-titleMargin,
				position:[chart.position[0], chart.position[1]+titleMargin]};

			innerCanvas.width = chart.width;
			innerCanvas.height = chart.height-titleMargin;
			innerCanvas.position = [chart.position[0], chart.position[1]+titleMargin];
			return;
		}

		var borderWidth = chart.width-yMargin;
		var borderHeight = chart.height-xMargin-titleMargin;
		var borderXPos = yMargin + chart.position[0];
		var borderYPos = titleMargin + chart.position[1];

		node.userData.plotBounds = {width:borderWidth, height:borderHeight,
				position:[borderXPos, borderYPos]};

		innerCanvas.width = borderWidth;
		innerCanvas.height = borderHeight;
		innerCanvas.position = [borderXPos, borderYPos];
	},

	//TODO: Expose this with a getter like how the axes logic has been done.
	configureTitle = function(node){
		var titleSpec = this.valueFor('title-spec', node.data, null);
		if (titleSpec){
			// Check to see if we have a text layer for the title, if not
			// we'll lazily create it.
			if (!this.titleLayer){
				this.titleLayer = this.addLayer(aperture.LabelLayer);
				this.titleLayer.map('text-anchor').asValue('middle');
				this.titleLayer.map('x').from('x').only().using(this.DEFAULT_RANGE.mappedTo([0,1]));
				this.titleLayer.map('y').from('y').only().using(this.DEFAULT_RANGE.mappedTo([1,0]));
				this.titleLayer.map('text').from('text');
				this.titleLayer.map('text-anchor-y').asValue('top');
				this.titleLayer.map('orientation').asValue(null);

				// Setup optional font attribute mappings. Default values are provided
				// if no explicit value is provided.
				this.titleLayer.map('font-family').asValue(titleSpec['font-family']||null);
				this.titleLayer.map('font-size').asValue(titleSpec['font-size']||null);
				this.titleLayer.map('font-weight').asValue(titleSpec['font-weight']||null);
			}
			this.titleLayer.all({'x':0.5, 'y':1,'text': titleSpec.text});
		}
	},

	configureAxes = function(){
		var hasAxis = false;

		aperture.util.forEach(this.axisArray.x, function(xAxisLayer){
			if (xAxisLayer.valueFor('visible') == true){
				// Makes sure a data object has been supplied since
				// the user may have created an axis through the getter
				// and not assigned a data source.
				var mapKeyX = this.mappings().x.transformation;
				var rangeX = mapKeyX.from();
				if (xAxisLayer == this.axisArray.x[0] || !xAxisLayer.hasLocalData) {
					xAxisLayer.all(mapKeyX);
				}

				if (rangeX.typeOf(/banded/)){
					xAxisLayer.map('x').from('ticks[].min');
				}
				else {
					xAxisLayer.map('x').from('ticks[]');
				}

				// Make sure that the value for the margin of the primary axis and
				// the value allocated by the chart match.
				var chartMargin = this.valueFor('x-margin', null, 0);
				var axisMargin = this.axisArray.x[0].valueFor('margin', null, 0);
				if (axisMargin != chartMargin){
					this.map('x-margin').asValue(axisMargin);
				}
			}
		}, this);

		// Check if the y-axis is enabled.
		aperture.util.forEach(this.axisArray.y, function(yAxisLayer){
			if (yAxisLayer.valueFor('visible') == true){
				// Set the y-range object as the data source for the y axislayer.
				var mapKeyY = this.mappings().y.transformation;
				var rangeY = mapKeyY.from();
				if (yAxisLayer == this.axisArray.y[0] || !yAxisLayer.hasLocalData) {
					yAxisLayer.all(mapKeyY);
				}

				if (rangeY.typeOf(/banded/)){
					yAxisLayer.map('y').from('ticks[].min');
				}
				else {
					yAxisLayer.map('y').from('ticks[]');
				}

				// Make sure that the value for the margin of the primary axis and
				// the value allocated by the chart match.
				var chartMargin = this.valueFor('y-margin', null, 0);
				var axisMargin = this.axisArray.y[0].valueFor('margin', null, 0);
				if (axisMargin != chartMargin){
					this.map('y-margin').asValue(axisMargin);
				}
			}
		},this);
	},

	//TODO: Add min-ticklength for other examples.
	isManagedChild = function( layer ) {
		if (layer == this.titleLayer || layer.typeOf(namespace.AxisLayer)) {
			return true;
		}
		return false;
	},

	// validate and apply a change to the center.
	doCenter = function( c ) {
		if ( c == null) {
			return this.center;
		}

		c = Math.max(0.5 / this.zoomValue, Math.min(1 - 0.5 / this.zoomValue, c));
		if (this.center != c) {
			this.center = c;
			return true;
		}
	};


	/**
	 * @exports ChartLayer as aperture.chart.ChartLayer
	 */
	var ChartLayer = aperture.PlotLayer.extend( 'aperture.chart.ChartLayer',
	/** @lends ChartLayer# */
	{
		/**
		 * @augments aperture.PlotLayer
		 *
		 * @class The underlying base layer for charts. Type-specific
		 * charts are created by adding child layers (e.g. {@link aperture.chart.LineSeriesLayer LineSeriesLayer},
		 * {@link aperture.chart.BarSeriesLayer BarSeriesLayer}) to this layer. Axes and "rules" / grid lines
		 * can be constructed and configured using the {@link #xAxis xAxis}, {@link #yAxis yAxis}
		 * and {@link #ruleLayer ruleLayer} methods.
		 *
		 * @mapping {Number} width
		 *   The width of the chart.
		 *
		 * @mapping {Number} height
		 *   The height of the chart.
		 *
		 * @mapping {String} stroke
		 *   The line colour used to plot the graph.
		 *
		 * @mapping {Number=1} stroke-width
		 *   The width of the line used to plot the graph.
		 *
		 * @mapping {Number=1} border-width
		 *   The width of the border (if any) around the chart. Setting this value to zero will hide the
		 *   chart borders.
		 *
		 * @mapping {String='border'} border-stroke
		 *   The line colour used to draw the chart border.
		 *
		 * @mapping {'vertical', 'horizontal'} orientation
		 *   The direction that data points are plotted.
		 *   E.g. A bar chart with a <span class="fixedFont">'vertical'</span> orientation will have bars drawn top-down.
		 *   A bar chart with a <span class="fixedFont">'horizontal'</span> orientation will have bars drawn left-right
		 *
		 * @mapping {Number} title-margin
		 *   The vertical space allocated to the chart title (in pixels).
		 *
		 * @mapping {Object} title-spec
		 *   Defines the attributes of the chart's main title. For example:<br>
		 *<pre>{
		 *   text: 'Main Chart Title',
		 *   font-family: 'Arial',
		 *   font-size: 25
		 *}</pre></br>
		 *
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
			this.specData = spec.data;
			this.DEFAULT_XMARGIN = 40;
			this.DEFAULT_YMARGIN = 50;
			this.DEFAULT_RANGE = new aperture.Scalar('default_range', [0,1]);
			this.DEFAULT_BANDS = 5;
			this.MIN_TITLE_MARGIN = 10;
			// Default values.
			this.map('border-width').asValue(1);
			this.map('border-stroke').asValue(palette('border'));
			this.map('orientation').asValue('vertical');
			this.axisArray = {'x':[], 'y':[]};
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			// process the changed components.
			var toProcess = changeSet.updates;

			var that = this;

			if (toProcess.length > 0){
				var i;
				for (i=0; i < toProcess.length; i++){
					node = toProcess[i];

					// Cache the true canvas dimensions.
					node.userData.chart = {};
					this.width = node.userData.chart.width = this.valueFor('width', node.data, node.width);
					this.height = node.userData.chart.height = this.valueFor('height', node.data, node.height);
					node.userData.chart.position = node.position;

					calculateChartSpecs.call(this,node);
					updatePlotVisual.call(this, node);
					configureTitle.call(this,node);
				}
				configureAxes.apply(this);
			}

			// Iterate through all the children and render them.
			aperture.PlotLayer.prototype.render.call(this, changeSet);

		},

		renderChild : function(layer, changeSet) {
			// Before we create any child layers, we want to apply any chart
			// margins and axes compensations to the chart width/height.

			// If the range is banded, we need to shift the data points
			// so that they fall between the tick marks.
			// Tick marks for ordinal ranges indicate the bounds of a band.
			aperture.util.forEach( changeSet.updates, function (node) {
				var parentData = node.parent.userData.chart.innerCanvas;
				// Get the width of the border around the chart, if any.
				var borderWidth = this.valueFor('border-width', node.data, 1);
				node.width = parentData.width;
				node.height = parentData.height;
				node.position = [parentData.position[0], parentData.position[1]];

				// If this is the title layer we want to change the anchor point.
				if (layer === this.titleLayer){
					node.position = [parentData.position[0], node.parent.position[1]];
				}

				// If the range is banded, we may need to apply a shift the starting position
				// of any sub layers.
				// This is only for layers that are not an axis layer or rule layer.
				else if (!isManagedChild.call(this, layer)){
					node.position = [node.position[0], node.position[1]];

					var orientation = this.valueFor('orientation', node.data, 'vertical');
					if (orientation == 'horizontal'){
						var mapKeyY = this.mappings().y.transformation;
						var rangeY = mapKeyY.from();
						if (rangeY.typeOf(aperture.Ordinal)){
							var bandHeight = (node.height)/(rangeY.get().length);
							// Visuals are rendered top-down (i.e. (0,0) is in the upper-left
							// corner of the canvas) so we need to subtract half the band height
							// from the y-position so that our bars begin drawing from the
							// midpoint between tick marks.
							node.position = [node.position[0], node.position[1]-(0.5*bandHeight)];
						}
					}

					else {
						// If the range is ordinal or banded, we need to shift all the data
						// points by half the width of a band. Tick marks indicate the bounds between
						// bands, but we want the data point to be centered within the band, so to
						// compensate we use this offset.
						var mapKeyX = this.mappings().x.transformation;
						var rangeX = mapKeyX.from();
						// If this is banded, we need to check if this band
						// was derived from a scalar range, we only want to do
						// this shift for bands derived from an ordinal range.
						if (rangeX.typeOf(aperture.Ordinal)){
							var bandWidth = (node.width)/rangeX.get().length;
							node.position = [node.position[0] + (0.5*bandWidth), node.position[1]];
						}
					}

					// Set the clip region.
					node.graphics.clip(this.valueFor('clipped', node.data, true)?
							[parentData.position[0], parentData.position[1],
							parentData.width, parentData.height] : null);
				}
			}, this);


			layer.render( changeSet );
		},

		/**
		 * This method retrieves the {@link aperture.chart.RuleLayer} with the given index.
		 * @param {Number} index
		 *  the index of the RuleLayer to retrieve. If no index is provided, a list of all
		 *  RuleLayers is returned.
		 *
		 * @returns {aperture.chart.RuleLayer|Array}
		 *  the RuleLayer for the given index. If no order is specified, a list of all RuleLayer is returned.
		 * @function
		 */
		ruleLayer : function(index) {
			var ruleLayers = this.ruleLayers || [];
			if (index == undefined) {
				return ruleLayers;
			}
			else if (index == null) {
				index = 0;
			}
			var layer = ruleLayers[index];

			if (!layer) {
				layer = ruleLayers[index] = this.addLayer(aperture.chart.RuleLayer);
				// Since we only allow panning along the x-axis, we only want to allow
				// rule layers for the x-axis to pan.
				var that = this;
				layer.map('rule').filter(function( value ){
						if (layer.valueFor('axis', this, null) == 'x'){
							return that.panfilter(value);
						}
						else {
							return value;
						}
					}
				);

				this.ruleLayers = ruleLayers;
				layer.toBack(); // Send the rule layer to the back.
			}
			return layer;
		},

		/**
		 * This method retrieves the {@link aperture.chart.AxisLayer} of the given order for the X axis.
		 *
		 * @param {Number} [order]
		 *  the order of the axis to be retrieved (e.g. the primary axis would be order=0), or
		 *  -1 to retrieve an array of all axes. If no order is provided, the primary axis is returned.
		 *
		 * @returns {aperture.chart.AxisLayer|Array}
		 *  the AxisLayer for the given order, or a list of all X AxisLayers.
		 */
		xAxis : function (order) {
			if (order === -1) {
				return this.axisArray.x;
			} else if (!order || order > 1) {
				// Currently, charts only support secondary axes.
				order = 0;
			}

			var axisLayer = this.axisArray.x[order];
			if (!axisLayer){
				axisLayer = this.addLayer( aperture.chart.AxisLayer );
				axisLayer.map('visible').asValue(true);
				axisLayer.map('axis').asValue('x');
				this.axisArray.x[order] = axisLayer;
			}
			return axisLayer;
		},

		/**
		 * This method retrieves the {@link aperture.chart.AxisLayer} of the given order for the Y axis.
		 *
		 * @param {Number} [order]
		 *  the order of the axis to be retrieved (e.g. the primary axis would be order=0), or
		 *  -1 to retrieve an array of all axes. If no order is provided, the primary axis is returned.
		 *
		 * @returns {aperture.chart.AxisLayer|Array}
		 *  the AxisLayer for the given order, or a list of all Y axis AxisLayers.
		 */
		yAxis : function (order) {
			if (order === -1) {
				return this.axisArray.y;
			} else if (!order || order > 1) {
				// Currently, charts only support secondary axes.
				order = 0;
			}

			var axisLayer = this.axisArray.y[order];
			if (!axisLayer){
				axisLayer = this.addLayer( aperture.chart.AxisLayer );
				axisLayer.map('visible').asValue(true);
				axisLayer.map('axis').asValue('y');
				this.axisArray.y[order] = axisLayer;
				// We don't want the y-AxisLayer to pan horizontally
				// so we use the only() method to prevent it from
				// inheriting any x-mappings from its parent.
				var mapX = this.mappings().x;
				if (mapX){
					var mapKeyX = mapX.transformation;
					this.axisArray.y[order].map('x').only().using(mapKeyX);
				}
			}
			return axisLayer;
		}
	});

	namespace.ChartLayer = ChartLayer;

	/**
	 * @class Chart is a {@link aperture.chart.ChartLayer ChartLayer} vizlet, suitable for adding to the DOM.
	 * See the layer class for a list of supported mappings.
	 *
	 * @augments aperture.chart.ChartLayer
	 * @name aperture.chart.Chart
	 *
	 * @constructor
	 * @param {Object|String|Element} spec
	 *  A specification object detailing how the vizlet should be constructed or
	 *  a string specifying the id of the DOM element container for the vizlet or
	 *  a DOM element itself.
	 * @param {String|Element} spec.id
	 *  If the spec parameter is an object, a string specifying the id of the DOM
	 *  element container for the vizlet or a DOM element itself.
	 *
	 * @see aperture.chart.ChartLayer
	 */
	namespace.Chart = aperture.vizlet.make( ChartLayer, function(spec){
		// Default values for zooming and panning logic.
		this.zoomValue = 1;
		this.center = 0.5;
		this.panning = false;
		this.startCenter = {};

		// set up the drag handler that applies the panning.
		this.on('drag', function(event) {
			switch (event.eventType) {
			case 'dragstart':
				this.startCenter = this.center;
				this.panning = false;
				break;

			case 'drag':
				// don't start unless movement is significant.
				this.panning = this.panning || Math.abs(event.dx) > 3;

				if (this.panning) {
					this.zoomTo(this.startCenter - event.dx / this.width / this.zoomValue );
				}
				break;
			}
			return true;
		});

		// the x filter function - applies a final transform on the x mapping based on pan/zoom
		var that = this;
		this.panfilter = function(value) {
			return (value - that.center) * that.zoomValue + 0.5;
		};

		// Support panning along the x-axis.
		this.map('x').filter(this.panfilter);
		this.updateAxes = function(center){
			var bandCount = this.width / 100;
			// update bands
			if (this.axisArray.x[0]){
				// XXX: This re-creation of banding creating an additional view.proto
				// depth on every call. After some time, proto depth >> 1000
				var mapKeyX = this.mappings().x.transformation;
				var rangeX = mapKeyX.from();
				// Reband the range to reflect the desired zoom level.
				var bandedX = rangeX.banded(bandCount*this.zoomValue);
				mapKeyX = bandedX.mappedTo([0,1]);
				this.map('x').using(mapKeyX);
				this.xAxis(0).all(mapKeyX);
				// Update the rule layers of the x-axis, if any.
				aperture.util.forEach(this.ruleLayer(), function(layer){
					if (layer.valueFor('axis')==='x'){
						layer.all(bandedX.get());
						layer.map('rule').using(mapKeyX);
					}
				});
			}

			// TODO: Does secondary axis logic belong here?
			// XXX: No, this code has the effect of clobbering the banding/views
			// applied to the secondary axis on creation
			if (this.axisArray.x[1]){
				var nextOrder = bandedX.formatter().nextOrder();
				if (nextOrder){
					var secBandedX = bandedX.banded({
						'span' : 1,
						'units' : nextOrder
					});
					this.xAxis(1).all(secBandedX.mappedTo([0,1]));
				}
				// If the next time order is undefined, hide the secondary axis.
				this.xAxis(1).map('visible').asValue(!!nextOrder);
			}
		};

		// EXPOSE A ZOOM FUNCTION
		// apply a zoom, revalidating center as necessary, and update
		this.zoomTo = function(x, y, z) {
			var changed;

			z = Math.max(z || this.zoomValue, 1);

			if (this.zoomValue != z) {
				this.zoomValue = z;
				changed = true;

				// update bands
				this.updateAxes();
			}
			if (doCenter.call(this, x ) || changed) {
				this.trigger('zoom', {
					eventType : 'zoom',
					layer : this
				});
				this.updateAxes(x);
				this.all().redraw(); // todo: not everything.
			}
		};

		// expose getter, and setter of zoom only.
		this.zoom = function(z) {
			if ( z == null ) {
				return {
					zoom : this.zoomValue,
					x : this.center,
					y : 0.5
				};
			}
			this.zoomTo(this.center, null, z);
		};
	} );



	return namespace;

}(aperture.chart || {}));
