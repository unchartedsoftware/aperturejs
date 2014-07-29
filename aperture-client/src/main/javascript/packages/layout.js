/**
 * Source: layout.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Layout API Implementations
 */

/**
 * @class Aperture layout APIs. Provides access to a server-side layout service. Depending on the layout type specified in the parameters,
 * the corresponding layout service and algorithm is chosen.<br>
 * <p>
 *  Each layout accepts a data object containing two arrays. The first contains a list of nodes, the second, a list of links between the nodes (if applicable).
 *  <pre>{
 *   nodes : [],
 *   links : [],
 *   defaultNodeSize : {width: w, height: h} // optional. can also be specified per node
 *  };
 *  </pre>
 *<span class="fixedFont"><span class="light">{Array} </span><b>nodes</b></span><br>
 *  An array of Node objects to be arranged by the layout service.<br>
 *  An example point object would be defined as follows:
 *<pre>{
 *   id: 'Node_1',
 *   width: 20, // The width of given node in the layout.
 *   height: 20 // The height of given node in the layout.
 *}</pre>
 *
 *<span class="fixedFont"><span class="light">{Array} </span><b>links</b></span><br>
 *  An array of of objects containing a source and target node id.<br>
 *  An example link object would be defined as follows:
 *<pre>{
 *   sourceId: 'Node_1',
 *   targetId: 'Node_2
 *}</pre><br>
 *  Additionally, an optional 'options' object, containing any customizations of layout attributes.
 *</p>
 * @requires an Aperture layout service, jQuery, json2 as a JSON shim if running old browsers<br>
*/
aperture.layout = (function(namespace) {
	var u = aperture.util;
	var nodeFields = ['id','x','y','width','height','weight','tag'];
	var linkFields = ['sourceId','targetId'];

	function strip(obj, fields) {
		var n= {};

		u.forEach(fields, function(f){
			if (obj[f] !== undefined) {
				n[f] = obj[f];
			}
		});

		return n;
	}

	// common handler
	function doLayout(type, data, extents, options, callback) {

		// in array, main layout options are first, then any other layout processes.
		if (u.isFunction(options)) {
			callback = options;
			options = undefined;

		// just the regular object form
		} else if (!u.isArray(options)) {
			if (options) {
				options.type = type;
				options = [options];
			} else {
				options = {type: type};
			}
		}


	    var nodeMap= {};
        var nodes = aperture.util.map(data.nodes, function(node) {
        	nodeMap[node.id] = node;
        	return strip(node, nodeFields);
        });

        var links = aperture.util.map(data.links, function(link) {
        	return strip(link, linkFields);
        });

		function mapback(response) {
	        aperture.util.forEach(response.nodes, function(n) {
	        	var fn = nodeMap[n.id];
	        	if (fn) {
	        		fn.x = n.x;
	        		fn.y = n.y;
	        		fn.tag = n.tag;
	        	}
	        });

			if (callback) {
				callback.apply(this, arguments);
			}
		}

		aperture.io.rest('/layout', 'POST', mapback, {
			postData : {
				nodes: nodes,
				links: links,
				defaultNodeSize: data.defaultNodeSize,
				extents: extents,
				layout: options
			},
			contentType: 'application/json'
		});
	}


	/**
	 * @name aperture.layout.circle
	 * @function
	 * @description Arranges nodes around a central, circular path.
	 * @param {Object} data
	 *  The object containing the list of nodes and links.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and optional Number properties x, y, width, height and weight (indicating its scale of importance).
	 * @param {Object} data.links
	 *  An array of link objects, with sourceId and targetId properties.
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Object} [options]
	 *  Object containing any customizations of various layout attributes.
	 * @param {Number} [options.linkLength]
	 *  The ideal minimum length of a given link in the layout
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 *@returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.circle = function(data, extents, options, callback){
		doLayout('circle', data, extents, options, callback);
	};

	/**
	 * @name aperture.layout.radial
	 * @function
	 * @description Similar to the 'circle' layout, this arranges nodes around a circular path, however,
	 * nodes with high connectivity are made more visually prominent by isolating and positioning
	 * them as separate, satellite clusters around the central path.
	 * @param {Object} data
	 *  The object containing the list of nodes and links.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and optional Number properties x, y, width, height and weight (indicating its scale of importance).
	 * @param {Object} data.links
	 *  An array of link objects, with sourceId and targetId properties.
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Object} [options]
	 *  Object containing any customizations of various layout attributes.
	 * @param {Number} [options.linkLength]
	 *  The ideal minimum length of a given link in the layout
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 *@returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.radial = function(data, extents, options, callback){
		doLayout('radial', data, extents, options, callback);
	};

	/**
	 * @name aperture.layout.organic
	 * @function
	 * @description The organic layout style is based on the force-directed layout paradigm. Nodes are
	 * given mutually repulsive forces, and the connections between nodes are considered to be springs
	 * attached to the pair of nodes. The layout algorithm simulates physical forces and rearranges the
	 * positions of the nodes such that the sum of the forces emitted by the nodes and the links reaches
	 * a (local) minimum.
	 * <br>
	 * Resulting layouts often expose the inherent symmetric and clustered structure of a graph, and have
	 * a well-balanced distribution of nodes with few edge crossings.
	 * @param {Object} data
	 *  The object containing the list of nodes and links.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and optional Number properties x, y, width, height and weight (indicating its scale of importance).
	 * @param {Object} data.links
	 *  An array of link objects, with sourceId and targetId properties.
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Object} [options]
	 *  Object containing any customizations of various layout attributes.
	 * @param {Number} [options.nodeDistance]
	 *  The ideal minimum spacing between nodes
	 * @param {Number} [options.linkLength]
	 *  The ideal minimum length of a given link in the layout
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 *@returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.organic = function(data, extents, options, callback){
		doLayout('organic', data, extents, options, callback);
	};

	/**
	 * @name aperture.layout.vtree
	 * @function
	 * @description Arranges the nodes top-down, as a hierarchical, vertical tree.
	 * @param {Object} data
	 *  The object containing the list of nodes and links.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and optional Number properties x, y, width, height and weight (indicating its scale of importance).
	 * @param {Object} data.links
	 *  An array of link objects, with sourceId and targetId properties.
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Object} [options]
	 *  Object containing any customizations of various layout attributes.
	 * @param {String} [options.bottomToTop]
	 *  If true, reverses the layout direction of the tree
	 * @param {Number} [options.nodeDistance]
	 *  The ideal minimum spacing between nodes
	 * @param {Number} [options.treeLevelDistance]
	 *  The ideal distance between levels of the tree
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 *@returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.vtree = function(data, extents, options, callback){
		doLayout('vtree', data, extents, options, callback);
	};

	/**
	 * @name aperture.layout.htree
	 * @function
	 * @description Arranges the nodes left to right, as a hierarchical, horizontal tree.
	 * @param {Object} data
	 *  The object containing the list of nodes and links.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and optional Number properties x, y, width, height and weight (indicating its scale of importance).
	 * @param {Object} data.links
	 *  An array of link objects, with sourceId and targetId properties.
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Object} [options]
	 *  Object containing any customizations of various layout attributes.
	 * @param {String} [options.rightToLeft]
	 *  If true, reverses the layout direction of the tree
	 * @param {Number} [options.nodeDistance]
	 *  The ideal minimum spacing between nodes
	 * @param {Number} [options.treeLevelDistance]
	 *  The ideal distance between levels of the tree
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 * @returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.htree = function(data, extents, options, callback){
		doLayout('htree', data, extents, options, callback);
	};

	/**
	 * @name aperture.layout.tag
	 * @function
	 * @description Executes a deconflicted layout of node tags. Tag layout
	 *  can be used to strategically label (or otherwise graphically annotate) only
	 *  the most important nodes in a dense display at a readable scale without occlusion.
	 *  If the nodes have not yet been laid out, an alternative
	 *  to using this method is to use the multipass layout method.
	 *
	 *  The alignments that the implementation may consider for the annotation
	 *  may be specified by the alignments option. Alignments are: any,
	 *  topAny, bottomAny, leftAny, rightAny,
	 *  bottomLeft, bottomCenter, bottomRight, middleLeft, middleRight,
	 *  topLeft, topCenter, or topRight.
	 *
	 * @param {Object} data
	 *  The object containing the list of nodes.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and Number properties x, y, and weight (indicating its scale of importance).
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Object} [options]
	 *  Object containing any customizations of various layout attributes.
	 * @param {Number} [options.tagWidth=100]
	 *  The width reserved for each annotation.
	 * @param {Number} [options.tagHeight=15]
	 *  The height reserved for each annotation.
	 * @param {String= 'any'} [options.alignments='any']
	 *  The alignments that the implementation may choose from.
	 * @param {String= 'default'} [options.defaultAlignment='default']
	 *  The default alignment, used only when a node's annotation will be obscured and
	 *  is thus flagged with visible = false. This option is only useful when the caller
	 *  uses deconfliction to find the optimal position for annotations but still wishes
	 *  to always display all of them.
	 *
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 * @returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.tag = function(data, extents, options, callback){
		doLayout('tag', data, extents, options, callback);
	};

	/**
	 * @name aperture.layout.multipass
	 * @function
	 * @description
	 *
	 * Executes a series of layouts, such as a node layout followed by a tag layout.
	 *
	 * @param {Object} data
	 *  The object containing the list of nodes.
	 * @param {Object} data.nodes
	 *  An array of node objects, with id and Number properties x, y, and weight (indicating its scale of importance).
	 * @param {Object} [data.links]
	 *  An array of link objects, with sourceId and targetId properties.
	 * @param {Object} extents
	 *  The {width, height} extents of the layout space
	 * @param {Array} layouts
	 *  An array of layout objects, each with at minimum a field of name type indicating
	 *  the type of layout, and optionally any other fields indicating options.
	 *
	 * @param {Function} callback
	 *  The callback for handling the response from the layout service.
	 * @returns
	 *  Node and link data, as well as additional
	 *  properties about the layout.
	 **/
	namespace.multipass = function(data, extents, layouts, callback){
		doLayout(null, data, extents, layouts, callback);
	};


	return namespace;

}(aperture.layout || {}));
