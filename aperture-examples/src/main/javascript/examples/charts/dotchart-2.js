define(function() { return function() { //START-EXAMPLE
	var createAxes = function(plot){
		var xAxisLayer = plot.xAxis(0);
		xAxisLayer.map('margin').asValue(50);
		xAxisLayer.map('title').asValue('GDP per Capita');

		var yAxisLayer = plot.yAxis(0);
		yAxisLayer.map('title').asValue('Life Expectancy');
		yAxisLayer.map('margin').asValue(50);
		yAxisLayer.map('label-offset-x').asValue(2);
	};
	var that = {};
	var rangeY;
	var chart;
	var dataSources;

	var setChartScalarView = function(){
		var scalarViewString = $("input[@name='rScalar']:checked").val();

		var bandedY;
		if(scalarViewString === 'absolute'){
			bandedY = rangeY.absolute();
		}else if(scalarViewString === 'logarithmic'){
			bandedY = rangeY.logarithmic();
		}else if(scalarViewString === 'symmetric'){
			bandedY = rangeY.symmetric();
		}else {
			bandedY = rangeY.banded();
		}

		chart.map('y').using(bandedY.mapKey([1,0]));
	};

	var createChart = function(vizletParams){

		dataSources = vizletParams;
		var rangeX = new aperture.Scalar('gdp_percapita');
		rangeY = new aperture.Scalar('life_expectancy');
		var rangeRadius = new aperture.Scalar('population');

		for (var i=0; i < dataSources.data.length; i++){
			pointData = dataSources.data[i];
			rangeY.expand(pointData.age);
			rangeX.expand(pointData.gdp);
			rangeRadius.expand(pointData.population);
		}

		chart = new aperture.chart.Chart('#chartContainer');

		chart.all(dataSources);
		chart.map('border-width').asValue(1);

		var bandedX = rangeX.banded(10);
		chart.map('x').using(bandedX.mapKey([0,1]));

		setChartScalarView();

		createAxes(chart);
		// Configure and define the main title of the chart.
		chart.map('title-spec').asValue({text: 'Country GDP vs Life Expectancy', 'font-size':15});
		chart.map('title-margin').asValue(20);

		// Create a point layer and add it to the plot layer.
		var pointLayer = chart.addLayer( aperture.RadialLayer );

		// Explicitly set the data source of the point layer.
		// In this case, we do not need to set the 'point-count' attribute;
		pointLayer.all(dataSources.data);
		pointLayer.map('x').from('gdp');
		pointLayer.map('y').from('age');
		pointLayer.map('radius').from('population').using(rangeRadius.mapKey([5, 12]));
		pointLayer.map('fill').from('color');

		chart.all().redraw();

		$("input[name='rScalar']").change(function(){
			setChartScalarView();
			chart.all().redraw(new aperture.Transition(1000));
		});

	};


	that.createChart = createChart;

	$.getJSON("data/world_lifespan_data.json", function(data){
		var data = that.createChart(data);
	});
	//END-EXAMPLE
};});
