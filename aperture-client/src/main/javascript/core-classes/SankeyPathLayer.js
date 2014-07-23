/**
 * Source: SankeyPathLayer.js
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

	var _sankeyCache = {};
	/**
	 * Processes some user constants, translating into dash array.
	 */
	function strokeStyle(attrs, style) {
		switch (style) {
		case 'none':
			attrs.opacity = 0;
			break;
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


	function removeSankeys(links){
		var i;

		for (i=0; i<links.length; i++) {
			var link = links[i];
			var linkData   = link.data;
			if(_sankeyCache[linkData.id]){
				delete _sankeyCache[linkData.id];
			}
		}
	}


	function stackLinks(links){
		var i, sourceMap = {},
			targetMap = {};
		var n = links.length;
		var map = this.mappings()['stroke-width'];
		var minWidth = 1;

		// need to enforce a zero bottom range for individual links or the total will be wrong.
		// real bottom range is still used as a minimum width in rendering but not stacked offsets
		if (map && map.using()) {
			minWidth = map.using().to()[0];

			if (minWidth > 0) {
				map = aperture.util.viewOf(map);
				map.using(aperture.util.viewOf(map.using()));
				map.using().toArray = map.using().toArray.slice();
				map.using().toArray[0] = 0;
			}
		}

		for (i=0; i<n; i++) {
			var link = links[i];
			var linkData   = link.data;
			var sourceData = this.valueFor('source', linkData, null);
			var targetData = this.valueFor('target', linkData, null);
			var width = map.valueFor(linkData) || 0;

			var flowSpec = {
				'source': {
					uid : this.valueFor('node-uid', sourceData, '', linkData),
					duplicateId : this.valueFor('node-id', sourceData, null, linkData),
					x : this.valueFor('node-x', sourceData, 0, linkData),
					y : this.valueFor('node-y', sourceData, 0, linkData) ,
					r : this.valueFor('source-offset', sourceData, 0, linkData)
				},
				'target' : {
					uid : this.valueFor('node-uid', targetData, '', linkData),
					duplicateId : this.valueFor('node-id', targetData, null, linkData),
					'x': this.valueFor('node-x', targetData, 0, linkData),
					'y': this.valueFor('node-y', targetData, 0, linkData),
					'r': this.valueFor('target-offset', targetData, 0, linkData)
				},
				'link' : link,
				'width' : width
			};

			var src = sourceMap[flowSpec.source.uid];
			if (src == null) {
				src = sourceMap[flowSpec.source.uid] = {'outflows':[]};
			}
			src.outflows.push(flowSpec);
			src.anchor = this.valueFor('sankey-anchor', sourceData, 'top');

			var trg = targetMap[flowSpec.target.uid];
			if (trg == null) {
				trg = targetMap[flowSpec.target.uid] = {'inflows':[]};
			}
			trg.inflows.push(flowSpec);
			trg.anchor = this.valueFor('sankey-anchor', targetData, 'top');
		}

		// Order the source endpoints based on the target endpoints's y-position.
		aperture.util.forEach(sourceMap, function(source) {
			var flows = source.outflows;
			flows.sort(function(a, b) {
				return a.target.y <= b.target.y ? -1 : 1;
			});
		});

		// Order the incoming flows of each target node by the flow's target y-position.
		aperture.util.forEach(targetMap, function(target) {
			var flows = target.inflows;
			flows.sort(function(a, b) {
				return a.source.y <= b.source.y ? -1 : 1;
			});
		});

		return {sourceMap : sourceMap, targetMap : targetMap, minWidth: minWidth};
	}


	function calcFlowPath(source, target){
		//TODO: Account for different flow styles and layout orientations.

		// Now calculate the control points for the curve.
		var midPt = {
				'x' : 0.5*(target.x + source.x),
				'y' : 0.5*(target.y + source.y)
		};

		var path = 'M' + source.x + ',' + source.y;
		// Calculate the control points.
		path += 'C' + midPt.x + ',' + source.y + ',' + midPt.x + ',' + target.y + ',' + target.x + ',' + target.y;

		return path;
	}


	// assumes pre-existence of layer.
	namespace.SankeyPathLayer = aperture.Layer.extend( 'aperture.SankeyPathLayer',

		/** @lends aperture.SankeyPathLayer# */
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
			 * @mapping {'top'|'middle'|'bottom' String='top'} sankey-anchor
			 *  The relative position that the Sankey flows will start drawing from on a node. 'top' will draw the flows top-down starting from the given node location,
			 *  'middle' will center the flows about the given node position, whereas 'bottom' will be bottom up.
			 *
			 * @mapping {Boolean=true} visible
			 *  The visibility of a link.
			 *
			 * @mapping {Number=1} opacity
			 *  The opacity of a link. Values for opacity are bound with the range [0,1], with 1 being opaque.
			 *
			 * @mapping {Object} source
			 *  The source node data object representing the starting point of the link. The source node
			 *  data object is supplied for node mappings 'node-uid', 'node-id', 'node-x', 'node-y', and 'source-offset' for
			 *  convenience of shared mappings.
			 *
			 * @mapping {Number=0} source-offset
			 *  The distance from the source node position at which to begin the link. The source-offset
			 *  mapping is supplied the source node as a data object when evaluated.
			 *
			 * @mapping {Object} target
			 *  The target node data object representing the ending point of the link. The target node
			 *  data object is supplied for node mappings 'node-uid', 'node-id', 'node-x', 'node-y', and 'target-offset' for
			 *  convenience of shared mappings.
			 *
			 * @mapping {Number=0} target-offset
			 *  The distance from the target node position at which to begin the link. The target-offset
			 *  mapping is supplied the target node as a data object when evaluated.
			 *
			 * @mapping {String} node-uid
			 *  A node's unique identifier.
			 *
			 * @mapping {String} node-id
			 *  A node's secondary id. This does not need to be unique and can be used for type or property identification.
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
					transition = changeSet.transition;

				// Remove any obsolete visuals.
				if (changeSet.removed.length > 0){
					removeSankeys(changeSet.removed);
				}

				// PRE-PROCESSING
				// Iterate through each link and create a map describing the
				// source and target endpoints for each flow.
				var specMap = stackLinks.call(this, links);
				var sourceMap = specMap.sourceMap;
				var targetMap = specMap.targetMap;
				var minWidth = specMap.minWidth;

				// Iterate through each source node and create the flows.
				var nIndex=0;
				var paths = [];

				var totalOffset, flowSpec, flowWidth;
				var targetPt, sourcePt;



				// For each target node, iterate over all the incoming flows
				// and determine the stacked, flow endpoint positions.
				aperture.util.forEach(targetMap, function(target) {
					var targetSpecList = target.inflows;

					totalOffset=0;

					if (target.anchor === 'middle' || target.anchor === 'bottom') {
						for (nIndex = 0; nIndex < targetSpecList.length; nIndex++){
							totalOffset -= targetSpecList[nIndex].width;
						}
						if (target.anchor === 'middle') {
							totalOffset *= 0.5;
						}
					}

					var sourceEndpointMap = {};
					for (nIndex = 0; nIndex < targetSpecList.length; nIndex++){
						flowSpec = targetSpecList[nIndex];
						flowWidth = Math.max(minWidth, flowSpec.width);
						var updateTargetOffset = true;

						var targetY;
						if (sourceEndpointMap.hasOwnProperty(flowSpec.source.duplicateId)) {
							targetY = sourceEndpointMap[flowSpec.source.duplicateId];
							updateTargetOffset = false;
						} else {
							targetY = flowSpec.target.y + totalOffset + flowWidth * 0.5;
							if (flowSpec.source.duplicateId != null) {
								sourceEndpointMap[flowSpec.source.duplicateId] = targetY;
							}
						}

						flowSpec.targetPt = {
							x : flowSpec.target.x - flowSpec.target.r,
							y : targetY
						};

						if (updateTargetOffset) {
							totalOffset += flowSpec.width;
						}
					}
				});

				// For each source node, iterate overall all the outgoing flows
				// and determine the stacked, flow endpoint positions.
				// Then couple these source endpoints with the target endpoints
				// from above and calculate the bezier path for that flow.
				aperture.util.forEach(sourceMap, function(source) {
					var sourceSpecList = source.outflows;

					totalOffset=0;

					if (source.anchor === 'middle' || source.anchor === 'bottom') {
						for (nIndex = 0; nIndex < sourceSpecList.length; nIndex++){
							totalOffset -= sourceSpecList[nIndex].width;
						}
						if (source.anchor === 'middle') {
							totalOffset *= 0.5;
						}
					}

					var targetEndpointMap = {};
					for (nIndex = 0; nIndex < sourceSpecList.length; nIndex++){
						flowSpec = sourceSpecList[nIndex];
						targetPt = flowSpec.targetPt;
						var updateSourceOffset = true;

						flowWidth = Math.max(minWidth, flowSpec.width);

						var sourceY;
						if (targetEndpointMap.hasOwnProperty(flowSpec.target.duplicateId)) {
							sourceY = targetEndpointMap[flowSpec.target.duplicateId];
							updateSourceOffset = false;
						} else {
							sourceY = flowSpec.source.y + totalOffset + flowWidth * 0.5;
							if (flowSpec.target.duplicateId != null) {
								targetEndpointMap[flowSpec.target.duplicateId] = sourceY;
							}
						}

						if (targetPt) {
							sourcePt = {
								x : flowSpec.source.x + flowSpec.source.r,
								y : sourceY
							};

							if (updateSourceOffset) {
								totalOffset += flowSpec.width;
							}

							paths.push({
								'link': flowSpec.link,
								'path' : calcFlowPath(sourcePt, targetPt),
								width : flowWidth
							});
						}
					}
				});

				// Iterate over the list of flow paths and render.
				for (i=0; i < paths.length; i++){
					var path = paths[i];
					var link = path.link;
					var linkData = link.data;

					var attrs = {
						'opacity': this.valueFor('opacity', linkData, 1),
						'stroke' : this.valueFor('stroke', linkData, 'link'),
						'stroke-width' : path.width
					};

					// extra processing on stroke style
					attrs['stroke-dasharray'] = strokeStyle(attrs, this.valueFor('stroke-style', linkData, '')) || undefined;

					// now render it.
					if (_sankeyCache[linkData.id]){
						attrs.path = path.path;
						var updateLink = _sankeyCache[linkData.id];
						link.graphics.attr(updateLink, attrs, transition);
					} else {
						_sankeyCache[linkData.id] = link.graphics.path(path.path);
						link.graphics.attr(_sankeyCache[linkData.id], attrs);
					}
				}
			}
		}
	);

	return namespace;

}(aperture || {}));
