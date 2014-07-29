define(function() { return function() { //START-EXAMPLE
var YEAR_THRESHOLD = 1995;
	
var createAxes = function(chart){
	var xAxisLayer = chart.xAxis(0);
	xAxisLayer.map('margin').asValue(40);
	xAxisLayer.map('title').asValue('Year');
	xAxisLayer.map('font-size').asValue(10); // Set the font size of the axes text.

	var yAxisLayer = chart.yAxis(0);
	yAxisLayer.map('title').asValue('Annual %');
	yAxisLayer.map('margin').asValue(40);
	yAxisLayer.map('font-size').asValue(10); // Set the font size of the axes text.
	yAxisLayer.map('label-offset-x').asValue(2);
},

createPointHighlight = function(chart, countryId, stroke, yearArray){
	var pointLayer = chart.addLayer( aperture.RadialLayer );
	// Get the GDP data for the given country.
	pointLayer.all(function(data){
		return data.gdp_annual[countryId].data;
	}, 'year');
	pointLayer.map('x').from('year');
	pointLayer.map('y').from('value')
	pointLayer.map('radius').from(function(){
		return hasHighlight.call(this, yearArray)?2:1;
	});
	// In this case, we want to bring attention to the values for
	// certain dates. 
	// We want to highlight data points for the start and end points, as
	// well as the transition point where the graph changes from a
	// solid line to a dashed (i.e. 1995).
	pointLayer.map('fill').from(function(){
		return hasHighlight.call(this, yearArray)?'#ffffff':'#787878';
	});
	pointLayer.map('stroke').from(function(){
		return hasHighlight.call(this, yearArray)?stroke:'none';		
	});
	return pointLayer;
},

/**
 * Determine if the point should be highlighted or not.
 */
hasHighlight = function(yearArray){
	var year = parseInt(this.year);
	return (year === yearArray[0]
		||year === YEAR_THRESHOLD
		||year === yearArray[yearArray.length-1]);
},

/**
 * Determine which data set to use when plotting the line series.
 */
updateRadialLayer = function(pointLayers, countryId, dataToggle){
	if (dataToggle){
		pointLayers[countryId].map('y').from(function(){
			return this.value/1000000000;
		});
		pointLayers[countryId].all(function(data){
			return data.gdp_usd[countryId].data;
		}, 'year');
	}
	else {
		pointLayers[countryId].map('y').from('value');
		pointLayers[countryId].all(function(data){
			return data.gdp_annual[countryId].data;
		}, 'year');
	}
};

/**
 * Creates a line chart with 4 layers:
 * 1. Plot layer for border/ticks/rules.
 * 2. Line Series layers for the line graph itself.
 * 3. Point layer to show arbitrary data points of the graph.
 * 4. Text layer to label arbitrary data points.
 */
var createLineChart = function(vizletParams){
	var width = vizletParams.width;
	var height = vizletParams.height;
	var zoom = 1;

	var dataSources = vizletParams;
	var dataToggle = true;
	var yearArray = [];
	// Create an array of years ranging from 1961-2010.
	for (var year=1961; year < 2011; year++){
		yearArray.push(parseInt(year));
	}
	
	var ranges = {};
	var rangeX = new aperture.Scalar('year', yearArray);
	var rangeY = new aperture.Scalar('temperature');
	var updateRangeY, updateBandY;

	for (var recordId=0; recordId < dataSources.gdp_annual.length; recordId++){
		var data = dataSources.gdp_annual[recordId].data;
		var value;
		for (var i=0; i < data.length; i++){
			pointData = data[i];
			value = pointData.value;
			// Since the range object doesn't accept a source function,
			// we need to convert the string dates to a number before
			// expanding the range.
			rangeY.expand(value);
		}
	}
	ranges = {x: rangeX, y: rangeY};
	var bandedX = rangeX.banded(10);
	var bandedY = rangeY.banded(10);
	var xMapping = bandedX.mapKey([0,1]),
		yMapping = bandedY.mapKey([1,0]);

	var chart = new aperture.chart.Chart('#chartContainer');

	chart.all(dataSources);
	chart.map('width').asValue(width);
	chart.map('height').asValue(height);
	//chart.map('stroke').asValue('#c6c4bf');

	chart.map('x').using(xMapping);
	chart.map('y').using(yMapping);
	chart.map('title-spec').asValue({text: 'GDP Per Capita Growth (Annual %)', 'font-size':12});
	chart.map('title-margin').asValue(20);

	/**
	 * Create the chart axes.
	 */
	createAxes(chart);

	/**
	 * Setup the rule layer for the xapxis
	 */
	// Rule lines for displaying the range bands.
	// This will take the bands that the AxisLayer calculates and create
	// a matching rule line for each x-axis tick mark.
	var ruleLayer = chart.ruleLayer(0);
	ruleLayer.all(bandedX.get());
	ruleLayer.map('rule').from('min').using(xMapping);
	ruleLayer.map('axis').asValue('x');
	ruleLayer.map('stroke-style').asValue('dotted');
	//ruleLayer.map('stroke').asValue('#EBEBEB');
	ruleLayer.map('visible').from(function(data){
		// If the x-grid gridline is located at the same position as the highlight
		// gridlines, only draw the highlight gridline.
		return this.min != YEAR_THRESHOLD;
	});
	// Send the rule layer to the back of the canvas so that all other
	// layers are rendered on top.
	ruleLayer.toBack();
	
	/**
	 * Setup the line chart
	 */
	// Create a line series layer and add it to the plot.
	var lineLayer = chart.addLayer( aperture.chart.LineSeriesLayer );
	lineLayer.all(function(data){
		return data.gdp_annual;
	}, 'year');

	lineLayer.map('x').from(function(index){
		return parseInt(this.data[index].year);
	});
	lineLayer.map('y').from('data[].value');

	var typeRange = new aperture.Ordinal('Style', [undefined, true]);

	// Create a mapping for choosing the correct line colour given
	// a country name.
	lineLayer.map('stroke').from(function(){
		return this.country === 'Pakistan'?undefined : true;
	}).using(typeRange.mapKey(['#8AADEC','#c6c4bf']));

	// Create a function for mapping the correct line style based on the date
	// value of the data point. Points before YEAR_THRESHOLD are rendered using
	// a solid line, points after use a dashed line.
	lineLayer.map('stroke-style').from(function(index){
		var year = parseInt(this.data[index].year);
		return year < YEAR_THRESHOLD?undefined : true;
	}).using(typeRange.mapKey(['', '-']));

	lineLayer.map('point-count').from('data.length');
	lineLayer.map('stroke-width').asValue(2);
	/**
	 * Create threshold lines along the x and y-axis. 
	 */
	var yHighlight = chart.addLayer( aperture.chart.LineSeriesLayer );
	var yData = bandedX.get();
	// Include the upper limit of the band.
	var minValue = yData[0].min;
	var maxValue = yData[yData.length-1].limit;
	var gridData = [{value:minValue}, {value:maxValue}];
	yHighlight.all({data:gridData});
	yHighlight.map('x').only().from('data[].value').using(xMapping);
	yHighlight.map('y').asValue('0');
	yHighlight.map('stroke').asValue(new aperture.Color('rule'));
	yHighlight.map('stroke-style').asValue('dotted');
	yHighlight.map('point-count').from('data.length');
	yHighlight.toBack();
	
	var xHighlight = chart.addLayer( aperture.chart.LineSeriesLayer );
	var xData = bandedY.get();
	minValue = xData[0].min;
	maxValue = xData[xData.length-1].limit;
	gridData = [{value:minValue}, {value:maxValue}];
	xHighlight.all({data:gridData});
	xHighlight.map('y').only().from('data[].value').using(yMapping);
	xHighlight.map('x').asValue(YEAR_THRESHOLD);
	xHighlight.map('stroke').asValue('#FC9');
	xHighlight.map('point-count').from('data.length');
	xHighlight.toBack();
	
	/**
	 * Setup the point layers.
	 */
	// Add a RadialLayer for highlighting specific 'Year' values 
	// in both line charts.
	var pointLayers =[createPointHighlight.call(this, chart, 0, '#c6c4bf', yearArray),
	                  createPointHighlight.call(this, chart, 1, '#8AADEC', yearArray)];

	// Animation for restoring the line and the zoom control.
	var endTransition = function(){
		lineLayer.map('opacity').asValue(1);
		lineLayer.all().redraw(new aperture.Transition(500, 'easing', function(){
			$('#zoomBtn').removeAttr('disabled');
		}));
	};
	// Animation for data change.
	var dataTransition = new aperture.Transition(1000, 'easing', function(){
		endTransition();
	});
	
	chart.all().redraw();

	$('#nextButton').click( function() {
		$.address.value( 'sparklines-1.html' );
	});
	// Button for updating the grid lines and data source of the line chart.
	$('input:radio:[name="gdpGroup"]').click(function(event){
		// If the update range hasn't been defined, create it.
		dataToggle = $('input:radio[name=gdpGroup]:checked')[0].value == '1';
		if (!updateRangeY){
			updateRangeY = new aperture.Scalar('dollars');
			for (var recordId=0; recordId < dataSources.gdp_usd.length; recordId++){
				var data = dataSources.gdp_usd[recordId].data;
				var value;
				for (var i=0; i < data.length; i++){
					pointData = data[i];
					value = pointData.value/1000000000;
					// Since the range object doesn't accept a source function,
					// we need to convert the string dates to a number before
					// expanding the range.
					updateRangeY.expand(value);
				}
			}
			updateBandY = updateRangeY.banded(10).mapKey([1,0]);
		}

		// Toggle different rules and change the series data points.
		lineLayer.map('opacity').asValue(0.05);
		lineLayer.all().redraw(new aperture.Transition(500, 'easing', function(){
			if (dataToggle){
				// Update the main chart, and y-axis titles, respectively.
				chart.map('title-spec').asValue({text: 'GDP (Constant 2000 US$)', 'font-size':12});
				chart.yAxis(0).map('title').asValue('USD ($1B)');
				chart.map('y').using(updateBandY);
				lineLayer.map('y').from(function(index){
					return this.data[index].value/1000000000;
				});
				lineLayer.join(function(data){
					return data.gdp_usd;
				});
				yHighlight.map('visible').asValue(false);
			}
			else {
				// Reset the y-axis range back to its original values.
				chart.map('y').using(yMapping);
				chart.map('title-spec').asValue({text: 'GDP Per Capita Growth (Annual %)', 'font-size':12});
				chart.yAxis(0).map('title').asValue('Annual %');
				lineLayer.map('y').from('data[].value');
				lineLayer.join(function(data){
					return data.gdp_annual;
				});
				yHighlight.map('visible').asValue(true);
			}
			// Update the radial layers.
			updateRadialLayer(pointLayers, 0, dataToggle);
			updateRadialLayer(pointLayers, 1, dataToggle);
			// Disable the zoom button while the transitions
			// are occuring.
			$('#zoomBtn').attr('disabled', 'disabled');
			chart.all().redraw(dataTransition);
		}));
	});

	$('#zoomBtn').click( function() {
		// Reset the zoom value;
		if (zoom > 5){
			zoom = 0;
		}
		chart.zoom(++zoom);
	});
};

var that = {};
that.createLineChart = createLineChart;
$.getJSON("data/gdp_pak_v_ind.json", function(data){
	var data = that.createLineChart(data);
});

//END-EXAMPLE
};});
