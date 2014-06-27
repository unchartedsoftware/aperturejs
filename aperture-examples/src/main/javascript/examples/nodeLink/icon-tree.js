define(function() { return function() { //START-EXAMPLE

var graphId = '#graph';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// CREATE AN OBJECT TO ENCAPSULATE THE NODE-LINK PLOT
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var nodeLink = {
	
	graphId_ : graphId,
	
	// PUBLIC
	data : function(graph) {
		this.graph_= graph;
	},
	
	// issue a layout request for the graph.
	layout : undefined,
	
	// construct or update the graph with new data (called by layout)
	update : undefined
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ADD AN UPDATE FUNCTION : ON FIRST UPDATE IT WILL CONSTRUCT.
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
nodeLink.update = function(transition) {
	
	var graph = this.graph_;
	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE THE BASE NODE LAYER
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// add a contents div to our container.
	var container = $(this.graphId_), 
		w = container.width(), h = container.height();

	var infoPlot = new aperture.NodeLink('#infoIcon');
	infoPlot.map('node-x').asValue(0);
	infoPlot.map('node-y').asValue(3);
	infoPlot.map('width').only().asValue(200);
	infoPlot.map('height').only().asValue(50);

	// create the base plot
	this.plot = new aperture.NodeLink(this.graphId_);
	this.plot.map('node-x').from('x').using(new aperture.Scalar('w', [0,w]).mapKey([0,w]));
	this.plot.map('node-y').from('y').using(new aperture.Scalar('h', [0,h]).mapKey([0,h]));
	this.plot.map('width').only().asValue(800);
	this.plot.map('height').only().asValue(1300);

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SET UP A FEW HIGHLIGHT THINGS
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var focusNodes = new aperture.Set('id');
	var highlightedLinks = new aperture.Set('id');
	var hover = new aperture.Set('id');

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE THE LINK REPRESENTATION.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var linkLayer = this.plot.addLayer( aperture.LinkLayer );
	linkLayer.all(graph.links, 'id');
	linkLayer.map('source').from('source');
	linkLayer.map('target').from('target');
	linkLayer.map('opacity').asValue(0.5);
	linkLayer.map('stroke-width').asValue(1);
	linkLayer.map('link-style').asValue('line');
	linkLayer.map('stroke').filter(highlightedLinks.constant('#e70'));
	linkLayer.map('source-offset').asValue(14);
	linkLayer.map('target-offset').asValue(14);
	linkLayer.map('stroke-style').from(function() {
		return this.target.attributes?'dashed':'solid';
	});
	
	
	// add a node layer	
	var nodeLayer = this.plot.addLayer(aperture.NodeLayer);
	nodeLayer.all(graph.nodes, 'id');

	// the graph will be sorted into three planes based on highlight state.
	nodeLayer.map('plane').asValue('labeled')
		.filter(focusNodes.constant('focus'));

	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE THE NODE REPRESENTATION.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var iconLayer = nodeLayer.addLayer( aperture.IconLayer );
	iconLayer.map('type').from('type');
	iconLayer.map('attributes').from('attributes');
	iconLayer.map('format').asValue('png');
	iconLayer.map('width').asValue(24).filter(hover.scale(1.5));
	iconLayer.map('height').asValue(24).filter(hover.scale(1.5));
	iconLayer.map('anchor-y').asValue(0.5);
	
	var infoIconLayer = infoPlot.addLayer( aperture.IconLayer );
	infoIconLayer.map('format').asValue('png');
	infoIconLayer.map('width').asValue(50);
	infoIconLayer.map('height').asValue(50);
	infoIconLayer.map('type').from('type')
	infoIconLayer.map('anchor-y').asValue(0);
	infoIconLayer.map('anchor-x').asValue(0);
	infoIconLayer.map('attributes').from('attributes');

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// ADD NODE LABELS.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var labelLayer = nodeLayer.addLayer(aperture.LabelLayer);
	labelLayer.map('text').from('label');
	labelLayer.map('font-outline').asValue('#F0EFE7');
	labelLayer.map('font-outline-width').asValue(3);
	labelLayer.map('text-anchor').asValue('middle');
	labelLayer.map('font-size').asValue(12).filter(hover.scale(1.2));
	labelLayer.map('offset-x').from('tag.offsetX');
	labelLayer.map('offset-y').asValue(20).filter(hover.constant(30));
	var that = this;
	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// WHEN HOVERING OVER A NODE HIGHLIGHT JUST IT AND ITS CONNECTED NODES.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	iconLayer.on('mouseover', function(event) {
		if (that.noHover_ || !focusNodes.add(event.data.id)) {
			hover.clear();
			
			return;
		}

		var changed = [event.data.id],
			changedLinks = [];
		
		// Add the appropriate target nodes to the selection set. 
		aperture.util.forEach(event.data.links, function(link){
			changedLinks.push(highlightedLinks.add(link.id));

		},this);

		hover.add(event.data.id);

		// update graphics then pop the nodes of interest to front.
		changed = nodeLayer.all().where('id', changed);
		changed.and(linkLayer.all().where('id', changedLinks)).redraw(new aperture.Transition(150));
		changed.toFront(['focus']);
		
		var attrs = event.data.attributes;
		infoPlot.all([{
			type : event.data.type,
			attributes : attrs
		}]).redraw();
		var attrText = '<b>Attributes </b><br>';
		if (attrs){
			for (var key in attrs){
				attrText += '' + key + ' : ' + attrs[key];
			}
		}
		var typeText = '<b>Type </b><br> ' + event.data.type;
		
		var htmlTxt = '<html>' + typeText + '<br>'
				+ (attrs?attrText:'') + '</html>';

		$('#infoTxt').html(htmlTxt);
	});
	
	iconLayer.on('mouseout', function(event) {
		var changed = focusNodes.clear();
		
		if (changed) {

			// clear everything.
			hover.clear();
			
			nodeLayer.all().where('id', changed)
				.and(linkLayer.all().where('id', highlightedLinks.clear()))
				.redraw(new aperture.Transition(150));
		}
	});
	
	// track button state so hovers are deactivated when dragging.
	$(this.graphId_).mousedown(function(e) {
		that.noHover_ = true;
		iconLayer.trigger('mouseout');
	});
	$('body').mouseup(function(e) {
		that.noHover_ = false;
	});

	this.plot.all().redraw();

	// Initialize the info box with a default value.
	infoPlot.all([{
		type : 'entity'
	}]).redraw();
	$('#infoTxt').html('<html><b>Type </b><br>entity');
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ADD A LAYOUT FUNCTION
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
nodeLink.layout = function() {
	var graphData = this.graph_;
	
	// form the layout request
	var layoutData = {
		links : graphData.links,
		nodes : aperture.util.map(graphData.nodes, function(n) {
			return {
				'id': n.id,
				'x': n.x,
				'y': n.y,
				'tag': n.tag,
				'width': 30,
				'height': 30,
				'weight': n.links.length
			};
		})
	};

	var con = $(this.graphId_);
	var view = {
		'top': con.scrollTop(), 
		'left': con.scrollLeft(), 
		'width': con.width(), 
		'height': con.height(),
		'margin': 30,
		'zoom' : this.zoom_
	};
	
	var options = {	
    	'treeLevelDistance' : 400,
    	'nodeDistance' : 100
     };
	var that = this;
	
	// initiate the layout request and handle the result.
	aperture.layout.htree(layoutData, view, options, function(response, info) {
		if ( !info.success ){
			var errorText = 'Unknown layout error';
			aperture.log.error(errorText);
			return;
		}

		var i=0;

		// update positions in graph data.
		var nodeCount=0;
		for (i in response.nodes){
			var layoutNode = response.nodes[i];
			var node = graphData.nodeMap[layoutNode.id]; 
			var tag = layoutNode.tag;
			
			node.x = layoutNode.x;
			node.y = layoutNode.y;
			node.tag = layoutNode.tag;
			nodeCount++;
		}
		// size the array
		graphData.nodes.length = nodeCount;

		// update the plot.
		that.update();
		
		$('#container').scrollTop(200);
		$('#container').scrollLeft(120);
	});
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// LOAD AND PROCESS THE SOURCE DATA.
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$.getJSON("./data/ontology.json", function(data) {
	
	// Register all the nodes.
	var i=0,
		nodes= data.icons,
		links= data.relationships,
		nodeMap= {};
	
	// Create a map of nodes
	for (i=0; i < nodes.length; i++){
		var node = nodes[i];
		nodeMap[node.id] = node;

		// add references to links from nodes. we will use these for highlighting.
		node.links= [];
	}
	// Create a list of all links
	for (i=0; i < links.length; i++) {
		var link = links[i];
		
		// for expedience have the link reference the nodes and have the nodes
		// include link ids.
		link.source = nodeMap[link.sourceId];
		var outlinks = link.source.links;
		outlinks.push({id: link.id, other: link.targetId});
		
		link.target = nodeMap[link.targetId];
		var inlinks = link.target.links;
		inlinks.push({id: link.id, other: link.sourceId});
		
	}
	
	// Now initiate the layout.
	nodeLink.data({
		nodes: nodes,
		nodeMap: nodeMap,
		links: links
	});
	
	nodeLink.layout();
});

//END-EXAMPLE
};});