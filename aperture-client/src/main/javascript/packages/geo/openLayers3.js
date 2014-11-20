/**
 * Source: openLayers3.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Aperture OpenLayers 3.x integration APIs
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

	if (!window.ol) {
		aperture.log.info('OpenLayers 3 js not present. Skipping OL3 map api implementation.');
		return ns;
	}


	/**********************************************************************/


	/**
	 * @private
	 *
	 * Openlayers Overlay subclass that positions a
	 */
	var CoveringOverlay = function( options ) {
		options = options || {};

		// Create host element
		options.element = document.createElement('div');
		options.positioning = 'center-center';

		ol.Overlay.call(this, options);

		// Allow mouse events to hit map in areas not covered by aperture visuals
		this.getElement().style.pointerEvents = 'none';
		this.getElement().parentElement.style.pointerEvents = 'none';

		// When map is set/changed register moveend listener
		this.on('change:map', function() {
			var map = this.getMap();
			if (this.moveEndKey) {
				map.getView().unByKey( this.zoomKey );
				map.unByKey( this.moveEndKey );
				this.moveEndKey = null;
				this.zoomKey = null;
			}
			if (map) {
				this.moveEndKey = map.on('moveend', this.postMove, this);
				this.zoomKey = map.getView().on('change:resolution', this.preMove, this);
				// Set initial state
				this.postMove();
			}
		}, this);
	};

	ol.inherits(CoveringOverlay, ol.Overlay);

	/**
	 * @private
	 * Specifies the amount of canvas to include beyond the visible extents
	 * of the map (0 = none, 1 = full visible map size in all directions)
	 */
	CoveringOverlay.prototype.overflowRatio = 1;

	CoveringOverlay.prototype.preMove = function() {
		// Hide overlay during zoom animation
		// Otherwise geo-location of features will be skewed during animation
		this.getElement().style.visibility = 'hidden';
	};

	CoveringOverlay.prototype.postMove = function() {
		var style = this.getElement().style;

		// Reshow element after hiding (presuming move was a zoom)
		style.visibility = 'visible';

		// On moveend update position of overlay to lie at center of view
		var map = this.getMap();
		var mapSize = map.getSize();

		var middleMiddle = map.getCoordinateFromPixel([mapSize[0]/2, mapSize[1]/2]);
		this.setPosition(middleMiddle);

		this.topLeftOffset = [
			mapSize[0] * this.overflowRatio,
			mapSize[1] * this.overflowRatio
		];

		// XXX Strictly not required here, only on resize
		style.width = (mapSize[0] * (this.overflowRatio*2 + 1)) + 'px';
		style.height = (mapSize[1] * (this.overflowRatio*2 + 1)) + 'px';

		if (this.onFrameChange) {
			this.onFrameChange();
		}
	}

	CoveringOverlay.prototype.getContentPixelForLonLat = function(coord) {
		var map = this.getMap();

		// First transform coord to map's coordinate system
		coord = ol.proj.transform(coord, 'EPSG:4326', map.getView().getProjection());

		var pixel = map.getPixelFromCoordinate(coord);
		return [
			pixel[0] + this.topLeftOffset[0],
			pixel[1] + this.topLeftOffset[1]
		];
	};



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
			this.olOverlay = spec.olOverlay;
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
					px = this.olOverlay.getContentPixelForLonLat([lon,lat]);
				}

				// Update the given node in place with these values
				node.position = [px[0],px[1]];
			}, this);


			// will call renderChild for each child.
			aperture.PlotLayer.prototype.render.call(this, changeSet);

		}
	});


	/**********************************************************************/


	var MapLayerVizletWrapper = aperture.vizlet.make( BaseMapNodeLayer );

	/**
	 * @class A root-level layer (cannot be contained in another vizlet/layer) that
	 * can be added to an OpenLayers v3.x map. Layers of this type contain a {@link #olOverlay}
	 * member which is a valid OpenLayers overlay and can be added to any OL map.
	 *
	 * @example
	 *
	 * var mapLayer = new aperture.geo.ol.NodeOverlay();
	 * mapLayer.map('latitude').to('lat');
	 * mapLayer.map('longitude').to('lon');
	 * myOLMap.addOverlay( mapLayer.olOverlay );
	 *
	 * @name aperture.geo.ol.NodeOverlay
	 * @augments aperture.geo.BaseMapNodeLayer
	 * @constructs
	 * @requires OpenLayers
	 */
	var NodeOverlay = function(spec, mappings) {
		// Create OL overlay that our layer will contain
		var olOverlay = new CoveringOverlay({});

		spec = aperture.util.extend(spec || {}, {
			elem: olOverlay.getElement(),
			olOverlay: olOverlay
		});

		// Create Aperture MapLayer layer itself
		var self = MapLayerVizletWrapper(spec, mappings);

		// When ol layer's frame changes, redraw owner Aperture layer
		olOverlay.onFrameChange = function() {
			self.all().redraw();
		}

		return self;
	};

	ns.NodeOverlay = NodeOverlay;

	return ns;

}(aperture.geo.ol || {}));