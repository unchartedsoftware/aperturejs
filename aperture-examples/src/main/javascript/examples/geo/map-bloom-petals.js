define(function() { return function() { //START-EXAMPLE
// Create the OpenLayers map, add to DOM
var map = new OpenLayers.Map({
    div: "map",
    projection: new OpenLayers.Projection("EPSG:900913"),
    center: new OpenLayers.LonLat(23, 2).transform('EPSG:4326', 'EPSG:900913'),
    zoom: 3,
    layers: [new OpenLayers.Layer.TMS( "my-tms", 'http://aperture.oculusinfo.com/map-world-graphite/', {
				'layername': 'world-graphite', 'type': 'png'})]
});

//Create a content position layer
var locations = new aperture.geo.ol.NodeLayer();
map.addLayer(locations.olLayer);

locations.map('latitude').from('lat');
locations.map('longitude').from('long');

// value ranges
var indicators = [],
	normalized = new aperture.Scalar('Relative Indicator', [0,1]);

// construct the petal layer
var petals = locations.addLayer( aperture.RadialLayer );
petals.map('opacity').asValue('0.75');
petals.map('form').asValue('bloom');
petals.map('series-count').asValue(2);
petals.map('stroke').from(function(sector, series) {
	return ['none','#565'][series];
});

petals.map('radius').from(function(sector, series) {
	return indicators[sector].map(this.indicators[sector].values[series].value);
}).using(normalized.mapKey([10,50]));

var decline = '#630',
	growth = new aperture.Scalar('Spectrum').mapKey(
		[new aperture.Color('#5a2'), new aperture.Color('#ee3')]);

petals.map('fill').from(function(sector, series) {
	var record = this.indicators[sector].values;

	return (!series && record[1].value < record[0].value)? decline : '#6b2';//growth.map(sector);
});

petals.map('opacity').from(function(sector, series) {
	var record = this.indicators[sector].values;

	return (series && record[1].value > record[0].value)? 0.9
		: (!series && record[1].value < record[0].value)? 0.35 : 0.15;
});

var hover = new aperture.Set( 'indicators[].name' );
petals.map('stroke-width').asValue(1).filter( hover.scale(2) );

petals.on('mouseover', function(event){
	// Given the data object and the index into the data, get the response label
	var indicator = event.data.indicators[event.index[0]].name;

	// Add to highlight group
	if (hover.add(indicator)) {
		$('#hover').html( event.data.country + ': ' + indicator );
		petals.all().redraw();
	}
});
petals.on('mouseout', function(event){
	$('#hover').html('');
	// Clear highlight group
	if (hover.clear()) {
		petals.all().redraw();
	}
});


//load data
$.getJSON("data/devindicators.json", function(data){
	aperture.util.forEach( data, function(country) {
		aperture.util.forEach( country.indicators, function(indicator, index) {
			var scalar = indicators[index];

			if (!scalar) {
				indicators[index] = scalar = new aperture.Scalar(name);
			}

			// expand to encompass both years.
			scalar.expand(indicator.values[0].value);
			scalar.expand(indicator.values[1].value);

		});
	});

	petals.map('sector-count').asValue(indicators.length);
	growth.from().expand([0, indicators.length-1]);

	locations.all( data ).redraw();
});

//END-EXAMPLE
};});
