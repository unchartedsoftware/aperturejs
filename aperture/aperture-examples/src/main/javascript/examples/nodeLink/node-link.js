define(function() { return function() { //START-EXAMPLE

var graphId = '#graph';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// CREATE AN OBJECT TO ENCAPSULATE THE NODE-LINK PLOT
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var nodeLink = {

	zoom_ : 1,
	zoomLevel_ : 0,
	
	graphId_ : graphId,
	contentsId_ : '#ap-graph-contents',
	
	// PUBLIC
	data : function(graph) {
		this.graph_= graph;
	},
	
	// issue a layout request for the graph.
	layout : undefined,
	
	// construct or update the graph with new data (called by layout)
	update : undefined,

	// zoom to a specified level (called by zoomIn, zoomOut)
	zoom : undefined,

	// zoom in a level
	zoomIn : function(transition) {
		this.zoom(this.zoomLevel_+1, transition);
	},
	
	// zoom out a level
	zoomOut : function(transition) {
		this.zoom(this.zoomLevel_-1, transition);
	}
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ADD AN UPDATE FUNCTION : ON FIRST UPDATE IT WILL CONSTRUCT.
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
nodeLink.update = function(transition) {
	
	// if constructed this is all we need to do.
	if (this.plot) {
		this.plot.all().redraw(transition).toFront('labeled');
		
		return;
	}
	
	var graph = this.graph_;
	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE THE BASE NODE LAYER
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// add a contents div to our container.
	var container = $(this.graphId_), 
		w = container.width(), h = container.height();
	container.append('<div id="'+ this.contentsId_.substr(1) + '" class="dragger" style="width: '+ w +
			'px; height: ' + h + 'px;"/>');
	
	// create the base plot
	this.plot = new aperture.NodeLink(this.contentsId_);
	this.plot.map('node-x').from('x').using(new aperture.Scalar('w', [0,w]).mapKey([0,w]));
	this.plot.map('node-y').from('y').using(new aperture.Scalar('h', [0,h]).mapKey([0,h]));

	// add a node layer	
	var nodeLayer = this.plot.addLayer(aperture.NodeLayer);
	nodeLayer.all(graph.nodes, 'id');
	
	// size of node is based on overall connectedness. 
	var nodeSize = nodeLayer.map('radius').from('links.length').using(
		graph.connectednessRange.mapKey([3,6]));

	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SET UP A FEW HIGHLIGHT THINGS
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var focusNodes = new aperture.Set('id');
	var highlightedNodes = new aperture.Set('id');
	var highlightedLinks = new aperture.Set('id');
	
	// the graph will be sorted into three planes based on highlight state.
	nodeLayer.map('plane').from(function() {
			return this.tag.visible? 'labeled' : 'normal';
		})
		.filter(highlightedNodes.constant('highlight'))
		.filter(focusNodes.constant('focus'));

	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE THE LINK REPRESENTATION.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var linkLayer = this.plot.addLayer( aperture.LinkLayer );
	linkLayer.all(graph.links, 'id');
	linkLayer.map('source').from('source');
	linkLayer.map('target').from('target');
	linkLayer.map('opacity').asValue(0.5).filter(highlightedLinks.constant(1));
	linkLayer.map('stroke-width').asValue(1);
	linkLayer.map('link-style').asValue('arc');

	// The color key for node connectedness, which is applied to links too.
	var colorKey = graph.connectednessRange.mapKey(
		[new aperture.Color('#69AFDC'), new aperture.Color('#FBF0E7')]);
	
	var highlightColor = new aperture.Color('#f90'),
		highlightHue = highlightColor.hue();
	
	// these mappings will be assigned a source later
	nodeLayer.map('fill').from('links.length').using(colorKey)
		.filter(highlightedNodes.filter(function(color) {
			return color.hue(highlightHue);
		}));
	linkLayer.map('stroke').from('source.links.length').using(colorKey)
		.filter(highlightedLinks.constant(highlightColor));

	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// CREATE THE NODE REPRESENTATION.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var dotLayer = nodeLayer.addLayer( aperture.RadialLayer );
	dotLayer.map('stroke').from(function() {
		return this.tag.visible? '#222': 'none';
	}); 
	dotLayer.map('stroke-width').asValue(1.5);
	
	// the same offset is used for links and labels, derived from the radius mapping
	function nodeOffset() {
		return 2+ nodeSize.valueFor(this);
	}

	// link offsets from the radius of each node.
	linkLayer.map('source-offset').from(nodeOffset);
	linkLayer.map('target-offset').from(nodeOffset);

	var toTa = {left: 'start', middle: 'middle', right: 'end'};
	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// ADD NODE LABELS.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	var labelLayer = nodeLayer.addLayer(aperture.LabelLayer);
	labelLayer.map('text').from('name');
	labelLayer.map('font-outline').asValue('#222');
	labelLayer.map('font-outline-width').asValue(3);
	labelLayer.map('visible').from('tag.visible');
	labelLayer.map('text-anchor').from(function() {
		return toTa[this.tag.anchorX];
	});
	labelLayer.map('text-anchor-y').from('tag.anchorY');
	labelLayer.map('font-size').asValue(12);
	labelLayer.map('offset-x').from('tag.offsetX');
	
	var that = this;
	
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// WHEN HOVERING OVER A NODE HIGHLIGHT JUST IT AND ITS CONNECTED NODES.
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	nodeLayer.on('mouseover', function(event) {
		if (that.noHover_ || !focusNodes.add(event.data.id)) {
			return;
		}

		var changed = [highlightedNodes.add(event.data.id)];
		
		// Add the appropriate target nodes to the selection set. 
		aperture.util.forEach(event.data.links, function(link) {
			var add= highlightedNodes.add(link.other);
			changed.push(add);
			highlightedLinks.add(link.id);
		},this);

		// update graphics then pop the nodes of interest to front.
		nodeLayer.all().where('id', changed).and(linkLayer.all()).redraw().toFront(['labeled', 'highlight', 'focus']);
	});
	
	nodeLayer.on('mouseout', function(event) {
		if (focusNodes.clear().length) {

			// clear everything.
			highlightedLinks.clear();
			var updated= highlightedNodes.clear();
			
			nodeLayer.all().where('id', updated).and(linkLayer.all()).redraw().toFront('labeled');
		}
	});
	
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// SET UP ZOOM AND PAN
	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// zoom with scroll wheel.
	$(this.graphId_).bind('DOMMouseScroll mousewheel', function(e) {
		if (e.wheelDelta > 0){
			that.zoomIn();
		} else {
			that.zoomOut();
		}
		e.preventDefault();
	});

	// make sure that panning is activated for the graph
	$(this.graphId_).dragscrollable({dragSelector: this.contentsId_});

	// track button state so hovers are deactivated when dragging.
	$(this.contentsId_).mousedown(function(e) {
		that.noHover_ = true;
		dotLayer.trigger('mouseout');
	});
	$('body').mouseup(function(e) {
		that.noHover_ = false;
	});

	
	this.plot.all().redraw();
	nodeLayer.all().toFront('labeled');
	
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ADD A LAYOUT FUNCTION
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
nodeLink.layout = function(type, transition) {
	var graphData = this.graph_;
	
	// form the layout request
	var layoutData = {
		links : graphData.links,

		// TODO: if layout was also integrated into layer node sets, this kind of thing could be managed.
		nodes : aperture.util.map(graphData.nodes, function(n) {
			return {
				'id': n.id,
				'x': n.x,
				'y': n.y,
				'tag': n.tag,
				'width': 12,
				'height': 12,
				'weight': n.links.length
			};
		})
	};

	var con = $(this.graphId_);
	// TODO: if layout was also integrated into layers view extents could be provided.
	var view = {
		'top': con.scrollTop(), 
		'left': con.scrollLeft(), 
		'width': con.width(), 
		'height': con.height(),
		'margin': 100,
		'zoom' : this.zoom_
	};
	
	var layouts = type? [{'type' : type, 'fit' : 'stretch'}] : [];
	
	// add tag layout
	layouts.push({
		'type' : 'tag',
		'tagWidth' : 100,
		'tagHeight' : 18,
		'alignments' : 'bottomAny',
		'preferCurrent' : !type 
	});
	
	var that = this;
	
	// initiate the layout request and handle the result.
	aperture.layout.multipass(layoutData, view, layouts, function(response, info) {
		if ( !info.success ){
			var errorText = 'Unknown layout error';
			aperture.log.error(errorText);
			return;
		}

		var i=0;

		// update positions in graph data.
		// TODO: if layout was also integrated into layers view extents could be provided.
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
		that.update(transition);
	});
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AND ZOOM FUNCTIONS
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// TODO: move zoom into node plot?
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
nodeLink.zoom = function(zoom, transition) {

	// constrain amount of zoom
	if (zoom > 6 || zoom < 0) {
		return;
	}
	// cache
	this.zoomLevel_ = zoom;

	// zoom is exponential
	this.zoom_ = Math.pow(1.5, zoom);

	// get graph content and container
	var content = $(this.contentsId_),
		container = $(this.graphId_),
		
		vpw = container.width(), vph = container.height(),

		// Get the current scroll position, taken from the centre of the viewport.
		scrollCx = (container.scrollTop()+0.5*vph)/content.height(),
		scrollCy = (container.scrollLeft()+0.5*vpw)/content.width(),
		w, h;
	
	// Update the content size.
	content.width(w = vpw*this.zoom_);
	content.height(h = vph*this.zoom_);

	// reset scale mapping
	this.plot.map('node-x').using().to()[1] = w;
	this.plot.map('node-y').using().to()[1] = h;

	// Calculate the new scroll position, centered on the viewport.
	container.scrollTop(h*scrollCx - 0.5*vph);
	container.scrollLeft(w*scrollCy - 0.5*vpw);

	// redraw
	this.plot.all().redraw(transition);
	
	this.layout('', transition);
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// WIRE UP THE OTHER CONTROLS
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// zoom in button
$('#zoomInBtn').click(function(){
	nodeLink.zoomIn();
});

// zoom out button
$('#zoomOutBtn').click(function(){
	nodeLink.zoomOut();
});

// layout options.
$('#layoutType').change(function() {
	nodeLink.layout($('#layoutType').val(), new aperture.Transition(1000));
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// LOAD AND PROCESS THE SOURCE DATA.
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$.getJSON("./data/les_mis.json", function(data) {
	
	// Register all the nodes.
	var i=0,
		nodes= data.characters,
		links= data.relationships,
		nodeMap= {}, 
		linkCountRange= new aperture.Scalar('Connectedness');
	
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
		
		// keep track of ranges for mapping
		linkCountRange.expand(outlinks.length);
		
		link.target = nodeMap[link.targetId];
		var inlinks = link.target.links;
		inlinks.push({id: link.id, other: link.sourceId});
		
		// keep track of ranges for mapping
		linkCountRange.expand(inlinks.length);
	}
	
	// Now initiate the layout.
	nodeLink.data({
		nodes: nodes,
		nodeMap: nodeMap,
		links: links,
		connectednessRange: linkCountRange
	});
	
	nodeLink.layout($('#layoutType').val());
});

//END-EXAMPLE
};});