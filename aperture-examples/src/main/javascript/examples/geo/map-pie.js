define(function() { return function() { //START-EXAMPLE
var data = [
	{name:'Honolulu', lon:-157.1, lat:21.3, respondents: 500000, responses: [
		{response:'Strongly Agree', percent:12},
		{response:'Agree', percent:20},
		{response:'Undecided', percent:43},
		{response:'Disagree', percent:15},
		{response:'Strongly Disagree', percent:10}
		]},
	{name:'Toronto', lon:-79.8, lat:43.4, respondents: 650000, responses: [
		{response:'Strongly Agree', percent:16},
		{response:'Agree', percent:40},
		{response:'Undecided', percent:32},
		{response:'Disagree', percent:10},
		{response:'Strongly Disagree', percent:2}
		]},
	{name:'Vancouver', lon:-123, lat:49, respondents: 220000, responses: [
		{response:'Strongly Agree', percent:25},
		{response:'Agree', percent:35},
		{response:'Undecided', percent:25},
		{response:'Disagree', percent:10},
		{response:'Strongly Disagree', percent:5}
		]},
	{name:'Mexico City', lon:-99.07, lat:19.5, respondents: 100000, responses: [
		{response:'Strongly Agree', percent:5},
		{response:'Agree', percent:17},
		{response:'Undecided', percent:23},
		{response:'Disagree', percent:25},
		{response:'Strongly Disagree', percent:30}
		]}
];

// Create the map in the DOM
var map = new aperture.geo.Map('#map');

// Create a content position layer
var locations = map.addLayer( aperture.geo.MapNodeLayer );
locations.map('latitude').from('lat');
locations.map('longitude').from('lon');
locations.all(data);

// value ranges
var percentRange = new aperture.Scalar('Percent', [0, 100]);
var totalRange = new aperture.Scalar('Number of Respondents', [0, 650000]);

// simple color definitions.
var agree = new aperture.Color( 'good' ),
	unsure = new aperture.Color( '#eee' ),
	disagree = new aperture.Color( 'red' );

// create the ordinal mapping between responses and colors
var responseMapping = new aperture.Ordinal('Response', [
	'Strongly Agree',
	'Agree',
	'Undecided',
	'Disagree',
	'Strongly Disagree'
]).mapKey([
	agree,
	agree.blend('black', 0.5),
	unsure,
	disagree.blend('black', 0.25),
	disagree.blend('black', 0.65)
]);

//Create a location layer
var pies = locations.addLayer( aperture.RadialLayer );
pies.map('opacity').asValue('0.75');
pies.map('radius').from('respondents').using(totalRange.mapKey([5, 40]));
pies.map('base-radius').asValue(20);
pies.map('sector-count').from('responses.length');
pies.map('sector-angle').from('responses[].percent').using(percentRange.mapKey([0, 360]));
pies.map('fill').from('responses[].response').using(responseMapping);

var iconLayer = locations.addLayer( aperture.IconLayer );
iconLayer.map('type').asValue('person');
iconLayer.map('attributes').asValue({role: 'business'});

/*
 * Create a "Set" containing the hovered response
 * Cause all wedges of this type to grow on hover
 */
var hover = new aperture.Set( 'responses[].response' );
pies.map('radius').filter( hover.scale(1.2) );

pies.on('mouseover', function(event){
	// Given the data object and the index into the data, get the response label
	var response = event.data.responses[event.index[0]].response;
	
	// Add to highlight group
	if (hover.add(response)) {
		$('#hover').html( response );
		pies.all().redraw(new aperture.Transition(150));
	}
});
pies.on('mouseout', function(event){
	// Clear highlight group
	if (hover.clear()) {
		$('#hover').html('');
		pies.all().redraw(new aperture.Transition(150));
	}
});

/*
 * Create a selection "Set".  Clicking on a pie selects it, clicking
 * on another pie or the map background deselects.
 */
var selection = new aperture.Set();
pies.map('opacity').filter( selection.constant( 1 ) );
iconLayer.map('format').asValue('svg');

locations.on('click', function (event) {
	// Clicked on pie, select it
	var wasSel = selection.clear();
	selection.add(event.data);
	
	locations.all().where(wasSel).and(event.node).redraw();
	event.node.toFront();

	// consume. don't let this propogate to the map below.
	return true;
});

map.on('click', function(event){
	// Clicked on map, deselect everything
	var wasSel = selection.clear();
	locations.all().where(wasSel).redraw();
});


//Zoom to the area of the world with the data
map.zoomTo( 35, -120, 3 );

map.all().redraw();

//END-EXAMPLE
};});
