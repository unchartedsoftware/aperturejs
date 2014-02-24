/**
 * Source: esri.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Map APIs
 *
 *This code was written to integrate maps created using the Esri JS/ArcGIS Javascript library 
 * into Aperture.
 *
 */

/**
 * @namespace Geospatial vizlet layers. If not used the geospatial package may be excluded.
 * @requires OpenLayers or ESRI
 */
aperture.geo = (
/** @private */
function(ns) {
function esriMaps() {
	aperture.log.info('Loading ESRI map api implementation...');
	
	var SpatialReference = require("esri/SpatialReference"), 
		Extent = require("esri/geometry/Extent"), 
		Point = require("esri/geometry/Point"), 
		EsriMapType = require("esri/map"), 
		ArcGISDynamicMapServiceLayer = require( "esri/layers/ArcGISDynamicMapServiceLayer");

	// util is always defined by this point
	var util = aperture.util, esri = 'ESRI_CANVAS';
	//
	// Searchers through a set of layers to find
	// the base layer's index.
	var getBaseLayerIndex = function(map) {
		var i, layers = map.layers;
		for(i=0; i < layers.length; i++) {
			if(layers[i].isBaseLayer==true){
				return(i);
			}
		}
	};
	

	define("ApertureEsriTMSLayer", [ "dojo/_base/declare","esri/SpatialReference", "esri/geometry/Extent", "esri/layers/TileInfo", "esri/layers/TiledMapServiceLayer" ], 
									function(declare, SpatialReference, Extent, TileInfo, TiledMapServiceLayer) {
		return declare(TiledMapServiceLayer, {
			constructor : function(config) {
				if (typeof config.esriOptions == 'undefined') {
					return aperture.log.error('Esri options must be specfied for Esri TMS layers');
				}
			
				if (typeof config.esriOptions.wkid !== 'undefined') {
					this.spatialReference = new SpatialReference({
						wkid : config.wkid
					});
					if (typeof config.extent !== 'undefined') {
						var extentConfig = config.extent;
						extentConfig.spatialReference = this.spatialReference;
						var ext = new Extent(extentConfig);
						this.initialExtent = this.fullExtent = ext;
					}
				}

				// Could do a mixin but will get properties we don't want
				this.urlPrefix = config.urlPrefix;
				this.urlVersion = config.urlVersion;
				this.urlLayer = config.urlLayer;
				this.urlType = config.urlType;
				this.maxScale = config.esriOptions.maxScale;
				this.minScale = config.esriOptions.minScale;
				this.opacity = config.esriOptions.opacity;

				if ((typeof config.esriOptions.tiles !== 'undefined') && (typeof config.esriOptions.lods !== 'undefined')) {
					var tileConfig = config.esriOptions.tiles;
					tileConfig.lods = config.esriOptions.lods;
					this.tileInfo = new TileInfo(tileConfig);
				}

				this.loaded = true;
				this.onLoad(this);
			},

			getTileUrl : function(level, row, col) {
				row = Math.pow(2, level) - row - 1;
				return 	this.urlPrefix + "/" +
						this.urlVersion + "/" + 
						this.urlLayer + "/" + 
						level + "/" + 
						col + "/" + 
						row	+ this.urlType;
			}
		});
	});		

	// if basic Canvas ever implements stuff for real we should override where it makes sense
	var EsriCanvas = aperture.canvas.Canvas.extend( 'aperture.geo.EsriCanvas', {
			init : function(root, map) {
				aperture.canvas.Canvas.prototype.init.call(this, root);
				this.esriMap_ = map;
			}
		}
	);
	//
	aperture.canvas.handle( esri, EsriCanvas );
	//
//			    /**
//			     * @private
//			     * Base of Map Layer classes
//			     */
	var EsriMapLayer = aperture.Layer.extend( '[private].EsriMapLayer', {
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);
	//
			if (spec.extent) {
				spec.extent = OpenLayers.Bounds.fromArray(spec.extent);
			}
			if ( !this.canvas_ ) {
				throw new Error('Map layer must be constructed by a parent layer through an addLayer call');
			}
		},
	//
		/**
		 * OpenLayers layer
		 */
		esriLayer_ : null, // Assumption that a single OpenLayers layer can be used for all rendering
	//
	//
		/**
		 * Canvas type is OpenLayers
		 */
		canvasType : esri,
	//
		/**
		 * @private
		 */
		data : function(value) {
			if( value ) {
				throw new Error('Cannot add data to a base map layer');
			}
		},
	//
		/**
		 * @private
		 */
		render : function(changeSet) {
			// Must force no render logic so the layer doesn't try to monkey around with data
		},
//			        
		/**
		 * @private
		 */
		remove : function() {
			aperture.Layer.prototype.remove.call(this);
	//
			// hook into open layers to remove
			//ESRI TODO REMOVE CALL
			//this.canvas_.olMap_.removeLayer(this.olLayer_);
		}
	});
	//    

	// deprecated
	var tileTypeAliases = {
			tms : 'TMS',
			wms : 'WMS'
		};
	//    
	//    
	var MapTileLayer = EsriMapLayer.extend( 'aperture.geo.MapTileLayer', 
	/** @lends aperture.geo.MapTileLayer# */
	{
		/**
		 * @class The base class for Aperture Map layers that displays one or more image tiles 
		 * from one of a variety of standards based sources.
		 *
		 * @augments aperture.Layer
		 * @constructs
		 * @factoryMade
		 */
		init : function(spec, mappings) {
			EsriMapLayer.prototype.init.call(this, spec, mappings);
	//
			spec.options = spec.options || {};
			
			if (spec.options.isBaseLayer == null) {
				spec.options.isBaseLayer = false;
			}
		}		
	});
	//
		ns.MapTileLayer = MapTileLayer;
	//

	ns.MapTileLayer.TMS = MapTileLayer.extend( 'aperture.geo.MapTileLayer.TMS', 
			/** @lends aperture.geo.MapTileLayer.TMS# */
			{

				init : function(spec, mappings) {
					MapTileLayer.prototype.init.call(this, spec, mappings);
					var ApertureEsriTMSLayer = require("ApertureEsriTMSLayer");
					this.esriLayer = new ApertureEsriTMSLayer(spec);
					this.canvas_.esriMap_.addLayer(this.esriLayers);			
				}		
			});

	//
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
//					'graphicZIndex', ??
			'label': 'label',
			'pointRadius': 'radius',
			'cursor': 'cursor',
			'externalGraphic': '' // overridden below
	};
	//
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
	//
	/*
	 * Styles that are fixed and cannot be altered
	 * TODO Allow this to be overridden by configuration
	 */
	var fixedStyles = {
		fontFamily: 'Arial, Helvetica, sans-serif',
		fontSize: 10
	//
		// If we allow the following to be customizable by the user
		// this prevents us from using the default of the center of the image!
		//graphicXOffset:
		//graphicYOffset:
	};
	//
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
	//
			if (active) {

			}
		};
	}());
	
	//
	// default property values for map nodes.
	var mapNodeProps = {
		'longitude' : 0,
		'latitude' : 0
	};
	
	var updateContentFrame = function(mapNodeLayer) {
		var contentFrame = mapNodeLayer.contentFrame;
		var esriMap = mapNodeLayer.mapCanvas.esriMap_;
		var extent = esriMap.geographicExtent;
		var apiProjection = new SpatialReference(4326);
		var topLeft = new Point(extent.xmin , extent.ymax, apiProjection );
		var bottomRight = new Point( extent.xmax, extent.ymin, apiProjection);
		
		var screenTL = esriMap.toScreen(topLeft);
		var screenBR = esriMap.toScreen(bottomRight);
		
		//If we render the aperture SVG elements into a div that is a 3x3 grid of the actual viewport
		//then when we pan (move the div) the elements that are outside the viewport are rendered correctly.
		var returnHeight = screenBR.y * 3;
		var returnWidth  = screenBR.x * 3;
		
		screenBR.x = screenBR.x * -1;
		screenBR.y = screenBR.y * -1;
		mapNodeLayer.corrective = { x:screenBR.x,y:screenBR.y};
		var canvasSize =  {h: returnHeight, w : returnWidth};

		mapNodeLayer._canvasWidth = canvasSize.w;
		mapNodeLayer._canvasHeight = canvasSize.h;
		
		OpenLayers.Util.modifyDOMElement(contentFrame, null, mapNodeLayer.corrective, canvasSize, 'absolute');
		mapNodeLayer.corrective.x = mapNodeLayer.corrective.x * -1;
		mapNodeLayer.corrective.y = mapNodeLayer.corrective.y * -1;
	};
	
	//
	/*
	 * TODO: Create a generic container layer that just creates a canvas for children
	 * to use.  Map lat/lon to [0,1] ranges and then renderers can scale x/y based on
	 * size of canvas.  Then can make MapNodeLayer derive from this layer.  This layer
	 * could be used as parent for a layer drawing a series of points/labels, for
	 * example.
	 */
	//
	var MapNodeLayer = aperture.PlotLayer.extend( 'aperture.geo.MapNodeLayer',
	/** @lends aperture.geo.MapNodeLayer# */
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
		init: function(spec, mappings) {
			this.robId = "MapNodeLayer";
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
			
			if (mappings && mappings.map) {
				this.canvas_.esriMap_ = mappings.map;
			}

			// because we declare ourselves as an open layers canvas layer this will be 
			// the parenting open layers canvas, which holds the map reference. Note however that
			// since we are really a vector canvas layer we override that a ways below.
			this.mapCanvas = this.canvas_;
			if (!this.mapCanvas.esriMap_) {
				aperture.log.error('MapNodeLayer must be added to a map.');
				return;
			}
			
			var that = this;

			
			var appendControl = document.getElementById('map_container');
			this.contentFrame = document.createElement('div');
			this.contentFrame.style.position = 'absolute';
			
			appendControl.appendChild(this.contentFrame);
			
			this.mapCanvas.esriMap_.on("load", function() {
				that.mapCanvas.esriMap_.graphics.enableMouseEvents();						
				updateContentFrame(that);
			});					
				
			var renderHandler = function() {						
				updateContentFrame(that);
				that.contentFrame.style.visibility = "visible";
				that.all().redraw();						
			};
			
			var hideHandler = function() {
				that.contentFrame.style.visibility = "hidden";
			};
			
			var panHandler = function(extent) {
				var newY = extent.delta.y - that.corrective.y;
				var newX = extent.delta.x - that.corrective.x;
				that.contentFrame.style.top  = newY + "px";
				that.contentFrame.style.left = newX + "px";
			};
			
			this.mapCanvas.esriMap_.on("zoom-start", hideHandler);
			this.mapCanvas.esriMap_.on("zoom-end", renderHandler);
			this.mapCanvas.esriMap_.on("pan-end", renderHandler);
			this.mapCanvas.esriMap_.on("pan", panHandler);			
													
			// because we parent vector graphics but render into a specialized open layers
			// canvas we need to help bridge the two by pre-creating this canvas with the
			// right parentage.
			var EsriVectorCanvas = aperture.canvas.type(aperture.canvas.VECTOR_CANVAS);
	//
			this.canvas_ = new EsriVectorCanvas( this.contentFrame );
			this.mapCanvas.canvases_.push( this.canvas_ );
		},				

		update : function() {
			updateContentFrame(this);
		},
						
	//
		/**
		 * @private
		 */
		canvasType : esri,
	//
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
	//
				// Find pixel x/y from lon/lat
				var px = {x:0,y:0};
				if (lat != null && lon != null) {
					var mapPoint = new Point( lon, lat, apiProjection );
					px = this.vizlet_.esriMap_.toScreen(mapPoint);
					px.x += this.corrective.x;
					px.y += this.corrective.y;
				}
	//
				node.position = [px.x,px.y];
				node.userData.width = this._canvasWidth;
				node.userData.height = this._canvasHeight;							
	//
				// Update width/height
	//
			}, this);
			
			
			// will call renderChild for each child.
//					this.zoomed = false;
			aperture.PlotLayer.prototype.render.call(this, changeSet);
//					
//					//Copy the rendered elements into the Esri Graphics layer
//					var svgElement = document.getElementById('map_graphics_layer');
//					var removeElements = [];
//					for (var index = 0; index < svgElement.children.length; index++) {
//						removeElements.push(svgElement.children[index]);
//					}
//					
//					for (var index = 0; index < removeElements.length; index++) {
//						svgElement.removeChild(removeElements[index]);
//					}
//										
//					var copyElements = this.contentFrame.children[0].children;					
//					for (var index = 0; index < copyElements.length; index++) {
//						var clonedNode = copyElements[index].cloneNode(true);
//						svgElement.appendChild(clonedNode);
//					}
			
//					//The appendChild call removes the element from the children array so must
//					//clone the array
//					var tempArray = [];
//					for (var index = 0; index < copyElements.length; index++) {
//						tempArray.push(copyElements[index]);
//					}
//					
//					for (var index = 0; index < tempArray.length; index++) {
//						svgElement.appendChild(tempArray[index]);						
//					}
	//
		},
	//
		/**
		 * @private
		 */
		renderChild : function(layer, changeSet) {
			// Pass size information to children (so LineSeriesLayer can render correctly)
			aperture.util.forEach( changeSet.updates, function (node) {
				if (node) {
					node.width = node.parent.userData.width;
					node.height = node.parent.userData.height;
				}
			});
			layer.render( changeSet );
		},
	//
		/**
		 * Given a location returns its pixel coordinates in container space.
		 */
		getXY: function(lon,lat) {
			var mapPoint = new Point( lon, lat, apiProjection );
			var screenPoint = this.vizlet_.esriMap_.toScreen(mapPoint);
			return screenPoint;
		},
	//
		getExtent: function() {
//					var extent =  this.vizlet_.esriMap_.extent;
			return {left: 0, right:0, top:0, bottom:0};
		}
	});
	//
	ns.MapNodeLayer = MapNodeLayer;
	//
	//
	/************************************************************************************/
	//
	//

	//
	/*
	 * The projection that the API expects unless instructed otherwise.  All layers
	 * and data are to be expressed in this projection.
	 */
	var apiProjection = new SpatialReference(4326);
	//
	/*
	 * Default map options
	 */
	var defaultMapConfig = {
		options : {
			projection : apiProjection,
			displayProjection : apiProjection
		}
	};
	//
	/**
	 * Call on zoom completion.
	 */
	function notifyZoom() {
		this.trigger('zoom', {
			eventType : 'zoom',
			layer : this
		});
	}
	//
	function notifyPan() {
		this.trigger('panend', {
			eventType : 'panend',
			layer : this
		});
	}

	var EsriMapVizletLayer = aperture.PlotLayer.extend( 'aperture.geo.EsriMapVizletLayer',
	// documented as Map, since it currently cannot function as a non-vizlet layer.
	/**
	 * @lends aperture.geo.Map#
	 */
	{
		/**
		 * @class A map vizlet is capable of showing geographic and geographically located data.  It
		 * contains a base map and additional child geo layers can be added. The base map is
		 * typically configured as a system-wide default, although can be overridden via the
		 * spec object passed into this constructor.  This layer does not require or support any
		 * mapped properties. 
		 *
		 *
		 * @constructs
		 * @augments aperture.PlotLayer
		 *
		 * @param {Object|String|Element} spec
		 *      A specification object detailing options for the map construction, or
		 *      a string specifying the id of the DOM element container for the vizlet, or
		 *      a DOM element itself. A
		 *      specification object, if provided, includes optional creation options for the
		 *      map layer.  These options can include base map configuration, map projection settings,
		 *      zoom level and visible area restrictions, and initial visible bounds.  Other than an id,
		 *      the following options do not need to be included if they are already configured via the 
		 *      aperture.config system.
		 * @param {String|Element} spec.id
		 *      If the spec parameter is an object, a string specifying the id of the DOM
		 *      element container for the vizlet or a DOM element itself.
		 * @param {Object} [spec.options]
		 *      Object containing options to pass directly to the Openlayers map.
		 * @param {String} [spec.options.projection]
		 *      A string containing the EPSG projection code for the projection that should be
		 *      used for the map.
		 * @param {String} [spec.options.displayProjection]
		 *      A string containing the EPSG projection code for the projection that should be
		 *      used for displaying map data to the user, for example mouse hover coordinate overlays.
		 * @param {String} [spec.options.units]
		 *      The units used by the projection set above
		 * @param {Array} [spec.options.maxExtent]
		 *      A four-element array containing the maximum allowed extent (expressed in units of projection
		 *      specified above) of the map given the limits of the projection.
		 * @param {Object} [spec.baseLayer]
		 *      Object containing information about the base map layer that should be created.
		 * @param {Object} spec.baseLayer.{TYPE}
		 *      The base layer specification where {TYPE} is the class of MapTileLayer 
		 *      (e.g. {@link aperture.geo.MapTileLayer.TMS TMS}) and
		 *      its value is the specification for it.
		 * @param {Object} [mappings]
		 *      An optional initial set of property mappings.
		 */
		init : function(spec, mappings) {
	//
			// clone - we will be modifying, filling in defaults.
			this.spec = spec = util.extend({}, spec);
	//
			// pass clone onto parent.
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);
	//
	//
			// PROCESS SPEC
			// Clone provided options and fill in defaults
			spec.options = util.extend({}, defaultMapConfig.options || {}, spec.options);
	//
			// Ensure projections are in OpenLayers class format
			if( util.isString(spec.options.projection) ) {
				spec.options.projection = new OpenLayers.Projection(spec.options.projection);
			}
			if( util.isString(spec.options.displayProjection) ) {
				spec.options.displayProjection = new OpenLayers.Projection(spec.options.displayProjection);
			}
	//
			// Ensure maxExtent is an OpenLayer bounds object
			if( util.isArray(spec.options.maxExtent) ) {
				spec.options.maxExtent = OpenLayers.Bounds.fromArray(spec.options.maxExtent);
			}
			
			// If map to have no controls, initialize with new empty array, not array from defaultMapConfig
			if(util.isString(spec.options.controls)||(util.isArray(spec.options.controls)&&(spec.options.controls.length==0))){
				spec.options.controls = [];  
			}
	//
			// Clone provided base layer information and fill in defaults
			spec.baseLayer = util.extend({}, defaultMapConfig.baseLayer || {}, spec.baseLayer);
	//
			// CREATE MAP
			// Create the map without a parent
						
			this.esriMap_ = new EsriMapType("map", defaultMapConfig.esriOptions );
			this.canvas_.canvases_.push(new EsriCanvas( this.canvas_.root(), this.esriMap_ ) );

			this.basemapLayer = new ArcGISDynamicMapServiceLayer("http://192.168.0.152:6080/arcgis/rest/services/Natural_Earth_SERVICE_BLACK_WM/Natural_Earth_SERVICE_BLACK_WM/MapServer");
			this.esriMap_.addLayer(this.basemapLayer);
			
			var type = '', config = null;
			
			for (type in spec.baseLayer) {
				if (spec.baseLayer.hasOwnProperty(type)) {
					config = spec.baseLayer[type];
					break;
				}
			}
	// 
			if (!config) {
				//Do nothing				
			} else {
				config.options = config.options || {};
				config.options.isBaseLayer = true;
				
				var resolvedType = tileTypeAliases[type] || type;
	//
				if (MapTileLayer[resolvedType]) {
					this.addLayer( MapTileLayer[resolvedType], {}, config );
				} else {
					aperture.log.warn('WARNING: unrecognized map base layer type: '+ type);
					//Do nothing
				}
			}
			
			// Add mouse event handlers that pass click and dblclick events
			// through to layer event handers
			var that = this,
				handler = function( event ) {
					that.trigger(event.type, {
						eventType: event.type
					});
				};
	//
			// XXX Set an initial viewpoint so OpenLayers doesn't whine
			// If we don't do this OpenLayers dies on nearly all lat/lon and pixel operations
//					this.zoomTo(0,0,1);
//			//
			this.esriMap_.on('zoom-end', function() {
				notifyZoom.apply(that);
			});
			this.esriMap_.on('pan-end', function() {
				notifyPan.apply(that);
			});
		},
	//
		/**
		 * @private
		 * The map requires a DOM render context
		 */
		canvasType : aperture.canvas.DIV_CANVAS,
	//
		/**
		 * Zooms to the max extent of the map.
		 */
		zoomToMaxExtent: function() {
			//Do not know how to implement this in ESRI
			//this.olMap_.zoomToMaxExtent();
		},
		
		setOpacity: function(opacity) {
			if (this.basemapLayer) {
				this.basemapLayer.setOpacity(opacity);
			}
		},
		
		getOpacity : function() {
			return this.basemapLayer ? this.basemapLayer.opacity : -1;
		},
		
		on: function(eventType, handler) {
			return this.esriMap_.on(eventType, handler);
		},
		
		
		getExtent: function() {
			var bounds = null;
			if (this.esriMap_.extent) {
				bounds = {};
				bounds.left = this.esriMap_.extent.xmin;
				bounds.bottom = this.esriMap_.extent.ymin;
				bounds.right = this.esriMap_.extent.xmax;
				bounds.top = this.esriMap_.extent.ymax;
			}
			return bounds;
		},
		
		/**
		 * Zooms in one zoom level, keeps center the same.
		 */
		zoomIn: function() {
			var maxZoom = this.esriMap_.getMaxZoom();
			var currentZoom = this.esriMap_.getZoom();
			if ((maxZoom !== -1) && (currentZoom < maxZoom)) {
				this.esriMap_.setZoom(currentZoom + 1);
			}			
		},
	//
		/**
		 * Zooms out one zoom level, keeps center the same (if possible).
		 */
		zoomOut: function() {
			var minZoom = this.esriMap_.getMinZoom();
			var currentZoom = this.esriMap_.getZoom();
			if ((minZoom !== -1) && (currentZoom > minZoom)) {
				this.esriMap_.setZoom(currentZoom - 1);
			}
		},
	//
		/**
		 * Returns the zoom level as an integer.
		 */
		getZoom: function() {
			return this.esriMap_.getZoom();
		},
	//
		/**
		 * Sets the map extents give a center point in lon/lat and a zoom level
		 * Always accepts center as lon/lat, regardless of map's projection
		 * @param lat latitude to zoom to
		 * @param lon longitude to zoom to
		 * @param zoom zoom level (map setup dependent)
		 */
		zoomTo : function( lat, lon, zoom ) {
			var mapPoint = new Point( lon, lat, apiProjection );
			this.esriMap_.centerAndZoom(mapPoint, zoom);
		},
	//
		/**
		 * Sets visible extents of the map in lat/lon (regardless of current coordinate
		 * system)
		 * @param left left longitude of extent
		 * @param top top latitude of extent
		 * @param right right longitude of extent
		 * @param bottom bottom latitude of extent
		 */
		setExtents : function( left, top, right, bottom ) {
			var extent = new Extent(left, bottom,right, top , new SpatialReference({ wkid: 4326 })); 
			this.esriMap_.setExtent(extent);
		}
	});
	//
	/**
	 * @private
	 */
	// MapVizletLayer is currently documented as Map, since it does not currently function as a non-vizlet layer.
	var EsriMap = aperture.vizlet.make( EsriMapVizletLayer );
	ns.Map = EsriMap;
	//
	//
	/*
	 * Register for config notification
	 */
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				// override local defaults with any configured defaults.
				util.extend( defaultMapConfig, config['aperture.map'].defaultMapConfig );
			}
	//
			aperture.log.info('Map configuration set.');
		}
	});
}

	// load the esri map implementation if the default mapType is configured to be esri.
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				mapType = config['aperture.map'].defaultMapConfig.mapType;
				
				if ((mapType && mapType.toLowerCase()) === 'esri') {
					esriMaps();
				}
			}
		}
	});
	
	return ns;
}(aperture.geo || {}));

