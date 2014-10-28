/**
 * Source: openLayers2.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture OpenLayers 2.x integration APIs
 */



/*
 * TODO: Create a generic container layer that just creates a canvas for children
 * to use.  Map lat/lon to [0,1] ranges and then renderers can scale x/y based on
 * size of canvas.  Then can make MapNodeLayer derive from this layer.  This layer
 * could be used as parent for a layer drawing a series of points/labels, for
 * example.
 */

aperture.geo = aperture.geo || {};

/**
 * @namespace Geospatial vizlet layers. If not used, may be excluded.
 * @requires OpenLayers2
 */
aperture.geo.ol = (
/** @private */
function(ns) {

	if (!window.OpenLayers) {
		aperture.log.info('OpenLayers 2 js not present. Skipping OL2 map api implementation.');
		return ns;
	}


	/**********************************************************************/

	/*
	 * The projection that the API expects for lat/lon data unless instructed otherwise.
	 */
	var apiProjection = new OpenLayers.Projection('EPSG:4326');


	/**
	 * @private
	 * OpenLayers implementation that positions a DIV that covers the entire world
	 * at the current zoom level.  This provides the basis for the MapNodeLayer
	 * to allow child layers to render via DOM or Vector graphics.
	 */
	var DivOpenLayer = OpenLayers.Class(OpenLayers.Layer,
	{

		/**
		 * APIProperty: isBaseLayer
		 * {Boolean} Markers layer is never a base layer.
		 */
		isBaseLayer : false,

		/**
		 * @private
		 */
		topLeftPixelLocation : null,

		/**
		 * @private constructor
		 *
		 * Parameters:
		 * name - {String}
		 * options - {Object} Hashtable of extra options to tag onto the layer
		 */
		initialize : function(name, options) {
			OpenLayers.Layer.prototype.initialize.apply(this, arguments);

			// The frame is big enough to contain the entire world
			this.contentFrame = document.createElement('div');
			this.contentFrame.style.overflow = 'hidden';
			this.contentFrame.style.position = 'absolute';
			// It is contained in the 'div' element which is fit exactly
			// to the map's main container layer
			this.div.appendChild(this.contentFrame);
			// Turn off pointer events on the map-covering div to allow click through to map layers below
			// Child visuals will need to turn back on
			this.div.style.pointerEvents = 'none';
		},

		/**
		 * APIMethod: destroy
		 */
		destroy : function() {
			OpenLayers.Layer.prototype.destroy.apply(this, arguments);
		},

		/**
		 * Method: moveTo
		 *
		 * Parameters:
		 * bounds - {<OpenLayers.Bounds>}
		 * zoomChanged - {Boolean}
		 * dragging - {Boolean}
		 */
		moveTo : function(bounds, zoomChanged, dragging) {
			var extent, topLeft, bottomRight;

			OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

			// Adjust content DIV to cover visible area + 1 equivalent area in each direction
			topLeft = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(bounds.left, bounds.top));
			bottomRight = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(bounds.right, bounds.bottom));

			var width = bottomRight.x - topLeft.x;
			var height = bottomRight.y - topLeft.y;

			// Layer origin is offset that must be subtracted from a pixel location to transform
			// from OpenLayer's layer pixel coordinates to the contentFrame's coordinates
			this.olLayerOrigin = {
				x: topLeft.x - width,
				y: topLeft.y - height,
			};

			this.contentFrame.style.top = this.olLayerOrigin.y + 'px';
			this.contentFrame.style.left = this.olLayerOrigin.x + 'px';
			this.contentFrame.style.width = (3*width) + 'px';
			this.contentFrame.style.height = (3*height) + 'px';

			if (this.onFrameChange) {
				this.onFrameChange(bounds);
			}
		},

		getContentPixelForLonLat : function( lon, lat ) {
			// Convert from lon/lat to pixel space, account for projection
			var pt = new OpenLayers.Geometry.Point(lon, lat);
			// Reproject to map's projection
			if( this.map.projection != apiProjection ) {
				pt.transform(apiProjection, this.map.projection);
			}
			// Get layer pixel
			var px = this.map.getLayerPxFromLonLat(new OpenLayers.LonLat(pt.x, pt.y));
			// Transform pixel to contentFrame space
			px.x -= this.olLayerOrigin.x;
			px.y -= this.olLayerOrigin.y;

			return px;
		},

		getLonLatExtent: function() {
			var extent = this.map.getExtent();
			var p0 = new OpenLayers.Geometry.Point(extent.left, extent.top);
			var p1 = new OpenLayers.Geometry.Point(extent.right, extent.bottom);
			if( this.map.projection != apiProjection ) {
				p0.transform(this.map.projection, apiProjection);
				p1.transform(this.map.projection, apiProjection);
			}
			return {
				left: p0.x,
				top: p0.y,
				right: p1.x,
				bottom: p1.y
			};
		},

		drawFeature : function(feature, style, force) {
			// Called by OpenLayers to force this feature to redraw (e.g. if some state changed
			// such as selection that could affect the visual.  Not needed for a container layer
		},

		CLASS_NAME : 'DivOpenLayer'
	});

	ns.ContainerOLLayer = DivOpenLayer;


	/**********************************************************************/


	var BaseMapNodeLayer = aperture.PlotLayer.extend('aperture.geo.BaseMapNodeLayer',
	/** @lends aperture.geo.ol.BaseMapNodeLayer# */
	{
		/**
		 * @class A layer that draws child layer items at point locations.
		 *
		 * @mapping {Number} longitude
		 *   The longitude at which to locate a node
		 *
		 * @mapping {Number} latitude
		 *   The latitude at which to locate a node
		 *
		 * @augments aperture.PlotLayer
		 * @constructs
		 * @factoryMade
		 */
		init : function( spec, mappings ) {
			aperture.PlotLayer.prototype.init.call(this, spec, mappings );
			this.olLayer = spec.olLayer;
		},

		/**
		 * @private
		 */
		canvasType: aperture.canvas.VECTOR_CANVAS,

		/**
		 * @private
		 */
		render : function( changeSet ) {
			// just need to update positions
			aperture.util.forEach(changeSet.updates, function( node ) {
				// If lon,lat is specified pass the position to children
				// Otherwise let the children render at (x,y)=(0,0)
				var lat = this.valueFor('latitude', node.data, null);
				var lon = this.valueFor('longitude', node.data, null);

				// Find pixel x/y from lon/lat
				var px = {x:0,y:0};
				if (lat != null && lon != null) {
					px = this.olLayer.getContentPixelForLonLat(lon,lat);
				}

				// Update the given node in place with these values
				node.position = [px.x,px.y];
			}, this);


			// will call renderChild for each child.
			aperture.PlotLayer.prototype.render.call(this, changeSet);

		}
	});

	// Expose base for sharing
	ns.BaseMapNodeLayer = BaseMapNodeLayer;


	/**********************************************************************/


	var MapLayerVizletWrapper = aperture.vizlet.make( BaseMapNodeLayer );

	/**
	 * @class A root-level layer (cannot be contained in another vizlet/layer) that
	 * can be added to an OpenLayers v2.x map. Layers of this type contain a {@link #olLayer}
	 * member which is a valid OpenLayers layer and can be added to any OL map.
	 *
	 * @example
	 *
	 * var mapLayer = new aperture.geo.ol.NodeLayer();
	 * mapLayer.map('latitude').to('lat');
	 * mapLayer.map('longitude').to('lon');
	 * myOLMap.addLayer( mapLayer.olLayer );
	 *
	 * @name aperture.geo.ol.NodeLayer
	 * @augments aperture.geo.BaseMapNodeLayer
	 * @constructs
	 * @requires OpenLayers
	 */
	var NodeLayer = function(spec, mappings) {
		// Create OL layer that our layer will contain
		var olLayer = new DivOpenLayer('aperture-openlayers-bridge', {});

		spec = aperture.util.extend(spec || {}, {
			elem: olLayer.contentFrame,
			olLayer: olLayer
		});

		// Create Aperture MapLayer layer itself
		var self = MapLayerVizletWrapper(spec, mappings);

		// When ol layer's frame changes, redraw owner Aperture layer
		olLayer.onFrameChange = function() {
			self.all().redraw();
		}

		return self;
	};

	ns.NodeLayer = NodeLayer;





	/**********************************************************************/
	/*
	 * The list of OpenLayers vector layer styles that can be mapped in Aperture
	 */
	var availableStyles = {
			'fillColor' : 'fill',
			'fillOpacity': 'opacity',
			'strokeColor': 'stroke',
			'strokeOpacity': 'stroke-opacity',
			'strokeWidth': 'stroke-width',
			'strokeLinecap': 'stroke-linecap',
			'strokeDashstyle': 'stroke-style', // needs translation?
//			'graphicZIndex', ??
			'label': 'label',
			'pointRadius': 'radius',
			'cursor': 'cursor',
			'externalGraphic': '' // overridden below
	};

	/*
	 * Default values for all settable styles (used if not mapped)
	 * TODO Allow this to be overridden by configuration
	 */
	var vectorStyleDefaults = {
		fillColor: '#999999',
		fillOpacity: '1',
		strokeColor: '#333333',
		strokeOpacity: '1',
		strokeWidth: 1,
		strokeLinecap: 'round',
		strokeDashstyle: 'solid',
		graphicZIndex: 0,
		// Must have a non-undefined label or else OpenLayers writes "undefined"
		label: '',
		// Must have something defined here or IE throws errors trying to do math on "undefined"
		pointRadius: 0,
		cursor: ''
	};

	/*
	 * Styles that are fixed and cannot be altered
	 * TODO Allow this to be overridden by configuration
	 */
	var fixedStyles = {
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: 10

		// If we allow the following to be customizable by the user
		// this prevents us from using the default of the center of the image!
		//graphicXOffset:
		//graphicYOffset:
	};

	// returns private function for use by map external layer
	var makeHandler = (function() {

		// event hooks for features.
		function makeCallback( type ) {
			var stopKey;

			switch (type) {
			case 'click':
			case 'dblclick':
				stopKey = 'stopClick';
				break;
			case 'mousedown':
			case 'touchstart': // ?
				stopKey = 'stopDown';
				break;
			case 'mouseup':
				stopKey = 'stopUp';
				break;
			}
			if (stopKey) {
				return function(feature) {
					this.handler_[stopKey] = this.trigger(type, {
						data: feature.attributes,
						eventType: type
					});
				};
			} else {
				return function(feature) {
					this.trigger(type, {
						data: feature.attributes,
						eventType: type
					});
				};
			}
		}

		var featureEvents = {
			'mouseout' : 'out',
			'mouseover' : 'over'
		};

		return function (events) {
			var handlers = {}, active;

			if (this.handler_) {
				this.handler_.deactivate();
				this.handler_= null;
			}

			aperture.util.forEach(events, function(fn, event) {
				handlers[ featureEvents[event] || event ] = makeCallback(event);
				active = true;
			});

			if (active) {
				this.handler_ = new OpenLayers.Handler.Feature(
					this, this.olLayer, handlers,
					{ map: this.olLayer.map,
						stopClick: false,
						stopDown: false,
						stopUp: false
					}
				);
				this.handler_.activate();
			}
		};
	}());

	var VectorLayer = aperture.Layer.extend( 'aperture.geo.ol.VectorLayer',
	/** @lends aperture.geo.ol.VectorLayer# */
	{
		/**
		 * @class An Aperture Map layer that manages visual mappings of an OpenLayers Vector layer
		 * such as KML, GML, or GeoRSS.  Visual properties of this layer are mapped like any
		 * other layer where the data available for mapping are attributes of the features
		 * loaded from the external source.
		 *
		 * @mapping {String} fill
		 *   The fill color of the feature
		 *
		 * @mapping {String} stroke
		 *   The line color of the feature
		 *
		 * @mapping {Number} stroke-opacity
		 *   The line opacity of the feature as a value from 0 (transparent) to 1.
		 *
		 * @mapping {Number} stroke-width
		 *   The line width of the feature.
		 *
		 * @mapping {String} label
		 *   The label of the feature.
		 *
		 * @mapping {Number} radius
		 *   The radius of the feature.
		 *
		 * @mapping {String} cursor
		 *   The hover cursor for the feature.
		 *
		 * @augments aperture.Layer
		 * @constructs
		 *
		 * @description Layer constructors are invoked indirectly by calling
		 *  {@link aperture.PlotLayer#addLayer addLayer} on a parent layer with the following specifications...
		 *
 		 * @param {Object} olLayer|spec
		 *      an OpenLayers Vector layer to manage
		 *
		 * @param {Object} [spec.olLayer]
		 *      a set of initial mappings
		 *
		 * @param {Object} [mappings]
		 *      a set of initial mappings
		 */
		init : function(olLayer, mappings) {
			var spec;
			if (olLayer && olLayer.olLayer) {
				spec = olLayer;
				olLayer = olLayer.olLayer;
			} else {
				spec = {};
			}

			if (!olLayer || !olLayer.CLASS_NAME) {
				aperture.log.error('Aperture OpenLayers VectorLayer requires an OpenLayers Vector layer')
			}

			aperture.Layer.prototype.init.call(this, spec, mappings);

			this.olLayer = olLayer;

			//
			// Ensure Openlayers defers to Aperture for all style queries
			// Creates an OpenLayers style map that will call the Aperture layer's "valueFor"
			// function for all styles.
			//
			// Create a base spec that directs OpenLayers to call our functions for all properties
			var defaultSpec = aperture.util.extend({}, fixedStyles);

			// plus any set properties
			aperture.util.forEach(availableStyles, function(property, styleName) {
				defaultSpec[styleName] = '${'+styleName+'}';
			});

			// Create a cloned version for each item state
			var selectedSpec = aperture.util.extend({}, defaultSpec);
			var highlighedSpec = aperture.util.extend({}, defaultSpec);

			// Override some properties for custom styles (e.g. selection bumps up zIndex)
			//util.extend(selectedSpec, customStyles.select);
			//util.extend(highlighedSpec, customStyles.highlight);

			// Create context object that provides feature styles
			// For each available style create a function that calls "valueFor" giving the
			// feature as the data value
			var styleContext = {},
				that = this;

			aperture.util.forEach(availableStyles, function(property, styleName) {
				styleContext[styleName] = function(feature) {
					// Value for the style given the data attributes of the feature
					return that.valueFor(property, feature.attributes, vectorStyleDefaults[styleName]);
				};
			});
			styleContext.externalGraphic = function(feature) {
				// Must have a non-undefined externalGraphic or else OpenLayers tries
				// to load the URL "undefined"
				if (feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.Point') {
					return that.valueFor('icon-url', feature.attributes, '');
				}
				return that.valueFor('fill-pattern', feature.attributes, '');
			};

			// Create the style map for this layer
			styleMap = new OpenLayers.StyleMap({
				'default' : new OpenLayers.Style(defaultSpec, {context: styleContext}),
				'select' : new OpenLayers.Style(selectedSpec, {context: styleContext}),
				'highlight' : new OpenLayers.Style(highlighedSpec, {context: styleContext})
			});

			this.olLayer.styleMap = styleMap;
		},

		/**
		 * @private not supported
		 */
		data : function(value) {
			// Not supported
			if( value ) {
				throw new Error('Cannot add data to a layer with an external data source');
			}
		},

		/**
		 * @private monitor adds and removes.
		 */
		on : function( eventType, callback ) {
			var hadit = this.handlers_[eventType];

			aperture.Layer.prototype.on.call(this, eventType, callback);

			if (!hadit) {
				makeHandler.call(this, this.handlers_);
			}
		},

		/**
		 * @private monitor adds and removes.
		 */
		off : function( eventType, callback ) {
			aperture.Layer.prototype.off.call(this, eventType, callback);

			if (!this.handlers_[eventType]) {
				makeHandler.call(this, this.handlers_);
			}
		},

		/**
		 * @private
		 */
		render : function(changeSet) {
			// No properties or properties and intersection with our properties
			// Can redraw
			this.olLayer.redraw();
		},

		redraw : function() {
			this.render();
		}
	});

	ns.VectorLayer = VectorLayer;

	return ns;
}(aperture.geo.ol || {}));