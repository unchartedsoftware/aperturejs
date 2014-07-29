define(function() { return function() { //START-EXAMPLE
	var createAxes = function(plot){
		var xAxisLayer = plot.xAxis(0);
		xAxisLayer.map('margin').asValue(50);
		xAxisLayer.map('title').asValue('GDP per Capita');
		xAxisLayer.map('font-size').asValue(10); // Set the font size of the axes text.
		xAxisLayer.map('tick-length').asValue(5);
		
		var yAxisLayer = plot.yAxis(0);
		yAxisLayer.map('title').asValue('Life Expectancy');
		yAxisLayer.map('margin').asValue(50);
		yAxisLayer.map('font-size').asValue(10); // Set the font size of the axes text.
		yAxisLayer.map('tick-length').asValue(5);
		yAxisLayer.map('label-offset-x').asValue(2);	
	},

	createChart = function(vizletParams){

		var dataSources = vizletParams;
		var rangeX = new aperture.Scalar('gdp_percapita');
		var rangeY = new aperture.Scalar('life_expectancy');
		var rangeRadius = new aperture.Scalar('population');

		for (var i=0; i < dataSources.data.length; i++){
			pointData = dataSources.data[i];
			rangeY.expand(pointData.age);
			rangeX.expand(pointData.gdp);
			rangeRadius.expand(pointData.population);
		}

		var chart = new aperture.chart.Chart('#chartContainer');

		chart.all(dataSources);
		chart.map('fill').asValue('#c6c4bf');
		chart.map('border-width').asValue(1);

		var bandedX = rangeX.banded(10),
			bandedY = rangeY.banded();
		
		var xMapping = bandedX.mapKey([0,1]),
			yMapping = bandedY.mapKey([1,0]);
		
		chart.map('x').using(xMapping);
		chart.map('y').using(yMapping);

		createAxes(chart);

		// Configure and define the main title of the chart.
		chart.map('title-spec').asValue({text: 'Country GDP vs Life Expectancy', 'font-size':15});
		chart.map('title-margin').asValue(20);

		var pointLayer = chart.addLayer( aperture.RadialLayer );
		pointLayer.all(dataSources.data);

		pointLayer.map('x').from('gdp');
		pointLayer.map('y').from('age');

		pointLayer.map('radius').from('population').using(rangeRadius.mapKey([5, 12]));
		pointLayer.map('fill').from('color');
		pointLayer.map('opacity').asValue(0.75);

		pointLayer.on('mouseover', function(event){
			$('#hover').html( 'Country: '+event.data.country + ' -- GDP: '+event.data.gdp + ' -- Life Expectancy: '+ event.data.age );
		});
		pointLayer.on('mouseout', function(event){
			$('#hover').html('');
		});

		// Set-up the chart threshold lines.
		var xHighlight = chart.addLayer( aperture.chart.LineSeriesLayer );
		var xData = bandedY.get();
		minValue = xData[0].min;
		maxValue = xData[xData.length-1].limit;
		gridData = [{value:minValue}, {value:maxValue}];
		xHighlight.all({data:gridData});
		xHighlight.map('y').only().from('data[].value').using(yMapping);
		xHighlight.map('x').asValue(10700);
		xHighlight.map('stroke').asValue('#EE6B6B');
		xHighlight.map('point-count').from('data.length');
		xHighlight.toBack();
		
		var yHighlight = chart.addLayer( aperture.chart.LineSeriesLayer );
		var yData = bandedX.get();
		minValue = yData[0].min;
		maxValue = yData[yData.length-1].limit;
		gridData = [{value:minValue}, {value:maxValue}];
		yHighlight.all({data:gridData});
		yHighlight.map('x').only().from('data[].value').using(xMapping);
		yHighlight.map('y').asValue(67);
		yHighlight.map('stroke').asValue('#6B93EE');
		yHighlight.map('point-count').from('data.length');
		yHighlight.toBack();
	

		chart.all().redraw();

	};

	var that = {};
	that.createChart = createChart;
	$.getJSON("data/world_lifespan_data.json", function(data){
		var data = that.createChart(data);
	});
	//END-EXAMPLE
};});
