/**
 * Source: NodeLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Node Layer
 */

aperture = (
/** @private */
function(namespace) {

	/**
	 * @exports NodeLayer as aperture.NodeLayer
	 */
	var NodeLayer = aperture.PlotLayer.extend( 'aperture.NodeLayer',
	/** @lends NodeLayer# */
	{
		/**
		 * @augments aperture.PlotLayer
		 * @class Layer that takes in x/y visual mappings and draws all child layer
		 * items at the specified x/y.  Also allows mapping of x and y anchor positions.
		 * Supports DOM and Vector child layers.  The following data mappings are understood:

		 * @mapping {Number} node-x
		 *   The x-coordinate at which to locate the child layer visuals.
		 * 
		 * @mapping {Number} node-y
		 *   The y-coordinate at which to locate the child layer visuals.
		 * 
		 * @mapping {Number} width
		 *   The declared width of the node, which may factor into layout.
		 * 
		 * @mapping {Number} height
		 *   The declared height of the node, which may factor into layout.
		 * 
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
		},

		canvasType : aperture.canvas.VECTOR_CANVAS,

		render : function(changeSet) {
			var that = this,
				x, y, xAnchor, yAnchor, width, height, item;
			
			// Treat adds and modifies the same - just need to update positions
			aperture.util.forEach(changeSet.updates, function( node ) {
				item = node.data;
				// Discover the mapped visual properties
				x = this.valueFor('node-x', item, 0);
				y = this.valueFor('node-y', item, 0);
				width = this.valueFor('width', item , 1);
				height = this.valueFor('height', item , 1);

				// Update the given node in place with these values
				node.position = [x,y];

				node.userData.id = item.id;
				
				// Update width/height (if it matters?)
				node.width = width;
				node.height = height;
			}, this);
			
			
			// will call renderChild for each child.
			aperture.PlotLayer.prototype.render.call( this, changeSet );
		}

	});

	namespace.NodeLayer = NodeLayer;

	/**
	 * @class NodeLink is a {@link aperture.NodeLayer NodeLayer}  vizlet, suitable for adding to the DOM.
	 * @augments aperture.NodeLayer
	 * @name aperture.NodeLink
	 *
	 * @constructor
	 * @param {String|Element} parent
	 *      A string specifying the id of the DOM element container for the vizlet or
	 *      a DOM element itself.
	 * @param {Object} [mappings]
	 *      An optional initial set of property mappings.
	 *
	 * @see aperture.NodeLayer
	 */
	namespace.NodeLink = aperture.vizlet.make( NodeLayer );

	return namespace;

}(aperture || {}));
