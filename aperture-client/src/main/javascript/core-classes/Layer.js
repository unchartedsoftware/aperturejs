/**
 * Source: Layer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Abstract Layer Class Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	
	// PRIVATE REFERENCES AND FUNCTIONS
	/**
	 * Keep a running globally unique id set such that each render node can have a
	 * unique id.  This allows nodes to be easily hashed.
	 */
	var log = aperture.log,
		nextUid = 1,
		NO_GRAPHICS = aperture.canvas.NO_GRAPHICS,
		
		// util is always defined by this point
		util = aperture.util,
		forEach = util.forEach,
		indexOf = util.indexOf;

	/**
	 * Given a Node object create a derived node that shares the source's
	 * core features (such as position, anchor, etc) but has a fresh (empty) userData
	 * object
	 */
	function addNode( layer, parent, prev, data ) {
		// Derive an object
		var node = util.viewOf( parent ),
			sibs = parent.kids,
			luid = layer.uid;
		
		// append ourselves to existing siblings.
		(sibs[luid] || (sibs[luid] = [])).push(node);
		
		// Initialize unique properties.
		node.uid      = (nextUid++).toString();
		node.parent   = parent;
		node.next     = null;
		node.prev     = null;
		node.layer    = layer;
		node.kids     = {};
		node.userData = {};
		node.graphics = NO_GRAPHICS;

		// Set data if given, otherwise it will inherit it.
		if( data ) {
			node.data = data;
			node.idFn = layer.idFunction;
		}
		
		// do graphics construction.
		updateVisibility(node);
		
		linkNode(node, prev);
		
		return node;
	}

	
	/**
	 * Default data item function
	 */
	var inherited = (function() {
		var copydata = [null], nodata = []; // use these once
		
		return function(data) {
			return data? copydata : nodata;
		};
	}());
	
	
	/**
	 * Updates the visibility, creating the graphics for the first time if necessary,
	 * and returns true if showing. 
	 */
	function updateVisibility( node ) {
		var layer = node.layer;
		
		if (layer) {
		
			var show = layer.valueFor('visible', node.data, true );

			// reset.
			node.appearing = false;
		
			if (show) {
				if (node.graphics === NO_GRAPHICS && node.parent.graphics) {
					var g = node.graphics = layer.canvas_.graphics( node.parent.graphics ).data( node );
				
					// event hooks for any current events
					forEach(layer.handlers_, function(h, key) {
						g.on(key, this);
					}, layer);
				
					node.appearing = true;
				
				} else {
					node.appearing = node.graphics.display(true);
				}
			
			} else if (node.graphics) {
				node.graphics.display(false);
			}
		
			return show;
		}
	}

	/**
	 * Link a new node into the list. For optimal traversal and removal nodes
	 * store references their adjacent nodes rather than externalizing that in a list structure.
	 */
	function linkNode( node, prev ) {
		if (prev == null) {
			// Insert node at head of layer's node list
			node.next = node.layer.nodes_;
			node.layer.nodes_ = node;
			node.prev = null;
		} else {
			// Insert node elsewhere
			node.next = prev.next;
			prev.next = node;
			node.prev = prev;
		}
		if (node.next) {
			node.next.prev = node;
		}
	}

	/**
	 * Remove a node from the linked list.
	 */
	function unlinkNode( c ) {
		
		// stitch
		if (c.prev) {
			c.prev.next = c.next;
		} else {
			c.layer.nodes_ = c.next;
		}
		
		if (c.next) {
			c.next.prev = c.prev;
		} 
	}
	
	/**
	 * node removal function.
	 */
	function removeNode(c) {
		var sibs = c.parent.kids[c.layer.uid],
			ixMe = indexOf(sibs, c);
		
		if (ixMe !== -1) {
			sibs.splice(ixMe, 1);
		}
		
		// cleanup graphics.
		c.graphics.remove();
		c.graphics = null;
		c.layer = null;
	}
	
	/**
	 * Private function called by processChangeSet invoked if the layer has local data and
	 * is not being built up from scratch.
	 */
	function processDataChanges( myChangeSet, parentChangeSet ) {
		var chgs = myChangeSet.changed, c;

		
		// DATA CHANGED? SORT *ALL* CHANGES OUT AND RETURN
		// if our data changes, we have to execute a full pass through everything
		// to sort into add/changed/removed. Adds and removes are always processed, and changes
		// are only marked if the hints dictate a data changed happened. this could be made more
		// efficient if data models exposed chg fns to the user - i.e. w/ adds, joins etc.
		if (this.dataChangeHints) {
			var allParents  = (this.parentLayer_ && this.parentLayer_.nodes_) || this.rootNode_,
				adds = myChangeSet.added,
				rmvs = myChangeSet.removed,
				myUid = this.uid,
				idFunction = this.idFunction,
				prev, dad, i;
			
			// form new ordered list of nodes.
			this.nodes_ = null;
			
			// re-compare EVERYTHING and sort into add/changed/removed
			for (dad = allParents; dad != null; dad = dad.next) {
				var existing = indexNodes(dad.kids[myUid]),
					newkids = dad.kids[myUid] = [];

				// for all my new items, look for matches in existing.
				forEach( this.dataItems( dad.data ), function( dataItem ) {
					c = null;
					
					var dataId = idFunction? idFunction.call(dataItem) : dataItem;
						
					for (i = existing.next; i != null; i = i.next) {
						c = i.node;

						// match?
						if ((c.idFn? c.idFn.call(c.data) : c.data) === dataId) {
							// remove it by stitching adjacent nodes together.
							// Makes subsequent searches faster and will leave
							// existing with only the things that have been removed.
							i.prev.next = i.next;
							if (i.next) {
								i.next.prev = i.prev;
							}
							
							break;
							
						} else {
							c = null;
						}
					}
					
					// found? process change
					if (c) {

						// readd to fresh kid list
						newkids.push(c);
						
						// link it back in.
						linkNode( c, prev );
					
						// update data reference.
						c.data = dataItem;
						c.idFn = idFunction;

						// only process further if showing and hints say data actually changed
						if (updateVisibility(c) && this.dataChangeHints.changed) {
							chgs.push(c);
						}
						
					// else make new
					} else {
						adds.push( c = addNode( this, dad, prev, dataItem ) );
					}
					
					prev = c;
					
				}, this);

				// whatever is left is trash. these are already removed from our locally linked list.
				for (i = existing.next; i != null; i = i.next) {
					rmvs.push(i.node);
				}
			}
			
		// SHORTCUT: EVERYTHING IS A SIMPLE UPDATE AND I AM THE ROOT
		// last of the special cases. If we receive this we are the first in traversal
		// that contains data and our job is to simply to add everything visible as changed.
		// thereafter children will pick it up properly and interpret in the node of any data changes.
		// we know there are no removes or adds, since we are top in the chain and we already looked locally
		} else if (myChangeSet.updateAll) {
			for (c = this.nodes_; c != null; c = c.next) {
				if (updateVisibility(c)) {
					chgs.push(c);
				}
			}
			
		// else process parent changes as usual.
		} else {					
			return false;
		}
		
		// clear
		myChangeSet.updateAll = false;
		
		return true;
	}

	/**
	 * Creates and returns an iterable, modifiable snapshot of the specified node list,
	 * where the first element is a non-node reference to the first node.
	 */
	function indexNodes(nodes) {
		var h = {}; // head element is not a node.

		if (nodes) {
			var n = nodes.length, 
				i, it = h;
			
			for (i=0; i< n; ++i) {
				it = it.next = {
					prev : it,
					node : nodes[i]
				};
			}
		}
		
		return h;
	}
	
	/**
	 * Default idFunctions, if id's exist or not.
	 */
	function getId() {
		return this.id;
	}

	
	
	// LAYER CLASS
	var Layer = aperture.Class.extend( 'aperture.Layer',

		/** @lends aperture.Layer# */
		{
			/**
			 * @class A layer represents a set of like graphical elements which are mapped
			 * in a spatial node. Layer is the abstract base class of all graphical layers.
			 *
			 * Layer is abstract and not to be constructed directly.
			 * See {@link aperture.PlotLayer#addLayer addLayer} for an example of how to add layers
			 * to a vizlet.
			 *
			 * All layers observe the following mapping:

			 * @mapping {Boolean=true} visible
			 *   Whether or not a layer item should be displayed.
			 *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Class
			 *
			 * @param {Object} spec
			 *   A specification object that contains initial values for the layer.
			 *   
			 * @param {aperture.PlotLayer} spec.parent
			 *   The parent layer for this layer. May be null.
			 *   
			 * @param {aperture.canvas.Canvas} spec.parentCanvas
			 *   The parent's canvas, never null.
			 *   
			 * @param {Object} [spec.mappings]
			 *   Optional initial simple property : value mappings. More advanced
			 *   mappings can be defined post-construction using the {@link #map}
			 *   function.
			 */
			init : function( spec, mappings ) {

				spec = spec || {};

				/**
				 * ${protected}
				 * 
				 * A Unique layer id string.
				 */
				this.uid = (nextUid++).toString();

				/**
				 * @private
				 * This layer's parent layer
				 */
				this.parentLayer_ = spec.parent;

				/**
				 * @private
				 * This layer's root vizlet node.
				 */
				this.rootNode_ = spec.rootNode;
				
				/**
				 * @private
				 * This layer's root vizlet.
				 */
				this.vizlet_ = spec.vizlet || this;
				
				/**
				 * @private
				 * This layer's canvas
				 */
				this.canvas_ = spec.parentCanvas && spec.parentCanvas.canvas(this.canvasType);

				/**
				 * @private
				 * An object containing the currently mapped event handlers registered by
				 * a call to on().  This object is structured as a map of event types to
				 * an array of callback functions.
				 */
				this.handlers_ = {};

				/**
				 * @private
				 * Tracks switches between local and inherited only data.
				 */
				this.renderedLocalData_ = false;
				
				
				/**
				 * ${protected}
				 * An array of nodes rendered by this layer.  Generally this
				 * list should only be used by the internal logic responsible for the layer
				 * rendering management.
				 */
				this.nodes_ = undefined;

				/**
				 * @private
				 * A data accessor function which returns an array of data items. 
				 * The function will take a parent data item as an argument, which will be
				 * ignored if data values were set explicitly. Unless data is explicitly set
				 * for this layer this function will return an array containing a single local data
				 * element of undefined, reflecting an inheritance of the parent data item.
				 */
				this.dataItems = inherited;

				/**
				 * ${protected}
				 * True if the layer has locally defined data, false if inherited.
				 */
				this.hasLocalData = false;
				
				/**
				 * @private
				 * A hash of visualProperty names to mapping information objects.  Inherits parent's
				 * mappings if this layer has a parent.
				 */
				if( this.parentLayer_ && this.parentLayer_.mappings ) {
					// Inherit mappings from parent
					this.maps_ = util.viewOf( this.parentLayer_.mappings() );
				} else {
					// No parent mappings, no inherit
					this.maps_ = {};
				}

				// Add all initial mappings (order is important here)
				this.mapAll(spec.mappings);
				this.mapAll(mappings);
			},

			/**
			 * Removes a layer from its parent.
			 *
			 * @returns {aperture.Layer}
			 *      This layer.
			 */
			remove : function( ) {
				if (this.parentLayer_) {

					// Remove from layer list
					this.parentLayer_.layers_ = util.without( this.parentLayer_.layers_, this );
					this.parentLayer_ = null;

					// remove all graphics
					var c;
					for (c = this.nodes_; c != null; c = c.next) {
						removeNode(c);
					}
					
					this.nodes_ = null;
				}

				return this;
			},

			/**
			 * Returns a {@link aperture.Mapping Mapping} for a given graphic property
			 * to map it from source values. Map is a key function in layers, responsible
			 * for the transformation of data into visuals. Mappings inherit from parent
			 * mappings in the layer hierarchy unless cleared or overridden.
			 *
			 * @param {String} graphicProperty
			 *      The graphic property to return a map for.
			 *
			 * @returns {aperture.Mapping}
			 *      A mapping for this property.
			 */
			map : function ( graphicProperty ) {
				var maps = this.maps_;
				
				// If already have our own local mapping for this, return it
				if( maps.hasOwnProperty(graphicProperty) ) {
					return maps[graphicProperty];
				} 

				// Else must derive a mapping from the parent's mapping 
				// This allows us to first map 'x' in a child layer and then
				// map 'x' in the parent and the mappings will still be shared
				var mapping = this.parentLayer_? 
					util.viewOf(this.parentLayer_.map( graphicProperty )) :
						new namespace.Mapping(graphicProperty);

				return (maps[graphicProperty] = mapping);
			},

			/**
			 * Takes an object and maps all properties as simple values.
			 *
			 * @param {Object} propertyValues
			 *      The object with property values to map.
			 *
			 * @returns {aperture.Layer}
			 *      This layer.
			 */
			mapAll : function ( propertyValues ) {
				forEach(propertyValues, function(value,key) {
					this.map(key).asValue(value);
				}, this);
			},

			/**
			 * Returns an object with properties and their mappings.
			 * @returns {Object} An object with properties and their mappings.
			 */
			mappings : function( ) {
				return this.maps_;
			},

			/**
			 * ${protected}
			 * Returns the value for a supplied visual property given the  object that
			 * will be the source of the data for the mapping.  If the name of the property
			 * does not have a corresponding mapping undefined will be returned.
			 *
			 * @param {String} property
			 *      The name of the visual property for which a value is requested
			 * @param {Object} dataItem
			 *      The data item that will be used as the data source for the mapping
			 * @param {Object} [defaultValue]
			 *      An optional default value that will be returned if a mapping for this
			 *      visual property does not exist.
			 * @param {Number} [index]
			 *      One or more optional indexes to use if this is an array-based visual property
			 *
			 * @returns the value of the visual property based on the mapping or undefined
			 * if no mapping is defined.
			 */
			valueFor : function( property, dataItem, defaultValue, index ) {
				// NOTE TO SELF: would be more optimal if index... was an array rather than args

				var mapping = this.maps_[property];
				if( mapping ) {
					// Create arguments to pass to "valueFor" [layer, dataItem, index, ...]
					var args = Array.prototype.slice.call(arguments, 3);
					var value = mapping.valueFor( dataItem, args );

					if (value != null) {
						return value;
					}
				}
				// No parent, no value, use default (or return undefined)
				return defaultValue;
			},

			/**
			 * ${protected}
			 * Returns one or more values transformed using registered mappings. This method
			 * is similar to valueFor but excludes the data lookup.
			 *
			 * @param {Object|String,Object} properties
			 *      Named property values to transform using the layer's mapping, supplied
			 *      as an object or a name argument and value argument.
			 *
			 * @returns the values of the visual properties as an object if called with an object,
			 * 		or as a single transformed value if called with name, value arguments. If
			 * 		no mapping exists this method will return undefined.
			 */
			transform : function( properties, value, filterData, filterIndex ) {
				var mapping;
				
				if (properties) {
					if (arguments.length > 1) {
						if (mapping = this.maps_[properties]) {
							return mapping.value( value, filterData, filterIndex );
						}
					} else {
						var mapped = {};
						var maps = this.maps_;
						
						forEach(properties, function(value, value) {
							if (mapping = maps[name]) {
								mapped[name] = mapping.value( value, filterData, filterIndex );
							}
						});
						
						return mapped;
					}
				}
			},

			/**
			 * ${protected}
			 * Returns the values for a supplied set of visual properties given the object that
			 * will be the source of the data for the mapping.  If the name of the property
			 * does not have a corresponding mapping undefined will be returned.
			 *
			 * @param {Object} properties
			 *      The visual properties for which values are requested, with default
			 *      values.
			 * @param {Object} dataItem
			 *      The data item that will be used as the data source for the mapping
			 * @param {Object} [index]
			 *      An optional index to use if this is an indexed set of visual properties
			 *
			 * @returns {Object} the values of the visual properties based on the mappings.
			 *
			 */
			valuesFor : function( properties, dataItem, index ) {
				var property, mapping, value, values= {};

				for (property in properties) {
					if (properties.hasOwnProperty(property)) {
						values[property] = (mapping = this.maps_[property]) &&
							(value = mapping.valueFor( dataItem, index || [] )) != null?
									value : properties[property];
					}
				}

				return values;
			},

			/**
			 * ${protected}
			 * The type of canvas that this layer requires to render.  At minimum,
			 * the following types are supported:
			 * <ul>
			 * <li>aperture.canvas.DIV_CANVAS</li>
			 * <li>aperture.canvas.VECTOR_CANVAS</li>
			 * </ul>
			 * The canvasType property is used by parent layers to attempt to provide the
			 * desired {@link aperture.Layer.Node} to this layer during
			 * render.
			 */
			canvasType : aperture.canvas.DIV_CANVAS,


			/**
			 * Returns the logical set of all layer nodes, or (re)declares it by providing source data
			 * for each node to be mapped from. 
			 *
			 * @param {Array|Object|Function} data
			 *      the array of data objects, from which each node will be mapped.  May be an array 
			 *      of data objects, a single data object, or a function that subselects data objects
			 *      from each parent data object.  If an array of data is given a graphic
			 *      will be created for each item in the array.  If the parent layer has more than
			 *      one data item, data items will be rendered per parent data
			 *      item.  
			 *      
			 * @param {Function|String} [idFunction]
			 *      optionally a function or field name that supplies the id for a data item to
			 *      match items from one update to another. If a function is supplied it will be called 
			 *      with the item as a parameter. If not supplied, id functions will be remembered from 
			 *      previous calls to this method, but can be cleared by specifying null. If never
			 *      supplied, a best guess is made using item.id for matching if found in the data set 
			 *      supplied, or exact object instances if not.
			 *      
			 * @returns {aperture.Layer.NodeSet}
			 *      the logic set of all layer nodes.
			 */
			all : function ( data, idFunction ) {
				return this.join.apply( this, arguments ); // not implemented yet.
			},

			/**
			 * Merges in new data, returning the logical set of all layer nodes. This method differs
			 * from {@link #all} only in that it compares the new data set to the old data set and if 
			 * the same node is identified in both it will update the existing one rather than creating a
			 * new one. A common use case for joins is to animate transitions between data sets.
			 */
			join : function( data, idFunction ) {
				if (arguments.length !== 0) {
					this.dataItems = inherited;
					this.hasLocalData = false;
					
					// Set new data mapping/array if given
					if ( data ) {
						this.hasLocalData = true;
						
						// Mapping function for parent data
						if( util.isFunction(data) ) {
							this.dataItems = data;
							data = null;
							
						} else {
							// If not an array, assume a single data object, create an array of 1
							if ( !util.isArray(data) ) {
								data = [data];
							}
							this.dataItems = function() {
								return data;
							};
							this.dataItems.values = data;
						}
					}
					
					// handle simple field names as well as functions.
					if ( idFunction !== undefined ) {
						if ( util.isString(idFunction) ) {
							this.idFunction = idFunction === 'id'? getId : function() {
								return this[idFunction];
							};
						} else {
							this.idFunction = idFunction;
						}
						
					} else if (!this.idFunction) {
						// best guess: use id if it seems to be there, otherwise test the instance.
						this.idFunction = data && data.length && data[0].id? getId : null;
					}
					
					// mark everything changed for next render loop.
					this.dataChangeHints = {
						delta: true,
						changed: true
					};
				}
				
				return new aperture.Layer.LogicalNodeSet(this);
			},
			
			/**
			 * Adds to the logical set of all layer nodes, returning the set of added items. The idFunction, 
			 * if given via join or all, remains unchanged.
			 * 
			 * @param {Array|Object} data
			 *      the array of data objects, from which each node will be mapped.  May be an array 
			 *      of data objects or a single data object, and may not be a data subselection function.  
			 *      If this layer already gets its data from a subselection function set through {@link #all} 
			 *      or {@link #join}, this function will fail.
			 *      
			 * @returns {aperture.Layer.NodeSet}
			 *      the set of added layer nodes.
			 */
			add : function( data ) {
				if (this.hasLocalData && this.dataItems.values) {
					// Existing dataset to add to
					var newData = this.dataItems.values.concat(data);
					this.dataItems = function() {
						return newData;
					};
					this.dataItems.values = newData;

					this.dataChangeHints = this.dataChangeHints || {};
					this.dataChangeHints.delta = true;

					// return a nodeset filtered to the new data
					return new aperture.Layer.LogicalNodeSet(this).where(data);
				} else if (this.hasLocalData) {
					// Local data is a function operator on the parent, illegal call to add
					throw new Error('Can only add data to a layer with a dataset already specified');
				} else {
					// No local data, this add is the same as calling all
					return this.all(data);
				}
			},

			/**
			 * ${protected}
			 * Removes the contents of a nodeset from this layer's data. This is used internally
			 * by the framework, {@link aperture.Layer.NodeSet#remove} should be used instead of
			 * this method.
			 * 
			 * @param {aperture.Layer.NodeSet} nodeset
			 *      The set of data nodes to remove from this layer.
			 *
			 * @returns {aperture.Layer.NodeSet} the removed nodeset
			 */
			removeNodeSet : function ( nodeset ) {
				if (this.hasLocalData && this.dataItems.values) {
					var removeIter = nodeset.data(),
						removedArray = [],
						node;

					// Create searchable array of values to remove from iter
					while (node = removeIter.next()) {
						removedArray.push(node);
					}

					// filter out values to remove
					var newData = util.filter(this.dataItems.values, function(value) {
						return !util.has(removedArray, value);
					});

					this.dataItems = function() {
						return newData;
					};
					this.dataItems.values = newData;

					// Mark delta changes, no changes to existing data
					this.dataChangeHints = this.dataChangeHints || {};
					this.dataChangeHints.delta = true;

					// return a nodeset filtered to the new data
					return nodeset;
				} else {
					// Local data is a function operator on the parent, illegal call to add
					throw new Error('Can only remove data from a layer with a dataset already specified');
				}
			},
			
			/**
			 * ${protected}
			 * Forms the change list for this layer and returns it.  An object containing information about the data or
			 * visual changes as they pertain to the parent layer is provided.
			 * 
			 * @param {Object} parentChangeSet
			 * @param {Array} parentChangeSet.updates a list of visible Nodes that are added or changed.
			 * this is the list that a graphic child should redraw.
			 * @param {Array} parentChangeSet.added a list of new Node objects pertaining to added data
			 * @param {Array} parentChangeSet.changed a list of visible Node objects pertaining to changed data.
			 * @param {Array} parentChangeSet.removed a list of Nodes that should be removed due to the
			 * removal of the corresponding data
			 *
			 * @returns {Object}
			 *      the changeSet object that this layer may be given to render itself
			 */
			processChangeSet : function ( parentChangeSet ) {
				
				var myChangeSet = util.viewOf( parentChangeSet ),
					myUid = this.uid,
					hasLocalData = this.hasLocalData,
					c, i, n;

				// inherit most things but not these
				var chgs = myChangeSet.changed = [],
					adds = myChangeSet.added = [],
					rmvs = myChangeSet.removed = [];

				// If "changes" in parent changeset represent actual *data* changes, mark our change hints to
				// reflect this. Will result in full reprocess of data
				if (parentChangeSet.dataChanged && hasLocalData && !this.dataItems.values) {
					this.dataChangeHints = this.dataChangeHints || {};
					this.dataChangeHints.changed = true;
				}

				// Mark set of "changes" in this changeset as actual *data* changes not just requests to redraw
				// if data in this layer was actually changed or flag is cascading down from parent and this layer's
				// data is computed via data subselect
				myChangeSet.dataChanged = this.dataChangeHints && this.dataChangeHints.changed;
				

				// SHORTCUT REMOVAL
				// if we rendered local data last time and not this, or vice versa,
				// we need to destroy everything and rebuild to respect new orders of data.
				if (this.renderedLocalData_ != hasLocalData) {
					this.renderedLocalData_ = hasLocalData;
	
					for (c = this.nodes_; c != null; c = c.next) {
						rmvs.push(c); // don't need to unlink - we are resetting the list.
					}
					
					this.nodes_ = null; // trigger rebuild below
				}
				
				
				var prev, dad;
				
				// SHORTCUT REBUILD
				// if complete build, spawn all new nodes.
				if ( !this.nodes_ ) {
					for (dad = (this.parentLayer_ && this.parentLayer_.nodes_) || this.rootNode_; dad != null; dad = dad.next) {
						forEach( this.dataItems( dad.data ), function( dataItem ) {
							adds.push( prev = addNode( this, dad, prev, dataItem ) );
							
						}, this);
					}
					
					// if we are in the change set but have no nodes of our own, implicitly
					// select all children. set this flag for descendants to find.
					if ( !this.nodes_ && myChangeSet.rootSet.hasLayer(this) ) {
						myChangeSet.updateAll = true;
					}
					
					
				// NO DATA OF OUR OWN?
				// when we own data we maintain a node set PER parent node, else there is one per parent node.
				// if we didn't build have been this way before and we know we can trust the list of parent changes.
				} else if( !hasLocalData || !processDataChanges.call( this, myChangeSet, parentChangeSet )) {
					
					// REMOVE ALL MY CHILDREN OF REMOVED
					forEach( parentChangeSet.removed, function(dad) {
						var mine = dad.kids[myUid];
						
						n = mine && mine.length;
							
						// append to removals and remove from local linked list.
						if (n) {
							for (i=0; i<n; ++i) {
								rmvs.push( c = mine[i] );
								unlinkNode(c);
							}
						}
						
					}, this);
					
					// CHANGE ALL MY VISIBLE CHILDREN OF CHANGED
					// notice currently that a change to a parent means a change to all children.
					forEach( parentChangeSet.changed, function(dad) {
						var mine = dad.kids[myUid];
						n = mine && mine.length;
						
						if (n) {
							for (i=0; i<n; ++i) {
								if (updateVisibility( c = mine[i] )) {
									chgs.push(c);
								}
							}
						}
						
					}, this);

					// THEN ADD ALL CHILDREN OF ADDS.
					// then finally process all adds. we do this last so as not to search these in change matching
					forEach( parentChangeSet.added, function(dad) {
						var pk = dad.prev && dad.prev.kids[myUid];
						
						// insert in the same place locally as in parent, though it doesn't really matter.
						prev = pk && pk.length && pk[pk.length-1];
						
						forEach( this.dataItems( dad.data ), function( dataItem ) {
							adds.push(prev = addNode( this, dad, prev, dataItem ));
							
						}, this);
						
					}, this);
					
				}
	
				

				// CLEAN UP REMOVALS
				// finish processing all removals by destroying their graphics.
				forEach( rmvs, function(c) {
					removeNode(c);
				}, this);

			
				
				// ALSO ANY OF MY NODES MARKED INDEPENDENTLY AS CHANGED
				if (myChangeSet.rootSet.hasLayer(this)) {
					for (i = myChangeSet.rootSet.nodes(this); (c = i.next()) != null;) {
						// only add to list if showing (removals will not be showing either) and not already there
						// Add node to list of changes (if not already there)
						if( indexOf(chgs, c) === -1 && indexOf(adds, c) === -1 && updateVisibility(c) ) {
							chgs.push(c); // TODO: hash?
						}
					}
				}

				
				// FORM JOINED LIST OF UPDATED NODES
				// adds always propagate down, but not changes if they are not visible.
				// form the list here of everything that need drawing/redrawing.
				if (adds.length !== 0) {
					var draw = myChangeSet.updates = myChangeSet.changed.slice();
					
					// on construction we did not create graphics unless it was visible
					forEach(adds, function(c) {
						if (c.graphics !== NO_GRAPHICS) {
							draw.push(c);
						}
					}, this);
					
				} else {
					myChangeSet.updates = myChangeSet.changed;
					
				}
				
				
				// DEBUG - log all updates.
				if ( log.isLogging(log.LEVEL.DEBUG ) ) {
					var alist = ' + ', clist = ' * ', rlist= ' - ';
					
					forEach(myChangeSet.added, function(c){
						alist+= c.uid + ', ';
					});
					forEach(myChangeSet.changed, function(c){
						clist+= c.uid + ', ';
					});
					forEach(myChangeSet.removed, function(c){
						rlist+= c.uid + ', ';
					});
					
					log.debug('>> ' + this.typeOf());
					log.debug(alist);
					log.debug(clist);
					log.debug(rlist);
				}

				// Done processing changes, reset hints
				this.dataChangeHints = null;
				
				return myChangeSet;
			},
			

			/**
			 * Brings this layer to the front of its parent layer.
			 * 
			 * @returns {this}
			 *      this layer
			 */
			toFront : function () {
				if (this.parentLayer_) {
					var p = this.parentLayer_.layers_,
						i = indexOf(p, this),
						c;
					if (i !== p.length-1) {
						p.push(p.splice(i, 1)[0]);
						
						for (c = this.nodes_; c != null; c = c.next) {
							c.graphics.toFront();
						}
					}
				}
				return this;
			},
			
			/**
			 * Pushes this layer to the back of its parent layer.
			 * 
			 * @returns {this}
			 *      this layer
			 */
			toBack : function () {
				if (this.parentLayer_) {
					var p = this.parentLayer_.layers_,
						i = indexOf(p, this), 
						c;
					if (i !== 0) {
						p.splice(0,0,p.splice(i, 1)[0]);
						
						for (c = this.nodes_; c != null; c = c.next) {
							c.graphics.toBack();
						}
					}
				}
				return this;
			},
			
			/**
			 * ${protected}
			 * The render function is called by the default implementation of a parent layer render()
			 * should be implemented to actually perform this layer's render logic.
			 * The changeSet object will contain Node objects that pertain to this
			 * layer's data.
			 *
			 * If this layer is responsible for drawing visual items, this function should
			 * update all visuals as described by the adds, changes, and removes in the
			 * changeSet object.  The Node objects provided in the changeSet object are owned
			 * by this layer and not shared with any other layer.  This layer is free to
			 * modify the Node.userData object and store any data-visual specific
			 * objects.  The same Node object will be maintained through all calls
			 * to render thoughout the life of the associated data object.
			 *
			 * @param {Object} changeSet
			 * @param {Array} changeSet.updates a list of visible Nodes that are added or changed.
			 * this is the list that a graphic child should redraw.
			 * @param {Array} changeSet.added a list of new Node objects pertaining to added data
			 * @param {Array} changeSet.changed a list of visible Node objects pertaining to changed data
			 * @param {Array} changeSet.removed a list of Nodes that should be removed due to the
			 * removal of the corresponding data
			 */
			render : function( changeSet ) {
			},

			/**
			 * Registers a callback function for a given event type on the visuals
			 * drawn by this layer.  Valid event types include DOM mouse events plus some
			 * custom events:
			 * <ul>
			 * <li>click</li>
			 * <li>dblclick</li>
			 * <li>mousedown</li>
			 * <li>mousemove</li>
			 * <li>mouseout</li>
			 * <li>mouseover</li>
			 * <li>mouseup</li>
			 * <li>touchstart</li>
			 * <li>touchmove</li>
			 * <li>touchend</li>
			 * <li>touchcancel</li>
			 * <li>drag</li>
			 * <li>dragstart*</li>
			 * <li>dragend*</li>
			 * </ul>
			 *
			 * Returning a truthy value from a callback indicates that the event is consumed
			 * and should not be propogated further.<br><br>
			 * 
			 * *Note that registration for <code>drag</code> events will result in the drag
			 * handler being called for drag, dragstart, and dragend events, distinguishable
			 * by the eventType property of the Event object. Attempts to register for dragstart and
			 * dragend events individually will have no effect.
			 * 
			 * @param {String} eventType
			 *      the DOM event name corresponding to the event type for which this callback
			 *      will be registered
			 * @param {Function} callback
			 *      the callback function that will be called when this event is triggered.
			 *      The callback function will be called in the this-node of this layer.
			 *      The function will be passed an object of type {@link aperture.Layer.Event}
			 */
			on : function( eventType, callback ) {
				var h = this.handlers_, c;
				
				if (!h[eventType]) {
					h[eventType] = [callback];
					
					// need one hook only for all clients
					for (c = this.nodes_; c != null; c = c.next) {
						c.graphics.on(eventType, this);
					}
					
				} else {
					h[eventType].push(callback);
				}
			},

			/**
			 * Removes a registered callback(s) for the given event type.
			 *
			 * @param {String} eventType
			 *      the DOM event name corresponding to the event type to unregister
			 * @param {Function} [callback]
			 *      an optional callback function.  If given this specific callback
			 *      is removed from the event listeners on this layer.  If omitted,
			 *      all callbacks for this eventType are removed.
			 */
			off : function( eventType, callback ) {
				var h = this.handlers_, c;
				
				if( callback ) {
					h[eventType] = util.without( h[eventType], callback );
				} else {
					h[eventType] = [];
				}
				
				// all handlers gone for this? then remove hook.
				if (h[eventType].length === 0) {
					for (c = this.nodes_; c != null; c = c.next) {
						c.graphics.off(eventType, this);
					}
					
					h[eventType] = null;
				}
			},

			/**
			 * Fires the specified event to all handlers for the given event type.
			 *
			 * @param {String} eventType
			 *      the DOM event name corresponding to the event type to fire
			 * @param {aperture.Layer.Event} event
			 *      the event object that will be broadcast to all listeners
			 */
			trigger : function( eventType, e ) {
				var r = util.forEachUntil( this.handlers_[eventType], function( listener ) {
					return listener.call(this, e);
				}, true, this);
				
				if (r && e && e.source) {
					e = e.source;
					
					if (e.stopPropagation) {
						e.stopPropagation();
					} else {
						e.cancelBubble = true;
					}
				}

				return r;
			},

			/**
			 * Returns the parent (if it exists) of this layer.
			 */
			parent : function() {
				return this.parentLayer_;
			},


			/**
			 * Returns the containing vizlet for this layer.
			 */
			vizlet : function() {
				return this.vizlet_;
			}
			
		}
	);

	// expose item
	namespace.Layer = Layer;



	var PlotLayer = Layer.extend( 'aperture.PlotLayer',
	/** @lends aperture.PlotLayer# */
	{
		/**
		 * @class An extension of layer, Plot layers can contain child layers.
		 * @augments aperture.Layer
		 *
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);

			/**
			 * @private
			 * An array of child layer objects
			 */
			this.layers_ = [];

		},

		/**
		 * Creates and adds a child layer of the specified type.
		 * Child layers will inherit all mappings and data from their parent layer.
		 *
		 * @example
		 * plot.addLayer( aperture.LabelLayer, {
		 *      font-family: 'Segoe UI',
		 *      fill: 'white'
		 * });
		 *
		 * @param {aperture.Layer} layer
		 *      The type of layer to construct and add.
		 *
		 * @param {Object} [mappings]
		 *      Optional initial simple property : value mappings. More advanced
		 *      mappings can be defined post-construction using the {@link #map}
		 *      function.
		 *
		 * @param {Object} [spec]
		 *      An optional object containing specifications to pass to the layer constructor.
		 *      This specification will be extended with parent and canvas information.
		 *
		 * @returns {aperture.Layer}
		 *      the created child layer
		 */
		addLayer : function( layerCtor, mappings, spec ) {

			spec = spec || {};

			util.extend( spec, {
					parent : this,
					vizlet : this.vizlet_,
					rootNode : this.rootNode_,
					parentCanvas : this.canvas_
				}, this.layerSpec_ );

			var layer = new layerCtor(spec, mappings);

			// Add to layer list
			this.layers_.push( layer );

			return layer;
		},

		/**
		 * ${protected}
		 * 
		 * Overrides the base Layer implementation of render to draw children.
		 */
		render : function( changeSet ) {
			
			if ( log.isLogging(log.LEVEL.DEBUG ) ) {
				log.indent(4);
			}
			
			// invoke draw of all child layers after building a change set for each.
			forEach( this.layers_, function (layer) {
				this.renderChild( layer, layer.processChangeSet(changeSet) );
				
			}, this);

			if ( log.isLogging(log.LEVEL.DEBUG ) ) {
				log.indent(-4);
			}
			
		},

		/**
		 * ${protected}
		 * 
		 * Overridden to remove and clean up child layers.
		 */
		remove : function( ) {
			if (this.parentLayer_) {
				aperture.Layer.prototype.remove.call(this);
				
				// destroye all sublayers
				forEach( this.layers_, function (layer) {
					layer.remove();
				});
				
				this.layers_ = [];
			}

			return this;
		},

		/**
		 * ${protected}
		 * Subclasses of PlotLayer may override this function and update the provided
		 * Node objects that are bound for the given child layer before
		 * rendering it.
		 * For example, a plot layer that alters the size of the canvases
		 * that its children should render to can update the node position and
		 * width/height fields in the provided nodes before they are passed
		 * down to the child layer.
		 *
		 * Note that this is called for each child layer.  If all child layers should
		 * get the same modifications to their render nodes, changes can be made
		 * once to this layer's nodes in render.  These changes will be applied
		 * before the call to this function.
		 * 
		 * @param {aperture.Layer} layer
		 *      The child layer that for which this set of nodes is bound
		 * @param {Object} changeSet
		 *      The changeSet object destined for the given layer
		 * @param {Array} changeSet.updates 
		 *      a list of visible Nodes that are added or changed.
		 *      this is the list that a graphic child should redraw.
		 * @param {Array} changeSet.added
		 *      a list of new Node objects pertaining to added data
		 * @param {Array} changeSet.changed
		 *      a list of visible Node objects pertaining to changed data
		 * @param {Array} changeSet.removed
		 *      a list of Nodes that should be removed due to the
		 *      removal of the corresponding data
		 *
		 */
		renderChild : function( layer, changeSet ) {
			layer.render( changeSet );
		}
		
	});

	namespace.PlotLayer = PlotLayer;
	
	/* ******************************************************************************* */

	/**
	 * @name aperture.Layer.Node
	 * @class A Node object contains information and methods that layer implementations
	 * can use to obtain the constructs they need to render their content.  For example, the node
	 * provides a vector graphics interface which child layers may use to create and manage their
	 * visual representations.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#data
	 * @type Object
	 * @description the data item that to which this node pertains.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#parent
	 * @type aperture.Layer.Node
	 * @description an explicit reference to the parent render node for this node, if it
	 * exists.  Generally a node will inherit all properties of its parent but it is occasionally
	 * useful to be able to access the unadulterated values such as position.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#userData
	 * @type Object
	 * @description an object that can be freely used by the rendering layer to store
	 * information.  Since the same node object will be given to the layer on subsequent
	 * renders of the same data item the layer can store information that allows rendering to
	 * be more efficient, for example visual objects that are created and can be reused.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#width
	 * @type Number
	 * @description The width of the canvas in pixels.  If the child layer does not have a mapping
	 * that specifies the render width of its visuals, the canvas size should be used.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#height
	 * @type Number
	 * @description The height of the canvas in pixels.  If the child layer does not have a mapping
	 * that specifies the render width of its visuals, the canvas size should be used.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#position
	 * @type Array
	 * @description The [x,y] position in pixels within the canvas that the child visual should
	 * draw itself.  Typically top-level visuals will be positioned at [0,0] and will be expected
	 * to fill the entire canvas (as dictated by width/height).  Otherwise, child visuals should
	 * translate the local-coordinate point specified by {@link #anchorPoint} to this position
	 * within the canvas.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#anchorPoint
	 * @type Array
	 * @description The anchor point is an [x,y] position in [0,1] space that specifies how the child
	 * layer should draw its visuals with respect to the provided canvas {@link #position}.  The x-anchor
	 * point is in the range [0,1] where 0 represents an anchor on the left edge of the visual and 1
	 * represents an anchor on the right edge.  The y-anchor point is also in the range [0,1] where
	 * 0 represents an anchor on the top edge and 1 represents an anchor on the bottom edge.  [0.5, 0.5]
	 * would mean the child visual is centered on the provided canvas {@link #position}.
	 * 
	 * ${protected}
	 */

	/**
	 * @name aperture.Layer.Node#graphics
	 * @type aperture.canvas.Graphics
	 * @description A graphics interface with which to create and update graphics, typically
	 * a {@link aperture.canvas.VectorGraphics VectorGraphics} object.
	 * 
	 * ${protected}
	 */

	/* ******************************************************************************* */

	/**
	 * @name aperture.Layer.Event
	 * @class An event object that is passed to handlers upon the trigger of a requested
	 * event.
	 */

	/**
	 * @name aperture.Layer.Event#eventType
	 * @type String
	 * @description the type of the event being triggered
	 */

	/**
	 * @name aperture.Layer.Event#source
	 * @type Object
	 * @description the source event
	 */

	/**
	 * @name aperture.Layer.Event#data
	 * @type Object
	 * @description the data object for the node that triggered the event
	 */

	/**
	 * @name aperture.Layer.Event#node
	 * @type aperture.Layer.NodeSet
	 * @description the node that triggered the event
	 */

	/**
	 * @name aperture.Layer.Event#index
	 * @type Array
	 * @description an optional property that contains the index into the data item
	 * in the case that the data item contains a sequence of values, such as a line
	 * series.  In the case of indexed values, this field will be an array
	 * of indicies in the order they are referred to in the mappings.  For example,
	 * ${a[].b[].c} will have two items in the index array.  Otherwise, undefined.
	 */

	/**
	 * @name aperture.Layer.Event#dx
	 * @type Number
	 * @description when dragging, the cumulative x offset, otherwise undefined.
	 */

	/**
	 * @name aperture.Layer.Event#dy
	 * @type Number
	 * @description when dragging, the cumulative y offset, otherwise undefined.
	 */


	return namespace;

}(aperture || {}));
