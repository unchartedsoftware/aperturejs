define(function() { return function() { //START-EXAMPLE
// Create a vizlet container
var map = new aperture.geo.Map('#map');

// Zoom to the area of the world with the data
map.zoomTo( 15, 30, 4 );

// Create kmlLayer layer
var kmlLayer = map.addLayer( aperture.geo.MapGISLayer, {}, {
	format: "KML",
	url: "data/sudan.kml"
});

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
map.all().redraw();

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

map.on('click', function(event){
	// Clicked on map, deselect everything
	if (selection.clear()) {
		kmlLayer.all().redraw();
	}
});

//END-EXAMPLE
};});
