/**
 * Source: map.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture Map APIs
 */

/**
 * @namespace Geospatial vizlet layers. If not used the geospatial package may be excluded.
 * @requires OpenLayers or ESRI
 */
aperture.geo = (
/** @private */
function(ns) {
	if (!window.OpenLayers) {
		aperture.log.info('OpenLayers js not present. Skipping default map api implementation.');
		return ns;
	}

	aperture.log.info('Loading OpenLayers map api implementation...');

	// util is always defined by this point
	var util = aperture.util, ol = 'OPEN_LAYERS_CANVAS';

	// Searchers through a set of layers to find
	// the base layer's index.
	var getBaseLayerIndex = function(map) {
			var i, layers = map.layers;
			for(i=0; i < layers.length; i++){
					if(layers[i].isBaseLayer==true){
							return(i);
					}
			}
	};

	// if basic Canvas ever implements stuff for real we should override where it makes sense
	var OpenLayersCanvas = aperture.canvas.Canvas.extend( 'aperture.geo.OpenLayersCanvas', {
			init : function(root, map) {
				aperture.canvas.Canvas.prototype.init.call(this, root);
				this.olMap_ = map;
			}
		}
	);

	aperture.canvas.handle( ol, OpenLayersCanvas );

		/**
		 * @private
		 * Base of Map Layer classes
		 */
	var OpenLayersMapLayer = aperture.Layer.extend( '[private].OpenLayersMapLayer', {
		init : function(spec, mappings) {
			aperture.Layer.prototype.init.call(this, spec, mappings);

			if (spec.extent) {
				spec.extent = OpenLayers.Bounds.fromArray(spec.extent);
			}
			if ( !this.canvas_ ) {
				throw new Error('Map layer must be constructed by a parent layer through an addLayer call');
			}
			if (this.canvas_.olMap_ === undefined) {
				this.canvas_.olMap_ = spec.parent.olMap_;
			}
		},

		/**
		 * OpenLayers layer
		 */
		olLayer_ : null, // Assumption that a single OpenLayers layer can be used for all rendering


		/**
		 * Canvas type is OpenLayers
		 */
		canvasType : ol,

		/**
		 * @private
		 */
		data : function(value) {
			if( value ) {
				throw new Error('Cannot add data to a base map layer');
			}
		},

		/**
		 * @private
		 */
		render : function(changeSet) {
			// Must force no render logic so the layer doesn't try to monkey around with data
		},

		/**
		 * @private
		 */
		remove : function() {
			aperture.Layer.prototype.remove.call(this);

			// hook into open layers to remove
			this.canvas_.olMap_.removeLayer(this.olLayer_);
		}
	});


	// deprecated
	var tileTypeAliases = {
			tms : 'TMS',
			wms : 'WMS'
		};


	var MapTileLayer = OpenLayersMapLayer.extend( 'aperture.geo.MapTileLayer',
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
			OpenLayersMapLayer.prototype.init.call(this, spec, mappings);

			spec.options = spec.options || {};

			if (spec.options.isBaseLayer == null) {
				spec.options.isBaseLayer = false;
			}
		}
	});

		ns.MapTileLayer = MapTileLayer;

	ns.MapTileLayer.TMS = MapTileLayer.extend( 'aperture.geo.MapTileLayer.TMS',
	/** @lends aperture.geo.MapTileLayer.TMS# */
	{
		/**
		 * @class A Tile Mapping Service (TMS) specification. TMS relies on client information to
		 * be supplied about extents and available zoom levels but can be simply stood up
		 * as a service by deploying a static set of named tiles.
		 *
		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 *
		 * @example
		 * var spec = {
		 *     name : 'My TMS Layer',
		 *     url : 'http://mysite/mytiles/',
		 *     options : {
		 *         layername: 'mynamedlayer',
		 *         type: 'png'
		 *     }
		 * };
		 *
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      options : {
		 *          'projection': 'EPSG:900913',
		 *          'displayProjection': 'EPSG:900913',
		 *          'units': 'm',
		 *          'numZoomLevels': 9,
		 *          'maxExtent': [
		 *              -20037500,
		 *              -20037500,
		 *              20037500,
		 *              20037500
		 *           ]
		 *      },
		 *      baseLayer : {
		 *          TMS: spec
		 *      }
		 * });
		 *
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.TMS, {}, spec );
		 *
		 * @param {Object} spec
		 *      a specification object
		 *
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *
		 * @param {String} spec.url
		 *      the source url for the tiles.
		 *
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *
		 * @param {String} spec.options.layername
		 *      required name of the served layer to request of the source tile data.
		 *
		 * @param {String} spec.options.type
		 *      required type of the images in the source tile data.

		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer.TMS(
				spec.name || 'TMS ' + this.uid,
								[spec.url],
								spec.options
			);

			this.canvas_.olMap_.addLayer(this.olLayer_);
		}
	});


	ns.MapTileLayer.WMS = MapTileLayer.extend( 'aperture.geo.MapTileLayer.WMS',
	/** @lends aperture.geo.MapTileLayer.WMS# */
	{
		/**
		 * @class A Web Map Service (WMS) specification. TMS relies on client information to
		 * be supplied about extents and available resolutions but are simple to stand
		 * up as a service by deploying a static set of named tiles.
		 *
		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 *
		 * @example
		 * var spec = {
		 *     name: 'OSGeo WMS',
		 *     url:  'http://vmap0.tiles.osgeo.org/wms/vmap0',
		 *     options: {
		 *         layers : 'basic',
		 *         projection : 'EPSG:4326',
		 *         displayProjection : 'EPSG:4326'
		 *     }
		 * };
		 *
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      baseLayer : {
		 *          WMS: spec
		 *      }
		 * });
		 *
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.WMS, {}, spec );
		 *
		 * @param {Object} spec
		 *      a specification object
		 *
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *
		 * @param {String} spec.url
		 *      the source url for the tiles.
		 *
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *
		 * @param {String} spec.options.layers
		 *      a single layer name or comma separated list of served layer names to request.
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer.WMS(
				spec.name || 'WMS ' + this.uid,
								spec.url,
								spec.options
			);

			this.canvas_.olMap_.addLayer(this.olLayer_);
		}
	});



	ns.MapTileLayer.Google = MapTileLayer.extend( 'aperture.geo.MapTileLayer.Google',
	/** @lends aperture.geo.MapTileLayer.Google# */
	{
		/**
		 * @class A Google Maps service. Use of this layer requires the inclusion of the
		 * <a href="https://developers.google.com/maps/documentation/javascript/" target="_blank">Google Maps v3 API</a> script
		 * and is subject to its terms of use. Map options include dynamically
		 * <a href="https://developers.google.com/maps/documentation/javascript/styling" target="_blank">styled maps</a>.
		 *
		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 *
		 * @example
		 * var spec = {
		 *     name: 'My Layer',
		 *     options: {
		 *          type: google.maps.MapTypeId.TERRAIN
		 *     }
		 * };
		 *
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      baseLayer : {
		 *          Google: spec
		 *      }
		 * });
		 *
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.Google, {}, spec );
		 *
		 * // EXAMPLE THREE: create a styled map
		 * var map = new Map({
		 *      baseLayer : {
		 *          Google: {
		 *              name: 'My Layer',
		 *              options: {
		 *                  type: 'styled',
		 *                  style: [{
		 *                      stylers: [
		 *                          { saturation: -80 }
		 *                      ]
		 *                  }]
		 *              }
		 *          }
		 *      }
		 * });
		 *
		 * @param {Object} spec
		 *      a specification object
		 *
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *
		 * @param {google.maps.MapTypeId|'styled'} spec.options.type
		 *      a Google defined layer type to request.
		 *
		 * @param {Array} spec.options.style
		 *      a list of Google defined
		 *      <a href="https://developers.google.com/maps/documentation/javascript/styling" target="_blank">style rules</a>.
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer.Google(
				spec.name || 'Google ' + this.uid,
				spec.options
			);

			this.canvas_.olMap_.addLayer(this.olLayer_);

			if (spec.options.type == 'styled') {
				var styledMapType = new google.maps.StyledMapType(spec.options.style, {name: 'Styled Map'});

				this.olLayer_.mapObject.mapTypes.set('styled', styledMapType);
				this.olLayer_.mapObject.setMapTypeId('styled');
			}
		}
	});



	ns.MapTileLayer.Bing = MapTileLayer.extend( 'aperture.geo.MapTileLayer.Bing',
	/** @lends aperture.geo.MapTileLayer.Bing# */
	{
		/**
		 * @class A Bing (Microsoft) map service. Use of a Bing map layer
		 * <a href="http://bingmapsportal.com/" target="_blank">requires a key</a>.

		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 *
		 * @example
		 * var spec = {
		 *     name: 'My Layer',
		 *     options: {
		 *          type: 'Road',
		 *          key: 'my-license-key-here'
		 *     }
		 * };
		 *
		 * // EXAMPLE ONE: create a map and explicitly set the base tile layer
		 * var map = new Map({
		 *      baseLayer : {
		 *          Bing: spec
		 *      }
		 * });
		 *
		 * // EXAMPLE TWO: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.Bing, {}, spec );
		 *
		 * @param {Object} spec
		 *      a specification object
		 *
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *
		 * @param {Object} spec.options
		 *      implementation specific options.
		 *
		 * @param {String='Road'|'Aerial'|...} spec.options.type
		 *      the name of a Bing defined layer type to request.
		 *
		 * @param {String} spec.options.key
		 *      a client license key, obtained from Microsoft.
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			spec.options.name = spec.options.name || spec.name || 'Bing ' + this.uid;

			this.olLayer_ = new OpenLayers.Layer.Bing(
				spec.options
			);

			this.canvas_.olMap_.addLayer(this.olLayer_);
		}
	});


	ns.MapTileLayer.Image = MapTileLayer.extend( 'aperture.geo.MapTileLayer.Image',
	/** @lends aperture.geo.MapTileLayer.Image# */
	{
		/**
		 * @class A single image.

		 * @augments aperture.geo.MapTileLayer
		 * @constructs
		 *
		 * @description MapTileLayers may be configured as base layers in
		 * {@link aperture.geo.Map Map} construction,
		 * or later added as overlay layers by calling
		 * {@link aperture.PlotLayer#addLayer addLayer} on a parent layer.
		 * This layer constructor is never called directly.
		 *
		 * @example
		 * var spec = {
		 *     name: 'My Layer',
		 *     url: 'http://mysite/myimage.png',
		 *     size: [1024, 1024], // width and height in pixels
		 *     extent: [
		 *        -20037500, // left
		 *        -20037500, // bottom
		 *         20037500, // right
		 *         20037500  // top
		 *     ]
		 * };
		 *
		 * // EXAMPLE: overlay a layer on a map with an existing base layer
		 * map.addLayer( aperture.geo.MapTileLayer.Image, {}, spec );
		 *
		 * @param {Object} spec
		 *      a specification object
		 *
		 * @param {String} spec.name
		 *      the local name to give the layer.
		 *
		 * @param {String} spec.url
		 *      the source url for the image.
		 *
		 * @param {Array(Number)} spec.size
		 *      an array of two numbers specifying width and height
		 *      of the image in pixels.
		 *
		 * @param {Array(Number)} spec.extent
		 *      an array of numbers specifying the geographical
		 *      bounding region of the image. The expected order is: [left, bottom, right, top]
		 * };
		 */
		init : function(spec, mappings) {
			MapTileLayer.prototype.init.call(this, spec, mappings);

			var options = spec.options;

			if (spec.size) {
				spec.size = new OpenLayers.Size(spec.size[0], spec.size[1]);
			}

			if (!options.isBaseLayer) {

				// clone from base layer
				if (!options.resolutions) {
					options.resolutions = this.canvas_.olMap_.layers[getBaseLayerIndex(this.canvas_.olMap_)].resolutions;
				}
				if (!options.maxResolution) {
					options.maxResolution = options.resolutions[0];
				}

				if (spec.projection) {
					var tmpFromProjection = new OpenLayers.Projection(spec.projection);
					var tmpToProjection = new OpenLayers.Projection(this.canvas_.olMap_.projection.projCode);
					spec.extent = spec.extent.clone().transform(tmpFromProjection, tmpToProjection);
				}
					}

			this.olLayer_ = new OpenLayers.Layer.Image(
							spec.name || 'Image ' + this.uid,
							spec.url,
							spec.extent,
							spec.size,
							options
					);

			this.canvas_.olMap_.addLayer(this.olLayer_);
		}
	});

		/**
		 * @private
		 * Blank Layer
		 *
		 * Needed an option to have an empty baselayer, especially good if the
		 * tiles are not geographically-based.
		 * This layer is not exposed right now, may never be.  Used internally by map layer
		 */
	var BlankMapLayer = OpenLayersMapLayer.extend( '[private].BlankMapLayer', {
		init : function(spec, mappings) {
			OpenLayersMapLayer.prototype.init.call(this, spec, mappings);

			this.olLayer_ = new OpenLayers.Layer('BlankBase');
			this.olLayer_.isBaseLayer = true; // OpenLayers.Layer defaults to false.
			this.olLayer_.extent = spec.baseLayer.extent || spec.options.extent || spec.options.maxExtent;

			this.canvas_.olMap_.addLayer(this.olLayer_);
		}
	});


	/**********************************************************************/


	var MapGISLayer = aperture.geo.ol.VectorLayer.extend( 'aperture.geo.MapGISLayer',
	/** @lends aperture.geo.MapGISLayer# */
	{
		/**
		 * @class An Aperture Map layer that sources GIS data from an external data source such
		 * as KML, GML, or GeoRSS.  Visual properties of this layer are mapped like any
		 * other layer where the data available for mapping are attributes of the features
		 * loaded from the external source.
		 *
		 * @augments aperture.geo.ol.VectorLayer
		 * @constructs
		 *
		 * @description Layer constructors are invoked indirectly by calling
		 *  {@link aperture.PlotLayer#addLayer addLayer} on a parent layer with the following specifications...
		 *
		 * @param {Object} spec
		 *      a specification object describing how to construct this layer
		 *
		 * @param {String} spec.url
		 *      the URL of the external data source to load
		 *
		 * @param {String='KML'|'GML'|'GeoRSS'} spec.format
		 *      indicates the type of data that will be loaded from the	provided URL.
		 *      One of 'KML', 'GML', or 'GeoRSS'.
		 *
		 * @param {String} [spec.projection]
		 *      an optional string specifying the projection of the data contained in
		 *      the external data file.  If not provided, WGS84 (EPSG:4326) is assumed.
		 *
		 */
		init : function(spec, mappings) {
			var name = spec.name || 'External_' + this.uid;

			// Create layer for KML, GML, or GeoRSS formats.
			var options = {
				strategies: [new OpenLayers.Strategy.Fixed()],
				projection: spec.projection || apiProjection.projCode,
				protocol: new OpenLayers.Protocol.HTTP({
						url: spec.url,
						format: new OpenLayers.Format[spec.format]({
								extractAttributes: true,
								maxDepth: 2
						})
				})
			};

			spec.olLayer = new OpenLayers.Layer.Vector( name, options );
			aperture.geo.ol.VectorLayer.prototype.init.call(this, spec, mappings);

			if( this.canvas_ ) {
				this.canvas_.olMap_.addLayer(this.olLayer);
			}
		},

		canvasType : ol
	});

	ns.MapGISLayer = MapGISLayer;



	/**********************************************************************/



	var MapNodeLayer = aperture.geo.ol.BaseMapNodeLayer.extend( 'aperture.geo.MapNodeLayer',
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
		 * @augments aperture.geo.ol.BaseMapNodeLayer
		 * @constructs
		 * @factoryMade
		 */
		init: function(spec, mappings) {
			spec = spec || {};

			var olLayer = new aperture.geo.ol.ContainerOLLayer(spec.name || 'aperture-ol-bridge', {});
			spec = util.extend(spec, {
				olLayer: olLayer
			});

			aperture.geo.ol.BaseMapNodeLayer.prototype.init.call(this, spec, mappings);

			// because we declare ourselves as an open layers canvas layer this will be
			// the parenting open layers canvas, which holds the map reference. Note however that
			// since we are really a vector canvas layer we override that a ways below.
			var mapCanvas = this.canvas_;

			if (!mapCanvas.olMap_) {
				aperture.log.error('MapNodeLayer must be added to a map.');
				return;
			}

			// create the layer and parent it
			mapCanvas.olMap_.addLayer(olLayer);
			olLayer.setZIndex(999); // Change z as set by OpenLayers to be just under controls

			// because we parent vector graphics but render into a specialized open layers
			// canvas we need to help bridge the two by pre-creating this canvas with the
			// right parentage.
			var OpenLayersVectorCanvas = aperture.canvas.type(aperture.canvas.VECTOR_CANVAS);

			this.canvas_ = new OpenLayersVectorCanvas( olLayer.contentFrame );
			mapCanvas.canvases_.push( this.canvas_ );

			var that = this;
			olLayer.onFrameChange = function(newBounds) {
				// The OpenLayers layer has changed the canvas, must redraw all contents
				// TODO Pass in appropriate "change" hint so only translation need be updated
				that.all().redraw();
			};
		},

		/**
		 * @private
		 */
		canvasType : ol,

		/**
		 * Given a location returns its pixel coordinates in the viewPort space
		 */
		getXY: function(lon,lat) {

			var pt = new OpenLayers.LonLat(lon, lat);

			// Reproject to map's projection
			if( this._layer.map.projection != apiProjection ) {
				pt.transform(apiProjection, this._layer.map.projection);
			}
			return this._layer.map.getViewPortPxFromLonLat(pt);
		},

		getExtent: function() {
			return this._layer.getLonLatExtent();
		}
	});

	ns.MapNodeLayer = MapNodeLayer;


	/************************************************************************************/



	/*
	 * The projection that the API expects unless instructed otherwise.  All layers
	 * and data are to be expressed in this projection.
	 */
	var apiProjection = new OpenLayers.Projection('EPSG:4326');


	/*
	 * Default map options
	 */
	var defaultMapConfig = {
		options : {
			projection : apiProjection,
			displayProjection : apiProjection
		}
	};

	/**
	 * Call on zoom completion.
	 */
	function notifyZoom() {
		this.trigger('zoom', {
			eventType : 'zoom',
			layer : this
		});
	}

	function notifyPan() {
		this.trigger('panend', {
			eventType : 'panend',
			layer : this
		});
	}

	var MapVizletLayer = aperture.PlotLayer.extend( 'aperture.geo.MapVizletLayer',
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

			// clone - we will be modifying, filling in defaults.
			this.spec = spec = util.extend({}, spec);

			// pass clone onto parent.
			aperture.PlotLayer.prototype.init.call(this, spec, mappings);


			// PROCESS SPEC
			// Clone provided options and fill in defaults
			spec.options = util.extend({}, defaultMapConfig.options || {}, spec.options);

			// Ensure projections are in OpenLayers class format
			if( util.isString(spec.options.projection) ) {
				spec.options.projection = new OpenLayers.Projection(spec.options.projection);
			}
			if( util.isString(spec.options.displayProjection) ) {
				spec.options.displayProjection = new OpenLayers.Projection(spec.options.displayProjection);
			}

			// Ensure maxExtent is an OpenLayer bounds object
			if( util.isArray(spec.options.maxExtent) ) {
				spec.options.maxExtent = OpenLayers.Bounds.fromArray(spec.options.maxExtent);
			}

			// If map to have no controls, initialize with new empty array, not array from defaultMapConfig
			if(util.isString(spec.options.controls)||(util.isArray(spec.options.controls)&&(spec.options.controls.length==0))){
				spec.options.controls = [];
			}

			// Clone provided base layer information and fill in defaults
			spec.baseLayer = util.extend({}, defaultMapConfig.baseLayer || {}, spec.baseLayer);

			// CREATE MAP
			// Create the map without a parent
			this.olMap_ = new OpenLayers.Map( spec.options );
			this.canvas_.canvases_.push(new OpenLayersCanvas( this.canvas_.root(), this.olMap_ ) );


			var type = '', config = null;

			for (type in spec.baseLayer) {
				if (spec.baseLayer.hasOwnProperty(type)) {
					config = spec.baseLayer[type];
					break;
				}
			}

			if (!config) {
				this.addLayer( BlankMapLayer, {}, spec );

			} else {
				config.options = config.options || {};
				config.options.isBaseLayer = true;

				var resolvedType = tileTypeAliases[type] || type;

				if (MapTileLayer[resolvedType]) {
					this.addLayer( MapTileLayer[resolvedType], {}, config );
				} else {
					aperture.log.warn('WARNING: unrecognized map base layer type: '+ type);
					this.addLayer( BlankMapLayer, {}, spec );
				}
			}

			// Add mouse event handlers that pass click and dblclick events
			// through to layer event handers
			var that = this,
				handler = function( event ) {
					that.trigger(event.type, {
						eventType: event.type
					});
				},
				mouseHandler_ = new OpenLayers.Handler.Click(
					this,
					{
						'click' : handler,
						'dblclick' : handler
					},
					{ map: this.olMap_ }
				);
			mouseHandler_.activate();

			// XXX Set an initial viewpoint so OpenLayers doesn't whine
			// If we don't do this OpenLayers dies on nearly all lat/lon and pixel operations
			this.zoomTo(0,0,1);

			this.olMap_.events.register('zoomend', this, notifyZoom);
			this.olMap_.events.register('moveend', this, notifyPan);
			this.olMap_.render(this.canvas_.root());
		},

		/**
		 * @private
		 * The map requires a DOM render context
		 */
		canvasType : aperture.canvas.DIV_CANVAS,

		/**
		 * Zooms to the max extent of the map.
		 */
		zoomToMaxExtent: function() {
			this.olMap_.zoomToMaxExtent();
		},

		/**
		 * Zooms in one zoom level, keeps center the same.
		 */
		zoomIn: function() {
			this.olMap_.zoomIn();
		},

		/**
		 * Zooms out one zoom level, keeps center the same (if possible).
		 */
		zoomOut: function() {
			this.olMap_.zoomOut();
		},

		/**
		 * Returns the zoom level as an integer.
		 */
		getZoom: function() {
			return this.olMap_.getZoom();
		},

		/**
		 * Sets the map extents give a center point in lon/lat and a zoom level
		 * Always accepts center as lon/lat, regardless of map's projection
		 * @param lat latitude to zoom to
		 * @param lon longitude to zoom to
		 * @param zoom zoom level (map setup dependent)
		 */
		zoomTo : function( lat, lon, zoom ) {
			var center = new OpenLayers.LonLat(lon,lat);
			if( this.olMap_.getProjection() !== apiProjection.projCode ) {
				center.transform(apiProjection, this.olMap_.projection);
			}
			this.olMap_.setCenter( center, zoom );
		},

		/**
		 * Smoothly pans the map to a given center point in lat/lon.
		 * @param lat latitude to pan to
		 * @param lon longitude to pan to
		 */
		panTo : function( lat, lon ) {
				var center = new OpenLayers.LonLat(lon,lat);
				if( this.olMap_.getProjection() !== apiProjection.projCode ) {
						center.transform(apiProjection, this.olMap_.projection);
				}
				this.olMap_.panTo( center );
		},

		/**
		 * Sets visible extents of the map in lat/lon (regardless of current coordinate
		 * system)
		 * @param left left longitude of extent
		 * @param top top latitude of extent
		 * @param right right longitude of extent
		 * @param bottom bottom latitude of extent
		 */
		setExtents : function( left, top, right, bottom ) {
			var bounds = new OpenLayers.Bounds(left,bottom,right,top);
			if( this.olMap_.getProjection() !== apiProjection.projCode ) {
				bounds.transform(apiProjection, this.olMap_.projection);
			}
			this.olMap_.zoomToExtent( bounds );
		}
	});

	/**
	 * @private
	 */
	// MapVizletLayer is currently documented as Map, since it does not currently function as a non-vizlet layer.
	var Map = aperture.vizlet.make( MapVizletLayer );
	ns.Map = Map;


	/*
	 * Register for config notification
	 */
	aperture.config.register('aperture.map', function(config) {
		if( config['aperture.map'] ) {
			if( config['aperture.map'].defaultMapConfig ) {
				// override local defaults with any configured defaults.
				util.extend( defaultMapConfig, config['aperture.map'].defaultMapConfig );
			}

			aperture.log.info('Map configuration set.');
		}
	});

	return ns;
}(aperture.geo || {}));
