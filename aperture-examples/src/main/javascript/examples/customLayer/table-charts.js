var table  = new aperture.test.TableVizlet('#viz');

table.map('xCount').asValue(2);
table.map('yCount').asValue(2);
table.map('x').from('x');
table.map('y').from('y');

var plot = table.addLayer( aperture.chart.ChartLayer );
plot.map('color').asValue('#c6c4bf');
plot.map('border-width').asValue(1);
plot.map('margin').asValue(5);
var range = new aperture.Scalar('range').expand([0,1]);
plot.setYAxis({
	tickLength: 10,
	tickWidth: 1,
	tickInterval:0.25,
	offset:2,
	margin:20,
	range: range,
	labelOffset:2,
	showLabel:true,
	title:"Y"
});
plot.setXAxis({
	tickLength: 10,
	tickWidth: 1,
	tickInterval:0.25,
	offset:2,
	margin:40,
	range: range,
	labelOffset:5,
	showLabel:true,
	title:"X"
});

var lineLayer = plot.addLayer( aperture.chart.LineSeriesLayer );

//Create a line series layer and add it to the plot.
lineLayer.map('numPoints').from('data.length');
lineLayer.map('stroke-width').asValue(3);
lineLayer.map('color').asValue('#5555FF');
lineLayer.map('x').from('data[].x');
lineLayer.map('y').from('data[].y');

var data = [
	{
		x:0, y:0,
		data: [
		       { x: 0, y:0.3 },
		       { x: 0.2, y:0.1 },
		       { x: 0.4, y:0.8 },
		       { x: 0.6, y:0.5 },
		       { x: 0.8, y:0.9 },
		       { x: 1, y:0.8 }
	     ]
	},
	{
		x:1, y:0,
		data: [
		       { x: 0, y:0.1 },
		       { x: 0.2, y:0.6 },
		       { x: 0.4, y:0.7 },
		       { x: 0.6, y:0.8 },
		       { x: 0.8, y:0.9 },
		       { x: 1, y:0.5 }
	    ]
	},
	{
		x:0, y:1,
		data: [
		       { x: 0, y:0.3 },
		       { x: 0.2, y:0.1 },
		       { x: 0.4, y:0.01 },
		       { x: 0.6, y:0.3 },
		       { x: 0.8, y:0.6 },
		       { x: 1, y:0.2 }
	     ]
	},
	{
		x:1, y:1,
		data: [
		       { x: 0, y:0.1 },
		       { x: 0.2, y:0.4 },
		       { x: 0.4, y:0.5 },
		       { x: 0.6, y:0.3 },
		       { x: 0.8, y:0.2 },
		       { x: 1, y:0.9 }
	    ]
	}
];

table.all( data );

// Create a vizlet container

// Draw
table.update();