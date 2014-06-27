define(function() { return function() { //START-EXAMPLE

var createAxes = function(chart){
	var xAxisLayer = chart.xAxis(0);
	xAxisLayer.map('margin').asValue(40);
	xAxisLayer.map('title').asValue('Percent of Population (Male and Female)');
	xAxisLayer.map('rule-width').asValue(1); // Draw the axis line.

	var yAxisLayer = chart.yAxis(0);
	yAxisLayer.map('title').asValue('Age Group');
	yAxisLayer.map('margin').asValue(50);
	yAxisLayer.map('label-offset-x').asValue(2);
	yAxisLayer.map('rule-width').asValue(1); // Draw the axis line.	
};	

var createBarChart = function(vizletParams){
	var width = vizletParams.width;
	var height = vizletParams.height;

	var dataSources = vizletParams;
	var rangeY = new aperture.Ordinal('agegroup');
	
	var transition = new aperture.Transition(500);
	
	var totalRange = [];
	for (var seriesId=0; seriesId < dataSources.series.length; seriesId++){
		var series = dataSources.series[seriesId].data;

		// We need a range that represents the total combined value for each
		// age category (i.e. both male and female).
		for (var i=0; i < series.length; i++){
			pointData = series[i];
			rangeY.expand(pointData.agegroup);
			totalRange[i] = totalRange[i] == undefined?
				pointData.value:totalRange[i] + pointData.value;
		}
	}
	var rangeX = new aperture.Scalar('count', totalRange);
	rangeX.expand(0); // force range to include 0

	var chart = new aperture.chart.Chart('#chartContainer');
	chart.all(dataSources);
	chart.map('x').using(rangeX.banded(10).mapKey([0,1])); // TODO:  labels should be on the tick marks, not centered between them
	chart.map('y').using(rangeY.banded().mapKey([1,0]));

	// Hide the chart border.
	chart.map('border-width').asValue(0);
	chart.map('background-color').asValue('none');
	
	// Configure and define the main title of the chart.
	chart.map('title-spec').asValue({text: 'Age Distribution, Combined (United States, 2000)', 'font-size':15});
	chart.map('title-margin').asValue(20);

	// Set the bar chart to plot horizontal bars, from left-to-right.
	chart.map('orientation').asValue('horizontal');

	chart.xAxis().mapAll({
		'title' : 'Percent of Population',
		'margin' : 40//,
//		'rule-width': 1 // Draw the x-axis line.
	});
	
	chart.yAxis().mapAll({
		'title' : 'Age Group',
		'margin' : 50,
		'tick-length' : 6,
		'rule-width': 1, 
		'label-offset-x' : 2
	});
	
	// Create a line series layer and add it to the chart.
	var barSeries = chart.addLayer( aperture.chart.BarSeriesLayer );
	barSeries.all(function(data){
		return data.series;
	});
	barSeries.map('y').from('data[].agegroup');
	barSeries.map('x').from('data[].value');

	barSeries.map('stroke-style').from('strokestyle');
	barSeries.map('stroke-width').asValue(1);

	barSeries.map('bar-layout').asValue('stacked');
	barSeries.map('width').asValue(5); // Width of a bar.

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
		// Clicked on bar, select it
		selection.clear();
		var barData = selection.translateData(event.data, event.index);
		selection.add(barData);
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
	barSeries.map('point-count').from('data.length');

	chart.all().redraw();
	$('#prevButton').click( function() {
		$.address.value( 'barchart-1.html' );
	});
};
var that = {};
that.createBarChart = createBarChart;
$.getJSON("data/age_gender_distribution.json", function(data){
	var data = that.createBarChart(data);
});

//END-EXAMPLE
};});
