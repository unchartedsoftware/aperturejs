/**
 * Source: LineSeriesLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture LineSeriesLayer Layer
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
	 * converts a stroke style to an svg dash pattern.
	 */
	function strokeStyleToDash(strokeStyle) {
		// Determine dash array
		switch (strokeStyle) {
		case 'dashed':
			return '- ';
		case 'dotted':
			return '. ';
		case 'none':
			return null;
		case '':
		case 'solid':
			return '';
		}
		return strokeStyle;
	}
	
	/**
	 * @private
	 * Tokenize the data points into line path segments, using
	 * changes in line style as the delimiter. For a series with
	 * a homogeneous line style, there will only be one token.
	 * @param {Array} pointList An array of js objects describing the points of this line chart.
	 * @returns An array of path segments.
	 */
	var tokenizeSeries = function(pointList){
		var pathSegments = [];

		var pathStartPos = 0;
		var lastStrokeStyle = strokeStyleToDash(this.valueFor('stroke-style', pointList, 'solid', 0));
		var lastStroke = this.valueFor('stroke', pointList,'#000000', 0);

		// The style of each segment is defined by the rightmost
		// point. We assume the points in a given series are sorted.
		var numPoints = this.valueFor('point-count', pointList, 1, 0);
		if (numPoints<2){
			return pathSegments;
		}
		var segmentPoints = [{x: this.valueFor('x', pointList, 0, 0),
			y: this.valueFor('y', pointList, 0, 0)}],
			i;

		// We want to collect all points that share the same color and stroke style
		// and render them together as a single path.
		for (i=1; i < numPoints; i++) {
			// Get the stroke style and color of this line segment.
			var strokeStyle = strokeStyleToDash(this.valueFor('stroke-style', pointList, 'solid', i));
			var lineStroke = this.valueFor('stroke', pointList, '#000000', i);

			var hasSegmentChange = (strokeStyle !== lastStrokeStyle)||(lineStroke !== lastStroke);

			var hasMorePoints = i < numPoints - 1;
			// Check to see if the x-value is ordinal.
			var xPoint = this.valueFor('x', pointList, 0, i);
			var yPoint = this.valueFor('y', pointList, 0, i);

			segmentPoints.push({x: xPoint, y: yPoint});
			// If the point is part of the same line segment, continue
			// collecting the points.
			if (!hasSegmentChange && hasMorePoints) {
				continue;
			}
			pathSegments.push({'points' : segmentPoints, 'stroke-style' : lastStrokeStyle, 'stroke' : lastStroke});
			segmentPoints = [{x: xPoint, y: yPoint}];
			pathStartPos = i - 1;
			lastStrokeStyle = strokeStyle;
			lastStroke = lineStroke;
		}

		return pathSegments;
	},

	/**
	 * @private
	 * Construct a SVG path from the specified data points.
	 * @param {Array} pathSpec An array of js objects that describe the path segments
	 * (i.e. tokenized points) of this line series.
	 */
	constructPath = function(pathSpec){
		var path, point, xPoint, yPoint, i,
			chartPosition = pathSpec.node.position;
		for (i=0; i < pathSpec.points.length; i++){
			point = pathSpec.points[i];
			xPoint = (point.x * pathSpec.node.width)
				+ (chartPosition[0]||0);
			yPoint = (point.y * pathSpec.node.height)
				+ (chartPosition[1]||0);

			if (i==0){
				path = "M" + xPoint + "," + yPoint;
			}
			path += "L" + xPoint + "," + yPoint;
		}
		return path;
	};

	/**
	 * @exports LineSeriesLayer as aperture.chart.LineSeriesLayer
	 */
	var LineSeriesLayer = aperture.Layer.extend( 'aperture.chart.LineSeriesLayer',
	/** @lends LineSeriesLayer# */
	{
		/**
		 * @augments aperture.Layer
		 * 
		 * @class A layer that takes sets of points and graphs a line for each.
		 * 
		 * @mapping {Number=1} point-count
		 *   The number of points in a line series. 
		 *   
		 * @mapping {String} stroke
		 *   Color of a line series.
		 *   
		 * @mapping {Number=1} stroke-width
		 *  The width of a line series.
		 * 
		 * @mapping {'solid'|'dotted'|'dashed'|'none'| String} stroke-style
		 *  The line style as a predefined option or custom dot/dash/space pattern such as '--.-- '.
		 *  A 'none' value will result in the line not being drawn.
		 * 
		 * @mapping {Number=1} opacity
		 *  The opacity of a line series. Values for opacity are bound with the range [0,1], with 1 being opaque.
		 * 
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings){
			aperture.Layer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {

			// Create a list of all additions and changes.
			var i, toProcess = changeSet.updates;
			for (i=toProcess.length-1; i >= 0; i--){
				var node = toProcess[i];

				// Make sure we have a proper canvas node.
				if (node.data.length == 0) {
					continue;
				}
				if (!node.userData.pathSegments) {
					node.userData.pathSegments = [];
				}

				// Get the visual properties of the chart.
				var strokeWidth = this.valueFor('stroke-width', node.data, 1);
				var strokeOpacity = this.valueFor('opacity', node.data, 1);

				// Tokenize the series into line segments.
				var lines = this.valueFor('lines', node.data, null);
				var pathSegments = [], lineNo, segNo;
				if (lines) {
					for (lineNo=0; lineNo<lines.length; lineNo++) {
						var newSegs = tokenizeSeries.call(this, lines[lineNo]);
						for (segNo=0;segNo<newSegs.length;segNo++) {
							pathSegments.push(newSegs[segNo]);
						}
					}
				} else {
					pathSegments = tokenizeSeries.call(this, node.data);
				}


				var path, pathSpec, segmentInfo, strokeStyle,
					points, point, index, segment, 
					oldn = node.userData.pathSegments.length, n = pathSegments.length;

				// Remove any extra previously rendered segments
				if ( oldn > n ) {
					node.graphics.removeAll(node.userData.pathSegments.splice(n, oldn-n));
				}
				
				// Iterate through the current segments and update or re-render.
				for (index=0; index < n; index++){
					segmentInfo = pathSegments[index];
					points = segmentInfo.points;
					pathSpec = {
							points:points,
							node:node
					};

					// Construct the SVG path for this line segment.
					path = constructPath.call(this, pathSpec);

					segment = node.userData.pathSegments[index];

					// Determine dash array
					strokeStyle = segmentInfo['stroke-style'];

					if (strokeStyle === null) {
						strokeStyle = '';
						strokeOpacity = 0;
					}

					var attrSet = {
							'stroke':segmentInfo.stroke,
							'stroke-width':strokeWidth,
							'stroke-linejoin': 'round',
							'stroke-dasharray':strokeStyle,
							'stroke-opacity':strokeOpacity};							
					
					// If this path has already exists, we don't need to render
					// it again. We just need to check if it's visual properties
					// have changed.
					var hasDataChange = true;
					if (segment){
						var prevPath = node.graphics.attr(segment,'path').toString();
						if (path === prevPath){
							// No data change, update attributes and continue
							if (node.graphics.attr(segment, 'stroke') != segmentInfo.stroke){
								attrSet.stroke = segmentInfo.stroke;
							}
							if (node.graphics.attr(segment, 'stroke-width') != strokeWidth){
								attrSet['stroke-width'] = strokeWidth;
							}
							if (node.graphics.attr(segment, 'stroke-dasharray') != strokeStyle){
								attrSet['stroke-dasharray'] = strokeStyle;
							}
							if (node.graphics.attr(segment, 'stroke-opacity') != strokeOpacity){
								attrSet['stroke-opacity'] = strokeOpacity;
							}
							hasDataChange = false;
						} else {
							// Data has changed, update the line's path.
							attrSet['path'] = path;
						}
					}

					else {
						// Create a visual for the new path segment.
						segment = node.graphics.path(path);
					}
					// Apply attributes to the segment.
					node.graphics.attr(segment, 
							attrSet, 
							changeSet.transition);
					// If the data has changed, update the
					// corresponding references.
					if (hasDataChange){
						node.graphics.data( segment, node.data );

						// Store the visuals associated with this node.
						node.userData.pathSegments[index] = segment;
					}
				}
			}
		}
	});
	namespace.LineSeriesLayer = LineSeriesLayer;

	return namespace;
}(aperture.chart || {}));
