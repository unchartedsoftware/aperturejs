/**
 * Source: Raphael.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview A Raphael canvas implementation.
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture.canvas = (
/** @private */
function(namespace) {

	// nothing we can do in this case.
	if (!window.Raphael) {
		aperture.log.error('raphael.js must be included before aperture.');

		return;
	}
	
	var util = aperture.util;

//	function noop() {
//		aperture.log.warn('Clip and origin operations are not supported for the root Raphael canvas.');
//	}

	// this is here to overcome this problem:
	// http://stackoverflow.com/questions/7448468/why-cant-i-reliably-capture-a-mouseout-event
	var MouseOutTracker = aperture.Class.extend( '[private].MouseOutTracker', {
		
		// callback for all document move events. only listening when over / tracking something.
		mouseMoveCallback : function (e) {
			if (this.trackEvent) {
				var node = e.target;
				
				// climb the hierarchy and look here only for wander outside of our target scope.
				// outs within our target scope will be handled by the track call below
				while (node != null) {
					if (node === this.trackTarget) {
						return;
					}
					node = node.parentNode;
				}
				
				// if made it this far we are outside
				this.trigger(e);
				this.untrack();
			}
		},
		
		// tracks an event
		track : function (e, client) {
			var tracking = false;
			var sourceEvent = e.source;
			
			// already tracking?
			if (this.trackEvent) {
				tracking = true;

				// switching targets?
				// browser will fire mouse outs for all child outs (unfortunately) even if currentTarget is the same, so replicate.
				if (this.trackEvent.source.target !== sourceEvent.target) {
					this.trigger(sourceEvent);
				}
			}
				
			this.trackEvent = e;
			this.trackTarget = sourceEvent.currentTarget;
			this.client = client;
			
			// looking at raphael tells us that this tracks at the document level if not called on a raphael el.
			// args are the 'element', the callback function, and the context to be 'this' in the callback
			if (!tracking) {
				Raphael.el.mousemove.call(this, this.mouseMoveCallback, this);
			}
		},

		// stop tracking
		untrack : function () {
			if (this.trackEvent) {
				this.trackEvent = null;
				this.trackTarget = null;
				this.client = null;
				
				Raphael.el.unmousemove.call(this, this.mouseMoveCallback);
			}
		},
		
		// trigger mouse out
		trigger : function(curEvent) {
			
			// extend old event with updated properties without changing the original event.
			var e = util.viewOf(this.trackEvent);
			
			e.source = util.viewOf(e.source);
			
			//  update with cur position
			e.source.clientX = curEvent.clientX;
			e.source.clientY = curEvent.clientY;
			e.source.screenX = curEvent.screenX;
			e.source.screenY = curEvent.screenY;

			if (curEvent.pageX != null) {
				e.source.pageX = curEvent.pageX;
				e.source.pageY = curEvent.pageY;
			}
			
			if (curEvent.offsetX != null) {
				e.source.offsetX = curEvent.offsetX;
				e.source.offsetY = curEvent.offsetY;
			}
			
			this.client.trigger(e.eventType = "mouseout", e);
		}
		
	});
	
	// graphics class
	var cg = namespace.RaphaelGraphics = namespace.VectorGraphics.extend( 'aperture.canvas.RaphaelGraphics',
		{
			init : function( parent ) {
				this.canvas = parent;
				this.paper = parent.paper;
				this.animation = parent.animation;
				this.container = parent.paper.container();
				this.showing = true;
				this.events = {};
				
				if (parent.container) {
					parent.container.push(this.container);
					this.canvas = parent.canvas;
					this.parent = parent;
				}
			},

			path : function ( svg ) {
				var el = this.paper.path( svg );
				this.container.push(el);

				return el;
			},
			
			circle : function ( x, y, radius ) {
				var el = this.paper.circle( x, y, radius );
				this.container.push(el);

				return el;
			},

			rect : function ( x, y, width, height ) {
				var el = this.paper.rect( x, y, width, height );
				this.container.push(el);

				return el;
			},

			text : function ( x, y, text ) {
				var el = this.paper.text( x, y, text );
				el.attr('cursor', 'default'); // don't typically want the text cursor
				
				this.container.push(el);

				return el;
			},

			image : function ( src, x, y, width, height ) {
				var el = this.paper.image( src, x, y, width, height );
				this.container.push(el);

				return el;
			},

			clip : function( rect ) {
				this.container.clip( rect );
			},

			origin : function( x, y ) {
				this.container.origin( x, y );
			},

			display : function( show ) {
				if (this.showing !== show) {
					this.container.show( this.showing = show );
					return true;
				}
			},

			toFront : function( e ) {
				if (e) {
					e.toFront();
				} else {
					var me = this.container.node;
					me.parentNode.appendChild(me);
				}
	
				return this;
			},

			toBack : function( e ) {
				if (e) {
					e.toBack();
				} else {
					var me = this.container.node, pops = me.parentNode;
					if (!pops.firstChild.isEqualNode(me)) {
						pops.insertBefore(me, pops.firstChild);
					}	
				}

				return this;
			},

			remove : function( e ) {
				// remove self?
				if (arguments.length === 0) {
					if (this.mouseOutTracker != null) {
						this.mouseOutTracker.untrack();
					}
					
					this.container.remove();
					
					return this;
				}
				
				if ( e ) {
					var k = this.container.kids,
						i = util.indexOf(k, e);

					if (i >= 0) {
						k.splice(i, 1);
					}
					
					e.remove();
					
					return e;
				}
			},
			
			removeAll : function ( array ) {
				var i, n, k = this.container.kids;//, r= [];
				
				if ( array != null ) {
					
					for (i=array.length; i-->0;) {
						if ((n = util.indexOf(k, array[i])) >= 0) {
							//r.push(k[ia]);
							k.splice(n, 1);
						}
						array[i].remove();						
					}
					
					//return r;
					
				} else {
					for (i=0, n=k.length; i<n; ++i) {
						k[i].remove();
					}
					
					this.container.kids.length = 0;
					
					//return k;
				}
			},

			data : function(element, data, index) {
				var n = arguments.length;
				
				switch (n) {
				case 0:
					return this.dataObj;
					
				case 1:
					if (!element.raphael) {
						this.dataObj = element;
						return this;
					} 
					return element.data('data');
					
				default:
					element.data('data', {
						data : data,
						index: index
					});
					return this;
				}
			},
			
			dataFromEvent : function(e) {
				var elem = e.target = (e.srcElement || e.target) || document, myNode = this.container.node;
				
				if (elem) {
					var data;
					
					// look up node tree from target for raphael elem
					while ((!elem.raphael || !(data = this.paper.getById(elem.raphaelid).data('data')))) {
						if (elem == myNode) {
							break;
						}
						elem = elem.parentNode;
	
						// will never happen?
						if (elem == null) {
							return;
						}
					}
	
					return data || this.dataObj;
				}
			},
			
			on : function(eventType, notifier) {
				// already added.
				if (this.events[eventType] || !Raphael.el[eventType]) {
					return;
				}
				
				var that = this;

				// everything but drag (a special case)
				if (eventType !== 'drag') {
					Raphael.el[eventType].call(
						this.container,
						
						this.events[eventType] = function(e) {
							var data = that.dataFromEvent(e);
							
							if (data) {
								var theEvent = {
									data: data.data,
									node: new aperture.Layer.SingleNodeSet(that.dataObj),
									index: data.index? data.index.slice() : undefined, // clone
									eventType: eventType,
									source : e
								};

								// this is here to overcome this problem:
								// http://stackoverflow.com/questions/7448468/why-cant-i-reliably-capture-a-mouseout-event
								switch (eventType) {
								case 'mouseover':
								case 'mousemove':
									if (this.mouseOutTracker == null) {
										this.mouseOutTracker = new MouseOutTracker();
									}
									this.mouseOutTracker.track(theEvent, notifier);
									break;
									
								case 'mouseout':
									if (this.mouseOutTracker != null) {
										this.mouseOutTracker.untrack();
									}
								}
								
								notifier.trigger(eventType, theEvent);
							}
						}
					);
					
				} else {
					var data;
					
					Raphael.el.drag.call(
						this.container,
						
						function(dx,dy,x,y,e) {
							if (data) {
								notifier.trigger('drag', {
									data: data.data,
									node: new aperture.Layer.SingleNodeSet(that.dataObj),
									index: data.index? data.index.slice() : undefined, // clone
									eventType: 'drag', // ***
									source : e,
									dx: dx,
									dy: dy,
									x : x,
									y : y
								});
							}
						},
						function(x,y,e) {
							data= that.dataFromEvent(e);
							
							if (data) {
								notifier.trigger('drag', {
									data: data.data,
									node: new aperture.Layer.SingleNodeSet(that.dataObj),
									index: data.index? data.index.slice() : undefined, // clone
									eventType: 'dragstart', // ***
									source : e,
									x : x,
									y : y
								});
							}
						},
						function(e) {
							if (data) {
								notifier.trigger('drag', {
									data: data.data,
									node: new aperture.Layer.SingleNodeSet(that.dataObj),
									index: data.index? data.index.slice() : undefined, // clone
									eventType: 'dragend', // ***
									source : e
								});
							}
						}
					);
				}
			},
			
			off : function(eventType) {
				if (eventType === 'drag') {
					Raphael.el.undrag.call(this.container);
					
				} else {
					var fn = Raphael.el['un'+ eventType], cb = events[eventType];
					
					if (fn && cb) {
						fn.call(this.container, cb);
					}
				}
			},
			
			apparate : function(element, transition) {
				if (transition) {
					var op = element.attr('opacity');

					// fade in
					element.attr('opacity', 0);
					this.attr(element, {'opacity': op}, transition);
				}
			},

			attr : function(element, attrs, transition) {
				// Getter
				if (util.isString(attrs)) {
					return element.attr(attrs);
				}

				// Setter
				if (!transition) {
					element.attr(attrs);

				} else {

					// filter. note this is a cheap method of trying to weed down what has
					// actually changed.
					var aset = {}, sset = {}, hasa, hass, attr, nv, cv;
					for (attr in attrs) {
						if (attrs.hasOwnProperty(attr)) {
							cv = element.attr(attr);
							nv = attrs[attr];
							
							// transform and path are returned from raphael as arrays, so need to convert to compare
							if (cv != null && !cv.toFixed) {
								cv = cv.toString();
							}
							// new values can only be numbers or strings, so do the conversion here for comparison.
							if (nv != null && !nv.toFixed) {
								nv = nv.toString();
							}
							if (cv !== nv) {
								// can't animate strings except for these.
								if (cv && cv.charCodeAt) {
									switch(attr) {
									case 'clip-rect':
									case 'fill':
									case 'stroke':
									case 'path':
									case 'transform':
										break;
									default:
										cv = null;
									}
								}
								
								if (cv) {
									hasa = true;
									aset[attr] = nv;
								} else {
									hass = true;
									sset[attr] = nv;
								}
							}
						}
					}

					if (hass) {
						element.attr(sset);
					}
					
					if (hasa) {
						var dummy = this.animation.anim;
	
						// create sync element?
						if (!dummy) {
	
							// this is unfortunate but otherwise we risk the tracked element being removed
							dummy = this.animation.anim = {element: this.paper.rect(-9999, -9999, 1, 1)};
							dummy.animation = Raphael.animation({width:2},
									transition.milliseconds(),
									transition.easing(),
	
									function() {
										dummy.element.remove();
	
										// one callback is enough
										if (transition.callback()) {
											transition.callback()();
										}
								});
	
							// this dummy animation serves no purpose other than to be a
							// reference for syncing other elements, due to the way Raphael works.
							dummy.element.animate(dummy.animation);
	
						}
	
						// link with dummy.
						element.animateWith(
							dummy.element,
							dummy.animation,
							aset,
							transition.milliseconds(),
							transition.easing()
							);
					}
				}
			}
		}
	);

	namespace.RaphaelCanvas = namespace.VectorCanvas.extend( 'aperture.canvas.RaphaelCanvas',
		{
			init : function( root ) {
				namespace.VectorCanvas.prototype.init.call(this, root);
				this.paper = Raphael( root, '100%', '100%' );
				this.animation = {};
			},

			remove : function() {
				return this.paper.remove();
			},

			graphics : function( parent ) {
				if (! parent || ! parent.typeOf(namespace.RaphaelGraphics) ) {
					return new cg( this );
				}

				return new cg( parent );
			},

			// signals the end of a frame
			flush : function() {
				this.animation.anim = null;

				// recurse if necessary.
				namespace.VectorCanvas.prototype.flush.call(this);
			}

		}
	);


	namespace.handle( namespace.VECTOR_CANVAS, namespace.RaphaelCanvas );


	// RAPHAEL.JS SUPPORT FOR STANDARD EASINGS

	// these are not actually the same, but similar.
	Raphael.easing_formulas['ease'] = Raphael.easing_formulas['ease-in-out'];

	// CSS3:
	//The ease function is equivalent to cubic-bezier(0.25, 0.1, 0.25, 1.0).
	//The linear function is equivalent to cubic-bezier(0.0, 0.0, 1.0, 1.0).
	//The ease-in function is equivalent to cubic-bezier(0.42, 0, 1.0, 1.0).
	//The ease-out function is equivalent to cubic-bezier(0, 0, 0.58, 1.0).
	//The ease-in-out function is equivalent to cubic-bezier(0.42, 0, 0.58, 1.0)

	// RAPHAEL.JS EXTENSION FOR CONTAINER SUPPORT

	// utility remove function
	function removeThis( nodeField ) {
		var n = this[nodeField];

		if (n && n.parentNode) {
			n.parentNode.removeChild( n );
		}
		if (this.hasOwnProperty(nodeField)) {
			delete this[nodeField];
		}
	}


	var origin, clip, elem, R = Raphael;


	// VML?
	if (R.vml) {

		// element factory
		elem = function() {
			var el = document.createElement('div');
			el.style.position = 'absolute';
			el.style.left = el.style.top = '0';

			return el;
		};

		// public origin fn
		origin = function ( x, y ) {
			var css = this.node.style;

			css.left = x + 'px';
			css.top = y + 'px';

			return this;
		};

		// public clip fn
		clip = function ( rect ) {
			var css = this.node.style;

			if (rect && rect.length == 4) {

				css.clip = 'rect('
					+ rect[1] + 'px '
					+(rect[0] + rect[2]) + 'px '
					+(rect[1] + rect[3]) + 'px '
					+ rect[0] + 'px)';

			} else if (css.clip) {

				css.clip = '';
			}

			return this;
		};

	// else SVG
	} else {

		// element factory
		elem = function ( el ) {
			el = document.createElementNS("http://www.w3.org/2000/svg", el);
			return el;
		};

		// public origin fn
		origin = function( x, y ) {
			this.node.setAttribute('transform', 'translate(' + x + ', ' + y + ')');

			return this;
		};

		// public clip fn
		clip = function ( rect ) {

			// remove existing clip path
			removeThis.call(this, 'clipNode');

			var ref = '';

			// create?
			if (rect && rect.length == 4) {

				// new clip path
				var el = this.clipNode = elem('clipPath'),
					rc = elem('rect');

				rc.setAttribute('x', String(rect[0]));
				rc.setAttribute('y', String(rect[1]));
				rc.setAttribute('width', String(rect[2]));
				rc.setAttribute('height', String(rect[3]));

				// give it an id to reference below
				el.id = R.createUUID();
				el.appendChild(rc);

				this.paper.defs.appendChild(el);

				ref= 'url(#' + el.id + ')';
			}

			this.node.setAttribute('clip-path', ref);

			return this;
		};

	}

	// note this addition method for containers reparents the node but has no
	// choice but to leave the graphic where it is in the paper's private linked list
	// until removed. this seems to be relatively free of negative impact.
	function push( child ) {

		var i = 0, n;
		// recurse for sets
		if ( child.type === 'set' ) {
			for ( n = child.length; i < n; ++i ) {
				push.call( this, child[i] );
			}

		// at the leaf level, append
		} else {
			this.kids.push(child);
			this.node.appendChild( child.node );
		}

		return this;
	}


	// also expose the remove function (important)
	function remove() {
		removeThis.call(this, 'node');
		removeThis.call(this, 'clipNode');
		
		var i= 0, n, k= this.kids;
		
		for ( n = k.length; i < n; ++i ) {
			k[i].remove();
		}
		
		this.kids.length = 0;
	}

	// show / hide
	function show( b ) {
		this.node.style.display = b? '' : 'none';

		return this;
	}

	/**
	 * add the container to the function set, for use as paper.container().
	 * @private
	 */
	R.fn.container = function() {

		var node = elem( 'g' );

		// Ensure vector containers are clickable
		// Some vizlets disable pointer events on top-level SVG to allow click-through
		node.style.pointerEvents = 'auto';
		
		// The container MUST have a UNIQUE ID, otherwise the
		// mouse events will not be triggered properly.
		// (e.g. if id=undefined, ALL drag move listeners will
		// be fired instead of the listener associated with
		// the source element)
		var uid = R.createUUID();
//		node.raphael = true;
//		node.raphaelid = uid;

		// add to vml canvas
		this.canvas.appendChild( node );

		return {
			id : uid,
			node : node,
			paper : this,
			type : 'container',
			push : push,
			kids : [],
			show : show,
			remove : remove,
			origin : origin,
			clip : clip,
			// should maybe look at using the element as a prototype?
			mousedown : R.el.mousedown // this is here for raphael's dragging to work I believe?
		};
	};

	return namespace;

}(aperture.canvas || {}));

