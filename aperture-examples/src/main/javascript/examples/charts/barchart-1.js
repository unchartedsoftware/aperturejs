define(function() { return function() { //START-EXAMPLE

var createBarChart = function(vizletParams){
	var width = vizletParams.width;
	var height = vizletParams.height;

	var dataSources = vizletParams;

	var transition = new aperture.Transition(500);
	var rangeX = new aperture.Ordinal('agegroup');
	var rangeY = new aperture.Scalar('value');

	for (var seriesId=0; seriesId < dataSources.series.length; seriesId++){
		var series = dataSources.series[seriesId].data;

		for (var i=0; i < series.length; i++) {
			pointData = series[i];
			rangeX.expand(pointData.agegroup);
			rangeY.expand(pointData.value);
		}
	}
	
	rangeY.expand(0); // force range to include 0

	var chart = new aperture.chart.Chart('#chartContainer');
	chart.all(dataSources);
	chart.map('width').asValue(width);
	chart.map('height').asValue(height);
	chart.map('x').using(rangeX.banded().mapKey([0,1]));
	chart.map('y').using(rangeY.banded(6).mapKey([1,0]));

	// Hide the chart border.
	chart.map('border-width').asValue(0);
	chart.map('background-color').asValue('none');

	// Configure and define the main title of the chart.
	chart.map('title-spec').asValue({text: 'Age Distribution, Female vs. Male (United States, 2000)', 'font-size':15});
	chart.map('title-margin').asValue(20);
	chart.map('stroke').asValue('#a1a1a2');
	
	chart.xAxis().mapAll({
		'title' : 'Age Group',
		'margin' : 40,
		'rule-width': 1 // Draw the x-axis line.
	});
	
	chart.yAxis().mapAll({
		'title' : 'Percent of Population',
		'margin' : 40,
		'tick-length' : 6,
		'label-offset-x' : 2
	});
	
	// Create a line series layer and add it to the chart.
	var barSeries = chart.addLayer( aperture.chart.BarSeriesLayer );
	barSeries.all(function(data){
		return data.series;
	});
	
	// A BarSeriesLayer has an attribute called "width" that allows
	// the user to manually set the width of each bar. If that property
	// doesn't have a mapping, the width of each bar will be automatically
	// calculated. Refer to the example for a horizontal, stacked, bar chart
	// to see an example of how to use the "bar-width" attribute.
	
	// Set up the mappings for the x and y-axis.
	barSeries.map('x').from('data[].agegroup');
	barSeries.map('y').from('data[].value');
	barSeries.map('stroke').asValue('none');
	
	// Set the distance between bars from different bands.
	barSeries.map('spacer').asValue('10');
	barSeries.map('point-count').from('data.length');
	
	// Create a selection set and from what member our selection data will come from.
	var selection = new aperture.Set('data[]');
	// Attach a filter to the visual property called 'fill'.
	var fillKey = new aperture.Ordinal('fill', ['female', 'male']).mapKey(['#D26694', '#c5c5bc']); //'#667899', '#3b425c'
	barSeries.map('fill').from(function(index) {
		return this.gender;
	}).using(fillKey).filter(selection.constant(aperture.palette.color('selected')));	
	
	
	// Add click listeners.
	// Click listener for the bar layer. This will change the
	// the fill colour of the selected bar to retrieve from
	// the aperture colour palette the value associated with
	// the key 'selected'.
	barSeries.on('click', function(event){
		// Clicked on pie, select it
		selection.clear();
		var barData = selection.translateData(event.data, event.index);
		selection.add(barData);
		// Update this layer's fill color only
		barSeries.all().redraw(transition);

		// handled.
		return true;
	});
	
	// Add a listener to the chart itself. If the chart is
	// clicked we will interpret this as a deselection
	// event and restore the last selected bar back to its
	// original colour.
	$('#chartContainer').click(function(){
		selection.clear();
		barSeries.all().redraw(transition);
	});

	chart.all().redraw();
};
var that = {};
that.createBarChart = createBarChart;
$.getJSON("data/age_gender_distribution.json", function(data){
	var data = that.createBarChart(data);
});

//END-EXAMPLE
};});
