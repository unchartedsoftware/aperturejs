/**
 * Source: Class.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Implements the ability to wrap any root layer as a vizlet.
 *
 */

/**
 * @namespace
 * The API for wrapping any root layer as a vizlet for insertion into the DOM.
 */
aperture.vizlet = (
/** @private */
function(namespace) {

	var log = aperture.log;

	/**
	 * Takes a layer constructor and generates a constructor for a Vizlet version of
	 * the layer.  Unlike layers which can only be used as children of other layers,
	 * Vizlets can be used as root objects and connected to a DOM element.
	 *
	 * @param {Function} layerConstructor
	 *      The constructor function for the layer for which to generate a Vizlet view.
	 *
	 * @param {Function} [init]
	 *      An optional initialization function which will be called where this
	 *      will be the newly created layer.
	 *
	 * @returns {Function}
	 *      A constructor function for a new Vizlet version of the supplied layer
	 *
	 * @name aperture.vizlet.make
	 * @function
	 */

	var make = function( layerConstructor, init ) {

		// Return a constructor function for the vizlet-layer that takes an id + a spec
		// The constructed object will have all methods of the layer but will take an
		// additional DOM element id on construction and have custom update/animate
		// methods appropriate for a top-level vizlet
		return function( spec, mappings ) {
			var elem,
				elemId,
				// Create the node that will be given to the child layer
				// on every render.
				node = {
						uid: 0,
						width: 0,		// Set at render time
						height: 0,		// Set at render time
						position: [0,0],
						anchorPoint: [0,0],
						userData: {},
						graphics : aperture.canvas.NO_GRAPHICS,
						kids: {}
					};

			if (!spec) {
				return log.error('Cannot make a vizlet from object without an element or DOM id.');
			}

			// Find the vizlet's element:
			// Is given spec actually just an element?
			if (spec.nodeType === 1) {
				elem = spec;
				spec = {};
			} else if (spec.elem) {
				elem = spec.elem;
			} else {
				if (aperture.util.isString(spec)) {
					// Given an element (id) directly instead of spec obj
					elemId = spec;
					spec = {};
				} else if (spec.id) {
					// Contained in a spec object
					elemId = spec.id;
				} else {
					return log.error('Cannot make a vizlet from object without an element or DOM id.');
				}

				if (elemId === 'body') {
					elem = document.body;
				} else {
					// TODO: we are taking id's but no longer allowing jquery selectors,
					// so only id's, without hashes, should be allowed.
					if (elemId.charAt(0) === '#') {
						elemId = elemId.substr(1);
					}
					elem = document.getElementById(elemId);
				}
			}

			var type = aperture.canvas.type( aperture.canvas.DIV_CANVAS );

			// Extend layer creation specification to include reference to this
			// and canvas
			aperture.util.extend( spec, {
				parent: null,
				rootNode: node,
				parentCanvas : new type( elem )
			});


			// Instantiate the vizlet
			// (Technically instantiating the layer that will look like a vizlet)
			var vizlet = new layerConstructor(spec, mappings);

			// Make top-level update function (will replace update in layer.prototype)
			// This is the key difference between a layer (calls parent's update) and
			// a vizlet (has a DOM element from which nodes are derived).
			var originalLayerUpdate = vizlet.update;

			/**
			 * @private
			 *
			 * Updates layer graphics.
			 *
			 * @param {aperture.Layer.NodeSet} nodes
			 *      the scope of layer nodes to be updated.
			 *
			 * @param {aperture.Transition} [transition]
			 *      an optional animated transition to use to ease in the changes.
			 *
			 * @returns {this}
			 *      this vizlet
			 */
			vizlet.redraw = function( nodes, transition ) {
				if (log.isLogging(log.LEVEL.DEBUG)) {
					log.indent(0);
					log.debug('------------------------------');
					log.debug(' UPDATE');
					log.debug('------------------------------');
				}

				// The root has no data and the node is very basic.  The assumption is
				// that either the child layer or one of its children will eventually have
				// a data definition.
				// Set the node width/height (vizlet could have been resized since last render)
				node.width = elem.offsetWidth;
				node.height = elem.offsetHeight;

				// Top level just provides a node with the container's canvas/size
				// but never indicates that it's changed etc.  Root layer will
				// manage its own data-based add/change/remove
				var changeSet = {
					updates: [],
					changed: [],
					removed: [],
					properties: null, // TODO: refactor out.
					rootSet: nodes,
					transition: transition
				};

				// Render this (ie the vizlet-ized layer)
				this.render( this.processChangeSet(changeSet) );

				// flush all drawing ops.
				spec.parentCanvas.flush();

				return this;
			};

			if (init) {
				init.apply( vizlet, arguments );
			}

			// Return the vizlet we created (not "this")
			return vizlet;
		};
	};


	namespace.make = make;


	/**
	 * @class Plot is a {@link aperture.PlotLayer PlotLayer} vizlet, suitable for adding to the DOM.
	 *
	 * @augments aperture.PlotLayer
	 * @name aperture.Plot
	 *
	 * @constructor
	 * @param {String|Element} parent
	 *      A string specifying the id of the DOM element container for the vizlet or
	 *      a DOM element itself.
	 * @param {Object} [mappings]
	 *      An optional initial set of property mappings.
	 */
	aperture.Plot= make( aperture.PlotLayer );


	return namespace;
}(aperture.vizlet || {}));
