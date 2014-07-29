define(function() { return function() { //START-EXAMPLE
// Create a vizlet container
var map = new aperture.geo.Map('#map');

//Create kmlLayer layer
var kmlLayer = map.addLayer( aperture.geo.MapGISLayer, {}, {
	format: "KML",
	url: "data/19847.kml"
});

//Zoom to the area of the world with the data
map.zoomTo( 37, -95, 4 );

var texturemap = { '-50':1, '-40':2, '-30':3, '-20':4, '-10':5, '0':6, '10':7, '20':8, '30':9, '32':10}

//Create the lookup function
var dataLookup = function() {
	var range = this.DEGF.value.substr(2, this.DEGF.value.length).split(' ');

	var textureno = 1;
	if (range.length < 3) {
		if (texturemap[range[1]] == undefined) {
			return 1;
		}
		textureno = texturemap[range[1]];
	}
	else {
		if (texturemap[range[2]] == undefined) {
			return 1;
		}
		textureno = texturemap[range[2]];
	}

	return '../img/tiles/tile-5-' + textureno + '.svg';
};

//Map data to visual properties
var scalar = new aperture.Scalar('Heat', [0, 1]);
kmlLayer.map('stroke').asValue('#ddd');
kmlLayer.map('stroke-width').asValue(0);
kmlLayer.map('fill-pattern').from(dataLookup); //.using(scalar.mapping(['img/one.png']));


//Draw
map.all().redraw();

//END-EXAMPLE
};});
