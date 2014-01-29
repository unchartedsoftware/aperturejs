/**
 * Source: SankeyPathLayer.js
 * Copyright (c) 2013 Oculus Info Inc.
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
	function preProcessor(links){
		var i, sourceMap = {},
			targetMap = {};
		var n = links.length;
		
		for (i=0; i<n; i++) {
			var link = links[i];
			var linkData   = link.data;
			var sourceData = this.valueFor('source', linkData, null);
			var targetData = this.valueFor('target', linkData, null);
			var sankeyAnchor = this.valueFor('sankey-anchor', linkData, 'top');

			var flowSpec = {
				'source': {
					'id' : sourceData.id,
					'x' : this.valueFor('node-x', sourceData, 0, linkData),
					'y': this.valueFor('node-y', sourceData, 0, linkData) ,
					'r': this.valueFor('source-offset', sourceData, 0, linkData),
					'links' : sourceData.links
				},
				'target' : {
					'id' : targetData.id,
					'x': this.valueFor('node-x', targetData, 0, linkData),
					'y': this.valueFor('node-y', targetData, 0, linkData),
					'r': this.valueFor('target-offset', targetData, 0, linkData),
					'links' : targetData.links
				},
				'link' : link,
				'sankey-anchor' : sankeyAnchor
			};
			
			if (sourceMap[sourceData.id] == null){
				sourceMap[sourceData.id] = {
						'outflows':[]};
			}
			sourceMap[sourceData.id].outflows.push(flowSpec);
			
			if (targetMap[targetData.id] == null){
				targetMap[targetData.id] = {
						'inflows':[]};
			}
			targetMap[targetData.id].inflows.push(flowSpec);
		}
		// Order the source endpoints based on the target endpoints's y-position.
		var flows, key;
		for (key in sourceMap){
			if (sourceMap.hasOwnProperty(key)) {
				flows = sourceMap[key].outflows;
				flows.sort(function(a, b) {
					return a.target.y <= b.target.y? -1 : 1;
				});
			}
		}

		// Order the incoming flows of each target node by the flow's target y-position.
		for (key in targetMap){
			if (targetMap.hasOwnProperty(key)) {
				flows = targetMap[key].inflows;
				flows.sort(function(a, b) {
					return a.source.y <= b.source.y? -1 : 1;
				});
			}
		}		
		return {'sourceMap' : sourceMap, 'targetMap' : targetMap};
	}
	
	function getFlowOffset(flowSpec){
		// Find the matching link.
		var matchLink = null,
			target = flowSpec.target,
			i;

		for (i=0; i < target.links.length; i++){
			if (target.links[i].id == flowSpec.link.data.id){
				matchLink = target.links[i];
				break;
			}
		}
		return Math.round(this.valueFor('stroke-width', matchLink, 0));		
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

	function getStackedWidth(links, sankeyAnchor){
		var width = 0, i;
		if (sankeyAnchor == 'middle'){
			for (i=0; i < links.length; i++){
				width += this.valueFor('stroke-width', links[i], 0);
			}
			return width;
		}
		// 'top' is the default anchor.
		return 0;
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
			 * @mapping {'top'|'middle'| String='top'} sankey-anchor
			 *  The relative position that the Sankey flows will start drawing from. 'top' will draw the flows top-down starting from the given node location.
			 *  'middle' will center the flows about the given node position.
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
				
				//DEBUG
				// TODO: Parameterize these later.
				var offset=0;

				
				// Remove any obsoelete visuals.
				if (changeSet.removed.length > 0){
					removeSankeys(changeSet.removed);
				}
				// PRE-PROCESSING
				// Iterate through each link and create a map describing the
				// source and target endpoints for each flow.
				var specMap = preProcessor.call(this, links);
				var sourceMap = specMap.sourceMap;
				var targetMap = specMap.targetMap;
				
				// Iterate through each source node and create the flows.
				var nIndex=0;
				var paths = [];
				
				var width=0, totalOffset=0, key, flowSpec, flowWidth, path;

				// For each target node, iterate over all the incoming flows
				// and determine the stacked, flow endpoint positions.
				for (key in targetMap){
					if (targetMap.hasOwnProperty(key)) {
						var targetSpecList = targetMap[key].inflows;
						
						width=totalOffset=0;
						for (nIndex = 0; nIndex < targetSpecList.length; nIndex++){
							flowSpec = targetSpecList[nIndex];
							
							width = getStackedWidth.call(this, flowSpec.target.links, flowSpec['sankey-anchor']);
							flowWidth = getFlowOffset.call(this, flowSpec);
							totalOffset += flowWidth*0.5;
							
							targetPt = {
										'x' : flowSpec.target.x - flowSpec.target.r,
										'y' : flowSpec.target.y + totalOffset - 0.5*width
							};
							if (targetMap[flowSpec.target.id]['stackPts'] == null){
								targetMap[flowSpec.target.id] = {'stackPts' : {}};
							}
							targetMap[flowSpec.target.id].stackPts[flowSpec.source.id] = targetPt;
							totalOffset += flowWidth*0.5;
						}
					}
				}
				
				// For each source node, iterate overall all the outgoing flows
				// and determine the stacked, flow endpoint positions.
				// Then couple these source endpoints with the target endpoints
				// from above and calculate the bezier path for that flow.
				for (key in sourceMap){
					if (sourceMap.hasOwnProperty(key)) {
						var sourceSpecList = sourceMap[key].outflows;
						
						width=totalOffset=0;
						for (nIndex = 0; nIndex < sourceSpecList.length; nIndex++){
							flowSpec = sourceSpecList[nIndex];
							width = getStackedWidth.call(this, flowSpec.source.links, flowSpec['sankey-anchor']);
							flowWidth = getFlowOffset.call(this, flowSpec);
							totalOffset += flowWidth*0.5;
	
							sourcePt = {
										'x' : flowSpec.source.x + flowSpec.source.r,
										'y' : flowSpec.source.y + totalOffset - 0.5*width
							};
							
							path = calcFlowPath(sourcePt, targetMap[flowSpec.target.id].stackPts[flowSpec.source.id]);
							
							paths.push({
								'link': flowSpec.link,
								'path' : path
							});
							totalOffset += flowWidth*0.5;
						}
					}
				}
				
				// Iterate over the list of flow paths and render.
				for (i=0; i < paths.length; i++){
					var link = paths[i].link;
					var linkData   = link.data;
					path = paths[i].path;

					var attrs = {
						'opacity': this.valueFor('opacity', linkData, 1),
						'stroke' : this.valueFor('stroke', linkData, 'link'),
						'stroke-width' : this.valueFor('stroke-width', linkData, 1)
					};

					// extra processing on stroke style
					attrs['stroke-dasharray'] = strokeStyle(attrs, this.valueFor('stroke-style', linkData, ''));

					// now render it.
					if (_sankeyCache[linkData.id]){
						attrs.path = path;
						var updateLink = _sankeyCache[linkData.id];
						link.graphics.update(updateLink, attrs, transition);
					} else {
						_sankeyCache[linkData.id] = link.graphics.path(path).attr( attrs );
					}
				}
			}
		}
	);

	return namespace;

}(aperture || {}));