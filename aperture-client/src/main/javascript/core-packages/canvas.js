/**
 * Source: Canvas.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The base canvas classes.
 */

/**
 * @namespace The canvas package, where rendering is abstracted and implemented for
 * various platforms.
 * 
 * ${protected}
 */
aperture.canvas = (
/** @private */
function(namespace) {

	var plugins = {};

	// leave private for now
	namespace.handle = function( typeName, ctor ) {
		plugins[typeName] = ctor;
	};
	namespace.type = function( typeName ) {
		return plugins[typeName];
	};

	/**
	 * A simple div canvas type.
	 * 
	 * ${protected}
	 *
	 * @name aperture.canvas.DIV_CANVAS
	 * @constant
	 */
	namespace.DIV_CANVAS = 'DIV_CANVAS';

	/**
	 * A vector canvas type.
	 * 
	 * ${protected}
	 *
	 * @name aperture.canvas.VECTOR_CANVAS
	 * @constant
	 */
	namespace.VECTOR_CANVAS = 'VECTOR_CANVAS';


	/**
	 * @class
	 * The abstraction of an Aperture canvas. An
	 * Aperture canvas abstracts the surface being rendered to, for platform extensibility.
	 * This class is not used directly by end clients. It is used by
	 * layer implementations and is provided here for reference only.
	 * 
	 * ${protected}
	 *
	 * @extends aperture.Class
	 *
	 * @description
	 * This class is abstract and is not to be instantiated directly.
	 *
	 * @name aperture.canvas.Canvas
	 */
	namespace.Canvas = aperture.Class.extend( 'aperture.canvas.Canvas',
		{
			init : function ( root ) {
				this.root_ = root;
				this.canvases_ = [];
//				this.clients = 0;
			},

			/**
			 * Removes the canvas from its parent.
			 * 
			 * ${protected}
			 *
			 * @returns {aperture.canvas.Canvas}
			 *  This canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.remove
			 * @function
			 */
			remove : function() {
//				this.clients--;

				// TODO: need to resolve shared layer destruction.
				// Reference counting in this manner is too fragile, since
				// clients could accidentally call remove more than once.
				return this;
			},

			/**
			 * Returns a member canvas of the requested type, constructing one if it does
			 * not already exist.
			 * 
			 * ${protected}
			 *
			 * @param type
			 *  An Aperture type constructor, such as aperture.canvas.VECTOR_CANVAS.
			 * @returns {aperture.canvas.Canvas}
			 *  A canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.canvas
			 * @function
			 */
			canvas : function( type ) {
				if (!type || !(type = plugins[type]) || this.typeOf(type)) {
					return this;
				}

				// find any existing canvas of the right type
				var canvas = aperture.util.find( this.canvases_, function (canvas) {
					return canvas.typeOf(type);
				});

				// if not found, create a new one.
				if (!canvas) {
					canvas = new type( this.root() );
					this.canvases_.push(canvas);
				}

//				canvas.clients++;

				return canvas;
			},

			/**
			 * Returns the canvas root DOM element.
			 * 
			 * ${protected}
			 *
			 * @returns {DOMElement}
			 *  The root DOM element of this canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.root
			 * @function
			 */
			root : function() {
				return this.root_;
			},

			/**
			 * Returns a new graphics interface implementation for this canvas.
			 * 
			 * ${protected}
			 *
			 * @param {aperture.canvas.Graphics} parentGraphics
			 *  The parent graphics context.
			 *
			 * @returns {aperture.canvas.Graphics}
			 *  A new graphics canvas
			 *
			 * @name aperture.canvas.Canvas.prototype.graphics
			 * @function
			 */
			graphics : function ( parentGraphics ) {
				return namespace.NO_GRAPHICS;
			},

			/**
			 * Called at the end of a canvas update, flushing any
			 * drawing operations, as necessary.
			 * 
			 * ${protected}
			 *
			 * @name aperture.canvas.Canvas.prototype.flush
			 * @function
			 */
			flush : function () {
				var i = 0, n;
				for (n = this.canvases_.length; i< n; i++) {
					this.canvases_[i].flush();
				}
			}
		}
	);

	namespace.handle( namespace.DIV_CANVAS, namespace.Canvas.extend( 'aperture.canvas.DivCanvas', {} ));


	// NOTE: We don't implement standard html graphics but we could

	/**
	 * @class
	 * The abstraction of an Aperture graphics implementation. An
	 * Aperture graphics interface abstracts basic rendering for platform extensibility.
	 * This class is not used directly by end clients. It is used by
	 * layer implementations and is provided here for reference only.
	 *
	 * ${protected}
	 * 
	 * @extends aperture.Class
	 *
	 * @description
	 * This class is abstract and is not to be instantiated directly.
	 *
	 * @name aperture.canvas.Graphics
	 */
	namespace.Graphics = aperture.Class.extend( 'aperture.canvas.Graphics',
		{
			init : function ( canvas ) {
				this.canvas = canvas;
			},

			/**
			 * Shows or hides this graphics instance.
			 * 
			 * ${protected}
			 *
			 * @param {Boolean} show
			 *  Whether or not to show this context.
			 *      
			 * @returns {Boolean} 
			 *  true if value was changed
			 * 
			 * @name aperture.canvas.Graphics.prototype.display
			 * @function
			 */
			display : function( show ) {
				return true;
			},

			/**
			 * Moves this graphics to the front of its container graphics,
			 * or a child element to the top.
			 * 
			 * ${protected}
			 * 
			 * @param element
			 *  An optional element to move, otherwise the entire graphics will be moved.
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.toFront
			 * @function
			 */
			toFront : function() {
				return this;
			},

			/**
			 * Moves this graphics to the back of its container graphics,
			 * or a child element to the bottom.
			 * 
			 * ${protected}
			 *
			 * @param element
			 *  An optional element to move, otherwise the entire graphics will be moved.
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.toBack
			 * @function
			 */
			toBack : function() {
				return this;
			},

			/**
			 * Removes the graphics instance from its parent.
			 * 
			 * ${protected}
			 *
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.remove
			 * @function
			 */
			remove : function () {
				return this;
			},
			
			/**
			 * Adds a callback for a specific type of event.
			 * 
			 * ${protected}
			 * 
			 * @param eventType
			 *  The type of event to add a callback for
			 * @param layer
			 *  The client layer for events.
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.on
			 * @function
			 */
			on : function(eventType, layer) {
				return this;
			},
			
			/**
			 * Removes a callback for a specific type of event.
			 * 
			 * ${protected}
			 * 
			 * @param eventType
			 *  The type of event to remove a callback for
			 * 
			 * @returns {aperture.canvas.Graphics}
			 *  This graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.off
			 * @function
			 */
			off : function(eventType) {
				return this;
			},

			/**
			 * Sets or gets a data object [and index] associated with the specified element,
			 * or universally with this canvas.
			 * 
			 * ${protected}
			 * 
			 * @param {Object} [element]
			 *  The element to get/set data for, or the universal data object for the canvas.
			 *  If omitted the universal data object is returned.
			 * @param {Object} [data]
			 *  The data to associate.
			 * @param {Array} [index]
			 *  The index array to associate.
			 * 
			 * @returns {Object|aperture.canvas.Graphics}
			 *  The data object requested (if a get), otherwise this graphics object
			 *
			 * @name aperture.canvas.Graphics.prototype.data
			 * @function
			 */
			data : function(element, data, index) {
				return this;
			}
		}
	);

	// use this singleton as a noop.
	namespace.NO_GRAPHICS = new namespace.Graphics();
	
	// an abstraction which we don't both to document.
	namespace.VectorCanvas = namespace.Canvas.extend( 'aperture.canvas.VectorCanvas',
		{
			graphics : function ( parentGraphics ) {}
		}
	);

	/**
	 * @class
	 * The abstraction of an Aperture vector graphics implementation. An
	 * Aperture graphics interface abstracts basic rendering for platform extensibility.
	 * This class is not used directly by end clients. It is used by
	 * layer implementations and is provided here for reference only.
	 *
	 * ${protected}
	 * 
	 * @extends aperture.canvas.Graphics
	 *
	 * @description
	 * This class is abstract and is not to be instantiated directly.
	 *
	 * @name aperture.canvas.VectorGraphics
	 */
	namespace.VectorGraphics = namespace.Graphics.extend( 'aperture.canvas.VectorGraphics', {} );

	/**
	 * Sets the clipping region of this graphics canvas.
	 *
	 * ${protected}
	 * 
	 * @param {Array} rect
	 *  An array of [x, y, width, height], or
	 *  an empty or null clip if clearing.
	 *
	 * @returns {aperture.canvas.Graphics}
	 *  This graphics object
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.clip
	 * @function
	 */

	/**
	 * Sets the position of this graphics canvas.
	 *
	 * ${protected}
	 * 
	 * @param {Number} x
	 *  The x position.
	 *
	 * @param {Number} y
	 *  The y position.
	 *
	 * @returns {aperture.canvas.Graphics}
	 *  This graphics object
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.origin
	 * @function
	 */

	/**
	 * Adds a path given an svg path string.
	 *
	 * ${protected}
	 * 
	 * @param {String} [svg]
	 *  An optional path string in svg path format. If not specified here
	 *  the path is expected to be set later.
	 *
	 * @returns {Object}
	 *  A new path element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.path
	 * @function
	 */

	/**
	 * Adds a circle element.
	 *
	 * ${protected}
	 * 
	 * @param {Number} x
	 *  The x coordinate of the circle.
	 *
	 * @param {Number} y
	 *  The y coordinate of the circle.
	 *
	 * @param {Number} radius
	 *  The radius of the circle.
	 *
	 * @returns {Object}
	 *  A new circle element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.circle
	 * @function
	 */

	/**
	 * Adds a rectangle element.
	 *
	 * ${protected}
	 * 
	 * @param {Number} x
	 *  The x coordinate of the rectangle.
	 *
	 * @param {Number} y
	 *  The y coordinate of the rectangle.
	 *
	 * @param {Number} width
	 *  The width of the rectangle.
	 *
	 * @param {Number} height
	 *  The height of the rectangle.
	 *
	 * @returns {Object}
	 *  A new rectangle element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.rect
	 * @function
	 */

	/**
	 * Adds a text element.
	 *
	 * ${protected}
	 * 
	 * @param {Number} x
	 *  The x coordinate of the text.
	 *
	 * @param {Number} y
	 *  The y coordinate of the text.
	 *
	 * @param {String} text
	 *  The text of the element.
	 *
	 * @returns {Object}
	 *  A new text element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.text
	 * @function
	 */

	/**
	 * Adds an image element.
	 *
	 * ${protected}
	 * 
	 * @param {String} src
	 *  The source uri of the image.
	 *
	 * @param {Number} x
	 *  The x coordinate of the circle.
	 *
	 * @param {Number} y
	 *  The y coordinate of the circle.
	 *
	 * @param {Number} width
	 *  The width of the image in pixels.
	 *
	 * @param {Number} height
	 *  The height of the image in pixels.
	 *
	 * @returns {Object}
	 *  A new image element
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.image
	 * @function
	 */


	/**
	 * Retrieves or updates attributes of an element previously returned by 
	 * one of the element constructors, optionally animating in the changes.
	 *
	 * ${protected}
	 * 
	 * @param {Object} element
	 *  The element to read or update, previously returned by an element
	 *  constructor.
	 *
	 * @param {Object|String} attributes|key
	 *  If an object is given, sets property values to update in the element. If
	 *  a string is given, returns the attribute value for the given key.
	 *
	 * @param {aperture.animate.Transition} [transition]
	 *  The optional animated transition to use. Only applicable when setting attribues.
	 *
	 * @returns the attribute value if reading attribute value, otherwise this.
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.attr
	 * @function
	 */

	/**
	 * If an element argument is supplied, removes the element 
	 * and destroys it, otherwise the graphics context itself is
	 * removed and destroyed.
	 *
	 * ${protected}
	 * 
	 * @param {Object} [element]
	 *  The element to remove, previously returned by an element
	 *  constructor.
	 *
	 * @returns {Object|aperture.canvas.Graphics}
	 *  The element removed.
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.remove
	 * @function
	 */
	
	/**
	 * If an elements argument is supplied, removes the elements
	 * specified and destroys them, otherwise all elements are removed.
	 *
	 * ${protected}
	 * 
	 * @param {Array} [elements]
	 *  Optionally, the elements to remove, previously returned by element
	 *  constructors.
	 *      
	 * @name aperture.canvas.VectorGraphics.prototype.removeAll
	 * @function
	 */
	
	/**
	 * Applies an appearance transition to a new element, if
	 * supplied. If not supplied this method has no effect.
	 *
	 * ${protected}
	 * 
	 * @param {Object} element
	 *  The element to apparate, previously returned by an element
	 *  constructor.
	 *
	 * @param {aperture.animate.Transition} [transition]
	 *  The optional animated transition to use.
	 *
	 * @name aperture.canvas.VectorGraphics.prototype.apparate
	 * @function
	 */

	return namespace;

}(aperture.canvas || {}));

