define(function() { return function() { //START-EXAMPLE

	
var that = {};

var spark = function(seriesIdx, chartComponentId, chartLabelId ){
	var series = that.dataSources.series[seriesIdx];	
	var rangeX = new aperture.Ordinal('month', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);		
	var rangeY = new aperture.Scalar('price');
	for (var i=0; i < series.data.length; i++){
		pointData = series.data[i];
		rangeY.expand(pointData.price);
	}

	var plotLayer = new aperture.chart.Chart(chartComponentId);
	plotLayer.all(series);
	plotLayer.map('x').using(rangeX.banded().mapKey([0,1]));
	plotLayer.map('y').using(rangeY.banded(10).mapKey([1,0]));
	plotLayer.map('border-width').asValue(1);
	plotLayer.map('height').asValue(30);
	plotLayer.map('width').asValue(120);
	var lineLayer = plotLayer.addLayer( aperture.chart.LineSeriesLayer );
	lineLayer.map('x').from('data[].month');
	lineLayer.map('y').from('data[].price');
	lineLayer.map('stroke').asValue('#888888');
	lineLayer.map('point-count').from('data.length');		
	lineLayer.map('stroke-width').asValue(3);
	
	plotLayer.all().redraw();
	$('#prevButton').click( function() {
		$.address.value( 'linechart-1.html' );
	});
	$(chartLabelId).html(series.name);		
}
	

var createChart = function(vizletParams){
	that.dataSources = vizletParams;
	spark(0, '#chartContainer1', '#chartContainer1_label');
	spark(1, '#chartContainer2', '#chartContainer2_label');
	spark(2, '#chartContainer3', '#chartContainer3_label');
};

that.createChart = createChart;
$.getJSON("data/stock_data.json", function(data){
	var data = that.createChart(data);
});

//END-EXAMPLE
};});