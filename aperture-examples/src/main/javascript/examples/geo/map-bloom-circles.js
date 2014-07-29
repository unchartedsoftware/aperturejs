define(function() { return function() { //START-EXAMPLE
// Create the map in the DOM
var map = new aperture.geo.Map('#map');

// Create a location layer
var locations = map.addLayer( aperture.geo.MapNodeLayer );
locations.map('latitude').from('latitude');
locations.map('longitude').from('longitude');

// value ranges
var totalRange = new aperture.Scalar('Total', [0, 100]);
var changeRange = new aperture.Ordinal('change', ['loss','base','gain']);

// colors
var smoggy = '#630',
	cleaner = new aperture.Color('good').blend('#333', .5);

// construct the circle layer
var bubbles = locations.addLayer( aperture.RadialLayer );
bubbles.map('base-radius').asValue(1);
bubbles.map('series-count').from('co2.length');
bubbles.map('radius').from('co2[].value').using(totalRange.mapKey([3, 80]));
bubbles.map('stroke').from(function(index) {
	return ['none','#222'][index];
});

bubbles.map('fill').from(function(index) {
	return (index && this.co2[1].value > this.co2[0].value)? smoggy
		: (!index && this.co2[1].value < this.co2[0].value)? cleaner : smoggy;
});

bubbles.map('opacity').from(function(index) {
	return (index && this.co2[1].value > this.co2[0].value)? 0.8
		: (!index && this.co2[1].value < this.co2[0].value)? 0.35 : 0.25;
});

bubbles.on('mouseover', function(event){
	$('#hover').html( 'Hovering over ' + event.data.country );
});
bubbles.on('mouseout', function(event){
	$('#hover').html('');
});

//Zoom to the area of the world with the data
map.zoomTo( 20, 25, 2 );

//load data
$.getJSON("data/co2.json", function(data){
	locations.all( data );
	map.all().redraw();
});


//END-EXAMPLE
};});
