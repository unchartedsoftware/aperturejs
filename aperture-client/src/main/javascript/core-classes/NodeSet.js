/**
 * Source: NodeSet.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Node Sets refer to sets or subsets of layer nodes.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// default id function
	function getId() {
		return this.id;
	}
	
	
	var util = aperture.util,
		isArray = util.isArray,
		isString = util.isString,
		isFunction = util.isFunction,
		forEach = util.forEach,
		NO_GRAPHICS = aperture.canvas.NO_GRAPHICS,
		NEVER = function() {
			return false;
		},
		NO_ITER = {next: function() {
		}};
		
		

		// iterator options returned by node set below.
		var LogicalAllIter = aperture.Class.extend('[private].LogicalAllIter', {
			
			init : function(first) {
				this._cur = {next: first};
			},
			next : function() {
				var c = this._cur;
				return c && (this._cur = c.next);
			}
			
		}), LogicalMatchIter = aperture.Class.extend('[private].LogicalMatchIter', {
			
			init : function(nodeSet, cache) {
				this._nodeSet = nodeSet;
				this._where = nodeSet._where;
				this._cur = {next: nodeSet._layer.nodes_};
				this._cache = cache? [] : null;
			},			
			next : function() {
				var h = this._cur;
				
				if (h) {
					var where = this._where,
						cache = this._cache;
					
					// find the next valid node.
					while ((h = h.next) && !where.call(h.data));

					if (cache) {
						if (h) {
							cache.push(h);
						}
						
						// if reached the last, cache the filtered set IN NODE SET for next iter.
						if (!h || !h.next) {
							this._nodeSet._cache = this._nodeSet._cache || cache;
							cache = null;
						}
					}
					
					return this._cur = h;
				}
			}
			
		}), ArrayIter = aperture.Class.extend('[private].ArrayIter', {
			
			init : function(array) {
				this._array = array;
				this._ix = 0;
			},
			next : function() {
				var a = this._array;

				if (a) {
					var i = this._ix, c = a[i++];

					// if reached the end, clear ref
					if ((this._ix = i) === a.length) {
						this._array = null;
					}
					
					return c;
				}
			}
			
		}), SingleIter = aperture.Class.extend('[private].SingleIter', {
			
			init : function(node) {
				this._cur = node;
			},
			next : function() {
				var n = this._cur;
				if (n) {
					this._cur = null;
					return n;
				}
			}
			
		}), MultiSetIter = aperture.Class.extend('[private].MultiSetIter', {
			
			init : function(sets, layer) {
				this._sets = sets;
				this._ix = 0;
				this._layer = layer;
				this._cur = sets[0].nodes(layer);
			},
			next : function() {
				var c = this._cur;
				
				if (c) {
					var n = c.next(), s;
					while (!n) {
						if ((s = this._sets[this._ix+=1]) == null) {
							break;
						}
						
						this._cur = c= s.nodes(this._layer);
						n = c.next();
					}
					return n;
				}
			}
			
		}), DataIter = aperture.Class.extend('[private].DataIter', {
			
			init : function(nodeIter) {
				this._nodes = nodeIter;
				this._cur = nodeIter.next();
			},
			next : function() {
				var c = this._cur;
				
				if (c) {
					this._cur = this._nodes.next();
					return c.data;
				}
			}
		
		}), MultiSet;
		
		
	function toFrontOrBack( planes, planeProperty, gfxFn ) {
			
		var layer = this._layer;
		
		if( !layer.hasLocalData ) { // will have no effect if no local data.
			return;
		}
		
		var c, i, j, n, p = planeProperty || 'plane';

		// if a sort function, do a heavyweight sort.
		if (util.isFunction(planes)) {
			
			var a = [];
			
			for (i = this.nodes(); (c = i.next()) != null;) {
				a.push({
					key: layer.valueFor(p, c.data, null),
					gfx: c.graphics
				});
			}

			a.sort(function(a, b) {
				return planes(a.key, b.key);
			});

			n = a.length;
			
			for (j = 0; j< n; ++j) {
				a[j].gfx[gfxFn]();
			}

		// else if anything, assume a set of planes and pull those to front in order.
		} else if (planes) {
			if (!util.isArray(planes)) {
				planes = [planes];
			}

			n = planes.length;
			
			for (j = 0; j< n; ++j) {
				for (i = this.nodes(); (c = i.next()) != null;) {
					if (c.graphics !== NO_GRAPHICS && planes[j] === layer.valueFor(p, c.data, null)) {
						c.graphics[gfxFn]();
					}
				}
			};

		// else simply order by node order.
		} else {
			for (i = this.nodes(); (c = i.next()) != null;) {
				c.graphics[gfxFn]();
			}
		}

		return this;
	}

	aperture.Layer.NodeSet = aperture.Class.extend( 'aperture.Layer.NodeSet',
	/** @lends aperture.Layer.NodeSet# */
	{
		/**
		 * @class Represents a set or subset of layer nodes, defined through subsequent
		 * calls to selector methods. NodeSet is abstract. A new node set is retrieved with a call
		 * to layer.nodes(), or is retrieved from an event.
		 * 
		 * @param {aperture.Layer} layer
		 *   the associated layer.
		 *   
		 * @constructs
		 * @factoryMade
		 * @extends aperture.Class
		 */
		init : function( layer ) {
			this._layer = layer;
			this._vizlets = [layer.vizlet()];
		},

		/**
		 * Applies a selection criteria on this node set where node data must pass a conditional test.
		 * 
		 * @param {Function|String} [test]
		 *   A test to be executed for each node's data. If a function is supplied it will be called 
		 *   for each node with this = data and the return value will be evaluated according to the
		 *   match criteria. If a string value is supplied the value of that data field name will be
		 *   evaluated instead. The test parameter may be excluded if the match parameter provides
		 *   a set of data objects to match against.
		 *   
		 * @param {Array|Object} [match]
		 *   Optionally one or more matches to evaluate the results of the test against, or if the test
		 *   is omitted, one or more data objects to match against. If match is omitted the test will
		 *   pass if it returns any 'truthy' value.
		 *   
		 * @example
		 *   // redraw data nodes with id C4501
		 *   layer.all().where('id', 'C4501').redraw();
		 *   
		 *   // redraw data nodes with id C4501, C4502
		 *   layer.all().where('id', ['C4501', 'C4502']).redraw();
		 *   
		 *   // redraw data nodes data0, data1
		 *   layer.all().where([data0, data1]).redraw();
		 *   
		 *   // redraw nodes which pass a filter function
		 *   function big(data) {
		 *      return data.size > 100000000;
		 *   }
		 *   layer.all().where(big).redraw();
		 *   
		 * @returns {this}
		 *   this set
		 */
		where : function ( test, match ) {
			this.revalidate();
			
			// PROCESS TEST
			// string test arg? a field name.
			if (isString(test)) {
				var propName = test;
				test = propName === 'id'? getId : function() {
					return this[propName];
				};
						
			// no test arg? shift args.
			} else if (!isFunction(test)) {
				if (test) {
					match = test;
					test = null;
				} else {
	 				this._where = NEVER;
					return this;
				}
			}

			
			// PROCESS MATCH.
			// no match? basic truthy test
			if (!match) {
				this._where = test;
				return this;

			// set of matches? match test results
			} else if (isArray(match)) {
				switch (match.length) {
				
				// unless no matches: shortcut to never
				case 0:
					this._where = NEVER;
					return this;
					
				// unless 1 match: shortcut to single match test defined later.
				case 1:
					match = match[0];
					break;
					
				default:
					if (test) {
						this._where = function() {
							var i, n = match.length,
								id = test.call(this);
							
							for (i=0; i< n; ++i) {
								if (match[i] === id) {
									return true;
								}
							}
						};
					} else {
						this._where = function() {
							var i, n = match.length;
							
							for (i=0; i< n; ++i) {
								if (match[i] === this) {
									return true;
								}
							}
						};
					}
					return this;
				}
			}

			// single match test.
			if (test) {
				this._where = function() {
					return match === test.call(this);
				};
			} else {
				this._where = function() {
					return match === this;
				};
			}
			
			return this;
		},
		
		/**
		 * Unions this node set with another and returns the result.
		 * 
		 * @returns {aperture.Layer.NodeSet} 
		 *   the union set of nodes
		 */
		and : function ( nodeSet ) {
			// TODO: hash it if haven't already, to exclude duplicates?
			return new MultiSet( [this, nodeSet] );
		},
		
//		/**
//		 * Returns the explicit set of parent nodes as a new set.
//		 * 
//		 * @returns {aperture.Layer.NodeSet} 
//		 *   the set of parent nodes
//		 */
//		parents : function ( ) {
//		},
		
		/**
		 * Returns true if the specified layer is included in this node set.
		 * 
		 * @returns {Boolean}
		 *   true if has this layer
		 */
		hasLayer : function ( layer ) {
			return layer === this._layer;
		},

		/**
		 * Returns a new data iterator for this node set. The iterator will be a simple object with
		 * a next() method that will return data for the next node in the set until there are no more to return.
		 * 
		 * @example
		 * var data,
		 *     iter = layer.all().data();
		 * 
		 * for (data = iter.next(); data != null; data = iter.next()) {
		 * 
		 * @returns {Object}
		 *   iterator object with method next()
		 */
		data : function( ) {
			return new DataIter( this.nodes() );
		},
		
		/**
		 * TODO
		 */
		inside : function( left, top, right, bottom ) {
			//this.revalidate();
		},
		
		/**
		 * Brings layer nodes successively to the front of their parent node(s), 
		 * using lighter or heavier weight techniques as desired. 
		 * Ordering at the layer level rather than in data is typically used for state 
		 * based changes like popping selected nodes to the top. Note that ordering nodes of a layer that 
		 * inherits its data from a parent layer has no effect, since there will be only one
		 * layer node per parent node.<br><br>
		 * 
		 * Usage examples:
		 *
		 * @example
		 * // bring any layer node with a 'plane' value of 'selected' to the front,
		 * // leaving others as they are.
		 * nodes.toFront( 'selected' );
		 *
		 * // bring any layer node with a 'selected' value of true to the front,
		 * // leaving unselected as they are.
		 * nodes.toFront( true, 'selected' );
		 *
		 * // all in a set to front by data order
		 * nodes.toFront( );
		 *
		 * // bring all 'unfiltered's to front, then all 'selected's above those
		 * nodes.toFront( ['unfiltered', 'selected'] );
		 *
		 * // call a sort function on the 'z-index' property value of layer nodes
		 * nodes.toFront( function(a,b) {return a-b;}, 'z-index' );
		 *
		 * @param {Array|Object|Function} [planes]
		 *      an array specifying a set of planes to
		 *      bring forward (in back to front order); or one such plane; or a function
		 *      to sort based on plane value. If planes is omitted all nodes are assumed
		 *      to be in the same plane and are sorted in the order in which they appear
		 *      in the data. See the examples for more information.
		 *
		 * @param {String} [planeProperty]
		 *      optionally, the name of the property that supplies the plane value for
		 *      layer nodes. If omitted it is assumed to be 'plane'.
		 *
		 * @returns {this}
		 *   this set
		 */
		toFront : function ( planes, planeProperty ) {
			return toFrontOrBack.call(this, planes, planeProperty, 'toFront');
		},

		/**
		 * Sends layer nodes successively to the back of their parent node(s), 
		 * using the same instruction api as {@link #toFront}.
		 */
		toBack : function ( planes, planeProperty ) {
			return toFrontOrBack.call(this, planes, planeProperty, 'toBack');
		},
		
		/**
		 * TODO
		 */
		layout : function( ) {
			
		},
		
		/**
		 * Removes the data within this set from the host layer. This provides a 
		 * mechanism to remove data from a layer without needing to reset all of the
		 * layer's data via a call to {@link aperture.Layer#all}.
		 *
		 * @returns {this}
		 *    this set after removing it from the host layer
		 */
		remove : function( ) {
			this._layer.removeNodeSet(this);
			return this;
		},
		
		/**
		 * Invokes a visual layer update of the node set.
		 * 
		 * @param {aperture.Transition} [transition]
		 *   an optional animated transition to use to phase in the changes.
		 *
		 * @returns {this}
		 *   this set
		 */
		redraw : function ( transition ) {
			this._vizlets[0].redraw(this, transition);
			
			return this;
		},
		
		/**
		 * @private
		 * returns a private vizlet nodes for use in redraw
		 */
		vizlets : function() {
			return this._vizlets;
		},
		
		/**
		 * ${protected}
		 * Returns a new iterator for this node set, for all layers or the optionally specified layer.
		 * Returns null if the specified layer is not included. The iterator will be a simple object with
		 * a next() method that will return the next node in the set until there are no more to return.
		 * This method returns direct access to the nodes and is for framework use only.
		 * 
		 * @param {aperture.Layer} [layer]
		 *   optionally the layer to create an iterator for, relevant if a joined aggregate node set.
		 */
		nodes : function( layer ) {
		},

		/**
		 * ${protected}
		 * If this is a logical node set, invalidate any cacheing.
		 * 
		 * @returns {this}
		 *   this set
		 */
		revalidate : function() {
			if (this._cache) {
				this._cache = null;
			}
		}
		
	});

	
	
	var SnS = aperture.Layer.SingleNodeSet = aperture.Layer.NodeSet.extend( 'aperture.Layer.SingleNodeSet',
	/** @lends aperture.Layer.SingleNodeSet# */
	{
		/**
		 * ${protected}
		 * @class Represents a single constant node as a set.
		 * 
		 * @param {aperture.Layer.Node} node
		 *   
		 * @constructs
		 * @extends aperture.Layer.NodeSet
		 */
		init : function( node ) {
			aperture.Layer.NodeSet.prototype.init.call( this, node? node.layer : null );
			
			/**
			 * @private
			 */
			this._node = node;
		},
	
		/**
		 * @private
		 * override
		 */
//		parents : function ( ) {
//			var n = this._node;
//			
//			if (n && n.parent) {
//				return new SnS( n.parent );
//			}
//		},
		
		/**
		 * @private
		 * override
		 */
		nodes : function( layer ) {
			var where = this._where,
				node = this._node;
			
			return !node || !node.layer || (layer && layer !== this._layer) || (where && !where.call(node.data))? NO_ITER : 
				new SingleIter(node);
		}
		
	});

	
	aperture.Layer.LogicalNodeSet = aperture.Layer.NodeSet.extend( 'aperture.Layer.LogicalNodeSet',
	/** @lends aperture.Layer.LogicalNodeSet# */
	{
		/**
		 * ${protected}
		 * @class Represents a set defined logically but not evaluated until the point of iteration.
		 * 
		 * @param {aperture.Layer} layer
		 *   the associated layer.
		 *   
		 * @constructs
		 * @extends aperture.Layer.NodeSet
		 */
		init : function( layer ) {
			aperture.Layer.NodeSet.prototype.init.call( this, layer );
		},
		
		/**
		 * @private
		 * override
		 */
//		parents : function ( ) {
//			// TODO:
//		},
		
		/**
		 * @private
		 * override
		 */
		nodes : function( layer ) {
			if ((layer && layer !== this._layer) || this._where === NEVER) {
				return NO_ITER;
			}

			// if no filter, return everything.
			if (!this._where) {
				return new LogicalAllIter(this._layer.nodes_);
			}
			
			// cacheing filtered set.
			if (!this._cache) {
				return new LogicalMatchIter(this, true);
			}
			
			// iterate over cached.
			return new ArrayIter(this._cache);

		}

	});
	
	
	MultiSet = aperture.Layer.MultiSet = aperture.Layer.NodeSet.extend( 'aperture.Layer.MultiSet',
	/** @lends aperture.Layer.MultiSet# */
	{
		/**
		 * ${protected}
		 * @class Represents several sets as one.
		 * 
		 * @param {Array} sets
		 *   
		 * @constructs
		 * @extends aperture.Layer.NodeSet
		 */
		init : function(sets) {
			this._sets = sets;
			
			// populate vizlet list.
			var i, n = sets.length,
				j, v, setv, lenv, hash = {}, unique= this._vizlets = [];
			
			for (i=0; i<n; i++) {
				setv = sets[i].vizlets();
				lenv = setv.length;
				
				for (j=0; j<lenv; j++) {
					v = setv[j];
					if (!hash[v.uid]) {
						unique.push(hash[v.uid]= v);
					}
				}
			}
		},
	
		/**
		 * @private
		 * override
		 */
		nodes : function( layer ) {
			var i, sets = this._sets, n = sets.length, s, lsets;
			
			for (i=0; i<n; i++) {
				s = sets[i];

				if (!layer || s.hasLayer(layer)) {
					(lsets || (lsets= [])).push(s);
				}
			}
			
			return lsets? new MultiSetIter(lsets) : NO_ITER;
		},
		
		/**
		 * @private
		 * override
		 */
		hasLayer : function ( layer ) {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				if (sets[i].hasLayer(layer)) {
					return true;
				}
			}
			
			return false;
		},
		
		/**
		 * @private
		 * override
		 */
		where : NEVER,

		/**
		 * @private
		 * override
		 */
		remove : function () {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].remove();
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		toFront : function () {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].toFront.apply( sets[i], arguments );
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		toBack : function () {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].toBack.apply( sets[i], arguments );
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		redraw : function ( transition ) {
			var i, vizlets = this._vizlets, n = vizlets.length;
			
			for (i=0; i<n; i++) {
				vizlets[i].redraw(this, transition);
			}
			
			return this;
		},
		
		/**
		 * @private
		 * override
		 */
		revalidate : function() {
			var i, sets = this._sets, n = sets.length;
			
			for (i=0; i<n; i++) {
				sets[i].revalidate();
			}
		}
		
	});
	
			
	return namespace;

}(aperture || {}));
