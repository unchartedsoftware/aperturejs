define(function() { return function() { //START-EXAMPLE
var createAxes = function(plot){
	var xAxisLayer = plot.xAxis(0);
	xAxisLayer.map('margin').asValue(40);
	xAxisLayer.map('title').asValue('Month (in 2011)');
	xAxisLayer.map('font-size').asValue(10); // Set the font size of the axes text.
	xAxisLayer.map('tick-length').asValue(5);

	var yAxisLayer = plot.yAxis(0);
	yAxisLayer.map('title').asValue('Housing Price Index');
	yAxisLayer.map('margin').asValue(40);
	yAxisLayer.map('font-size').asValue(10); // Set the font size of the axes text.
	yAxisLayer.map('tick-length').asValue(5);
	yAxisLayer.map('label-offset-x').asValue(2);
};
var createBarChart = function(vizletParams){

	var dataSources = vizletParams;
	var rangeX = new aperture.Ordinal('month', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
	var rangeY = new aperture.Scalar('price_index');

	var	seriesData = dataSources.series;

	for (var seriesId=0; seriesId < seriesData.length; seriesId++){
		var series = seriesData[seriesId].data;
		for (var i=0; i < series.length; i++){
			pointData = series[i];
			rangeY.expand(pointData.priceindex);
		}
	}
	for (var i=0; i < dataSources.avg.data.length; i++){
		pointData = dataSources.avg.data[i];
		rangeY.expand(pointData.priceindex);
	}

	var chart = new aperture.chart.Chart('#chartContainer');
	chart.all(dataSources);
	chart.map('x').using(rangeX.banded().mapKey([0,1]));
	chart.map('y').using(rangeY.banded(10).mapKey([1,0]));
	createAxes(chart);

	// Configure and define the main title of the chart.
	chart.map('title-spec').asValue({text: 'Toronto and Montreal Housing Price Index (vs Average)', 'font-size':15});
	chart.map('title-margin').asValue(20);

//	chart.map('stroke').asValue('#c6c4bf');
	chart.map('border-width').asValue(1);

	// Create a bar series layer and add it to the plot.
	var barLayer = chart.addLayer( aperture.chart.BarSeriesLayer );
	barLayer.all(seriesData);

	barLayer.map('x').from('data[].month');
	barLayer.map('y').from('data[].priceindex');

	barLayer.map('stroke-width').asValue(1);

	barLayer.map('stroke').asValue('');
	barLayer.map('fill').from('color');
	barLayer.map('point-count').from('data.length');


	// Create a line series layer and add it to the plot.
	var lineLayer = chart.addLayer( aperture.chart.LineSeriesLayer );
	lineLayer.all(dataSources.avg);

	lineLayer.map('x').from('data[].month');
	lineLayer.map('y').from('data[].priceindex');
	lineLayer.map('stroke').from('color');

	lineLayer.map('point-count').from('data.length');
	lineLayer.map('stroke-width').asValue(3);

	// Create a point layer and add it to the line layer.
	var pointLayer = chart.addLayer(aperture.RadialLayer);
	pointLayer.map('radius').asValue(3);
	pointLayer.map('fill').asValue(dataSources.avg.color);
	pointLayer.map('stroke-width').asValue(1);
	pointLayer.map('x').from('month');
	pointLayer.map('y').from('priceindex');
	pointLayer.all(dataSources.avg.data);
	
	chart.all().redraw();

};
var that = {};
that.createBarChart = createBarChart;
$.getJSON("data/housing_price_cities_data.json", function(data){
	var data = that.createBarChart(data);
});

//END-EXAMPLE
};});
