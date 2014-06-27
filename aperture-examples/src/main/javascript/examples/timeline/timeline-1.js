define(function() { return function() { //START-EXAMPLE

var createXAxis = function(plot, order, axisOffset){
	var axisLayer = plot.xAxis(order);
	axisLayer.map('margin').asValue(30);
	axisLayer.map('visible').asValue(true);
	axisLayer.map('text-anchor').asValue('start');
	axisLayer.map('text-anchor-y').asValue('top');
	axisLayer.map('layout').asValue('top');
	axisLayer.map('tick-length').asValue(10);
	axisLayer.map('label-offset-y').asValue(4);
	axisLayer.map('label-offset-x').asValue(2);
	axisLayer.map('font-size').asValue(10);
	return axisLayer;
};
/**
 * A relatively simple timeline vizlet class, with a particular behavior and
 * appearance. Key API bits are:
 *
 * // returns the current zoom as an object with properties x, y, zoom.
 * timeline.zoom();
 *
 * // sets the current zoom as a value of 1 or greater.
 * timeline.zoom(zoom);
 *
 * // sets the current zoom center as a value from 0 - 1 in the normalized range space.
 * // (y is currently ignored)
 * timeline.zoomTo(x[, y][, zoom]);
 *
 * // listen to zoom events
 * timeline.on('zoom', handlerFn);
 */
//aperture.Timeline = aperture.vizlet.make( aperture.chart.ChartLayer, function(spec) {

//});

/**
 * Creates a timeline using an IconLayer to
 * provide the visuals for events.
 */
var createTimeLine = function(data){
	var timeline = new aperture.chart.Chart('#chartContainer');

	// size of chart
	var width = data.width || 600;
	var height = data.height || 120;

	var bandCount = 12;


	// FIND THE DATA RANGE
	var rangeY = new aperture.Scalar('vertical', [0,1]),
		rangeX = new aperture.TimeScalar('time');

	var i;

	for (i=0; i < data.band.length; i++){
		rangeX.expand(new Date(data.band[i].start));
		rangeX.expand(new Date(data.band[i].end));
	}


	// INITIALIZE THE PLOT
	timeline.mapAll({
		'width' : width,
		'height' : height,
		'color' : '#c6c4bf',
		'border-width' : 1,
		'title-spec' : {text: 'Algoma Discovery Vessel Timeline', 'font-size':12},
		'title-margin' : 20,
		'clipped' : true
	});

	// band it. This is the function that breaks the range into ticked
	// intervals and rounds it in this case. There are a number of different
	// options here, including telling it to band at a constant time interval
	// like 'Months'. See docs.
	var bandedX = rangeX.banded(bandCount);
	var mapKey = bandedX.mapKey([0,1]);
	var secBandedX = bandedX.banded({
		span : 1,
		units : bandedX.formatter().nextOrder()
	});

	//***************************
	// CONSTRUCT X-AXES
	//***************************
	// Create the primary x-axis.
	var primeXAxis = createXAxis(timeline, 0);
	primeXAxis.all(mapKey);
	// Create the secondary xAxis.
	var secXAxis = createXAxis(timeline,1);
	secXAxis.all(secBandedX.mapKey([0,1]));
	secXAxis.map('tick-offset').asValue(10);
	// Create the y-axis.
	var yAxis = timeline.yAxis(0);
	yAxis.map('margin').asValue(1);

	// x is mapped from start time. We need this to be in Date or time (Date.getTime()) form.
	timeline.all(data);

	timeline.map('x').using(mapKey)
	// (it should be unnecessary to use a range and map key - need to fix this)
	timeline.map('y').using(rangeY.mapKey([1,0]));

	//***************************
	// CONSTRUCT BARLAYER
	//***************************
	var barLayer = timeline.addLayer( aperture.BarLayer, {
			'orientation' : 'horizontal',
			'width' : 5
		}
	);
	barLayer.all(data.series);

	var positionKey = new aperture.Ordinal('y-position', ['vessel1', 'vessel2']).mapKey([0.25, 0.6]);
	var colorKey = new aperture.Ordinal('colour key', ['vessel1', 'vessel2']).mapKey(['#B1B1B1', '#F8B671']);
	barLayer.map('y').from('id').using(positionKey);
	barLayer.map('fill').from('id').using(colorKey);

	barLayer.map('bar-count').from('events.length');
	barLayer.map('x').from(function(index){
		return new Date(this.events[index].start)
	}).using(mapKey);

	// Set-up the mapping for determing the length of the bar
	// based on the duration of the associated event.
	barLayer.map('length').from(function(index){
		// Start and end dates.
		var startDate = new Date(this.events[index].start),
			endDate = new Date(startDate.getTime() + this.events[index].duration);

		// Map the dates to their corresponding, normalized, x-values.
		var startPct = mapKey.map(startDate.getTime()),
			endPct = mapKey.map(endDate.getTime());

		// Find the difference and convert into pixel-based length value.
		var diff = (endPct-startPct)*width*timeline.zoomValue;

		return diff;
	});

	// Example layer event handler (e.g. for callouts).
//	barLayer.on('click', function(event){
//	});

	//***************************
	// CONSTRUCT ICONLAYER
	//***************************
	var iconLayer = timeline.addLayer(aperture.IconLayer, {
			'width'    : 24,
			'height'   : 24,
			'anchor-x' : 0.5,
			'anchor-y' : 0.5
		});
	iconLayer.all(data.series);

	iconLayer.map('icon-count').from('events.length');

	iconLayer.map('x').from(function(index){
		return new Date(this.events[index].start)
	}).using(mapKey);

	iconLayer.map('y').from('id').using(positionKey);
	iconLayer.map('url').from(function(index){
		return './data/' + this.events[index].icon;
	});

	var zoom = 1;

	$('#zoomBtn').click( function() {
		timeline.zoom(++zoom);
	});

	// done.
	timeline.all().redraw();
};

var that = {};
that.createTimeLine = createTimeLine;
$.getJSON("data/vessel_timeline_data.json", function(data){
	that.createTimeLine(data);
});
//END-EXAMPLE
};});
