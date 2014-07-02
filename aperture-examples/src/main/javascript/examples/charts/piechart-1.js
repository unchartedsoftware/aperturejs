define(function() { return function() { //START-EXAMPLE

	var createChart = function(vizletParams){

		var data = vizletParams;
		
		var percentRange = new aperture.Scalar('Percent', [0, 100]);

		var chart = new aperture.chart.Chart('#chartContainer');

		chart.all(data);
		
		var xRange = new aperture.Scalar('xrange', [-100, 100]);
		var yRange = new aperture.Scalar('yrange', [-100, 100]);
		
		chart.map('x').using(xRange.mapKey([0,1]));
		chart.map('y').using(yRange.mapKey([1,0]));
		chart.map('xaxis-visible').asValue(false);
		chart.map('yaxis-visible').asValue(false);
		
		// Configure and define the main title of the chart.
		chart.map('title-spec').asValue({text: 'December 2011 Sales by Housing Type (Toronto)', 'font-size':15});
		chart.map('title-margin').asValue(20);

		var pieLayer = chart.addLayer( aperture.RadialLayer );
		pieLayer.map('x').asValue(0);
		pieLayer.map('y').asValue(0);
		
		pieLayer.map('radius').asValue(140);
		pieLayer.map('fill').from('data[].color');
		pieLayer.map('opacity').asValue(0.75);
		
		pieLayer.map('sector-count').from('data.length');
		pieLayer.map('sector-angle').from('data[].percentage').using(percentRange.mapKey([0, 360]));
		
		
		pieLayer.on('mouseover', function(event){
			$('#hover').html( 'Property type: ' + event.data.data[event.index[0]].propertytype + ' (' +  event.data.data[event.index[0]].percentage +'% of sales)' );
		});
		pieLayer.on('mouseout', function(event){
			$('#hover').html('');
		});

		
		chart.all().redraw();

	};

	var that = {};
	that.createChart = createChart;
	$.getJSON("data/sales_property_type_data.json", function(data){
		var data = that.createChart(data);
	});
	//END-EXAMPLE
};});