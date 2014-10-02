define(function() { return function() { //START-EXAMPLE
// Create the OpenLayers map, add to DOM
var map = new OpenLayers.Map({
		div: "map",
		projection: new OpenLayers.Projection('EPSG:900913'),
		center: new OpenLayers.LonLat(30, 15).transform('EPSG:4326', 'EPSG:900913'),
		zoom: 4,
		layers: [new OpenLayers.Layer.TMS( 'my-tms', 'http://aperture.oculusinfo.com/map-world-graphite/', {
				'layername': 'world-graphite', 'type': 'png'})]
});

var vectorLayer = new OpenLayers.Layer.Vector('my-layer', {
	strategies: [new OpenLayers.Strategy.Fixed()],
	projection: 'EPSG:4326',
	protocol: new OpenLayers.Protocol.HTTP({
		url: 'data/sudan.kml',
		format: new OpenLayers.Format.KML({
			extractAttributes: true,
			maxDepth: 2
		})
	})
});
map.addLayer(vectorLayer);


// Use Aperture to map visual properties of the vectorLayer
var kmlLayer = new aperture.geo.ol.VectorLayer( vectorLayer );
// Data for each region in the KML file
var data = {
	'Darfur': 9,
	'South Sudan': 7,
	'North Sudan': 4
};

// Create the lookup function
var dataLookup = function() {
	return data[this.name];
};

// Map data to visual properties
var scalar = new aperture.Scalar('Heat', [0, 10]);
kmlLayer.map('stroke').asValue('#ddd');
kmlLayer.map('stroke-width').asValue(1);
kmlLayer.map('opacity').asValue(.25);
kmlLayer.map('fill').from(dataLookup).using(scalar.mapKey(
		[new aperture.Color('silver'),
		new aperture.Color('#078')]));

// Draw
kmlLayer.all().redraw();

/*
 * Create a selection "Set".  Clicking on a pie selects it, clicking
 * on another pie or the map background deselects.
 */
var selection = new aperture.Set();

kmlLayer.map('fill').filter(
		selection.constant( aperture.palette.color('selected') ) );

kmlLayer.on('click', function(event){
	// Clicked on pie, select it
	selection.clear();
	selection.add(event.data);
	kmlLayer.all().redraw();
	// handled - don't propogate to map
	return true;
});


//END-EXAMPLE
};});
