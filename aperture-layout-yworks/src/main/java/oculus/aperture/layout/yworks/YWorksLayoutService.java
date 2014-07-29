/**
 * Copyright (c) 2013 Oculus Info Inc. 
 * http://www.oculusinfo.com/
 * 
 * Released under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package oculus.aperture.layout.yworks;

import java.util.HashMap;
import java.util.Map;

import oculus.aperture.layout.impl.BridgedLayoutGraph;
import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.layout.options.GraphLayoutOptions;
import oculus.aperture.spi.layout.options.HorizontalTreeLayoutOptions;
import oculus.aperture.spi.layout.options.LayoutOptions;
import oculus.aperture.spi.layout.options.VerticalTreeLayoutOptions;
import y.base.NodeMap;
import y.geom.YPoint;
import y.layout.ComponentLayouter;
import y.layout.DefaultLayoutGraph;
import y.layout.LayoutGraph;
import y.layout.LayoutOrientation;
import y.layout.Layouter;
import y.layout.circular.CircularLayouter;
import y.layout.grouping.GroupingKeys;
import y.layout.hierarchic.HierarchicLayouter;
import y.layout.organic.SmartOrganicLayouter;
import y.view.hierarchy.HierarchyManager;

/**
 * Wrapper for applying layout algorithms of YWorks toolkit.
 * 
 * @author dcheng
 *
 */

public class YWorksLayoutService extends BridgedLayoutGraph {

	
	private LayoutGraph graph = new DefaultLayoutGraph();
	private Map<String, y.base.Node> graphNodes = new HashMap<String, y.base.Node>();

	
	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.impl.BridgedLayoutGraph#addLink(oculus.aperture.spi.layout.LayoutLink)
	 */
	@Override
	protected void onAddLink(Link link) {
		graph.createEdge(
				graphNodes.get(link.getSourceId()), 
				graphNodes.get(link.getTargetId()));
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.impl.BridgedLayoutGraph#addNode(oculus.aperture.spi.layout.LayoutNode)
	 */
	@Override
	protected void onAddNode(Node node) {
		y.base.Node ynode = graph.createNode();
		graph.setSize(ynode, node.getWidth(), node.getHeight());
		graph.setLocation(ynode, node.getX(), node.getY());
		
		graphNodes.put(node.getId(), ynode); 
	}
	

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.AbstractLayoutService#doLayout(oculus.aperture.spi.Properties)
	 */
	@Override
	protected void doLayout(LayoutOptions options) {
		
		// extract options, filling in defaults where missing.
		String layoutType = options.getLayoutType();
		final GraphLayoutOptions gopts = (GraphLayoutOptions) options;
		
		
		Layouter impl;
		
		// choose and parameterize layout
		if (layoutType.equals(GraphLayoutOptions.CIRCLE)){
			CircularLayouter layouter = new CircularLayouter();
			layouter.getBalloonLayouter().setMinimalEdgeLength(gopts.getLinkLength()); // increases compactness
			layouter.setLayoutStyle(CircularLayouter.BCC_COMPACT);
			impl = layouter;
			
		} else if (layoutType.equals(GraphLayoutOptions.RADIAL)){
			CircularLayouter layouter = new CircularLayouter();
			layouter.getBalloonLayouter().setMinimalEdgeLength(gopts.getLinkLength()); // increases compactness
			layouter.setLayoutStyle(CircularLayouter.BCC_ISOLATED);
			impl = layouter;

		} else if (layoutType.equals(HorizontalTreeLayoutOptions.HORIZONTAL_TREE)){
			HorizontalTreeLayoutOptions topts = (HorizontalTreeLayoutOptions) options;
			
			// Default layout type is a vertical tree.
			HierarchicLayouter layouter = new HierarchicLayouter();
			if (topts.isRightToLeft()){
				layouter.setLayoutOrientation(LayoutOrientation.RIGHT_TO_LEFT);
			} else {
				layouter.setLayoutOrientation(LayoutOrientation.LEFT_TO_RIGHT);	
			}
			layouter.setMinimalLayerDistance(topts.getTreeLevelDistance());
			layouter.setMinimalNodeDistance(topts.getNodeDistance());
			impl = layouter;
			
		} else if (layoutType.equals(VerticalTreeLayoutOptions.VERTICAL_TREE)){
			VerticalTreeLayoutOptions topts = (VerticalTreeLayoutOptions) options;
			
			// Default layout type is a vertical tree.
			HierarchicLayouter layouter = new HierarchicLayouter();
			if (topts.isBottomToTop()){
				layouter.setLayoutOrientation(LayoutOrientation.BOTTOM_TO_TOP);
			} else {
				layouter.setLayoutOrientation(LayoutOrientation.TOP_TO_BOTTOM);
			}
			layouter.setMinimalLayerDistance(topts.getTreeLevelDistance());
			layouter.setMinimalNodeDistance(topts.getNodeDistance());
			impl = layouter;
			
		// DEFAULT: ORGANIC
		} else {
			HierarchyManager graphHM =  new HierarchyManager(graph);
			graph.addDataProvider(SmartOrganicLayouter.NODE_SUBSET_DATA, graph.createNodeMap());
			graph.addDataProvider(GroupingKeys.NODE_ID_DPKEY, graphHM.getNodeIdDataProvider());
			graph.addDataProvider(GroupingKeys.GROUP_DPKEY, graphHM.getGroupNodeDataProvider());
			graph.addDataProvider(GroupingKeys.PARENT_NODE_ID_DPKEY, graphHM.getParentNodeIdDataProvider());
			
			NodeMap activeNodes = (NodeMap) graph.getDataProvider(SmartOrganicLayouter.NODE_SUBSET_DATA);
			
			for (String nodeId : graphNodes.keySet()){
				y.base.Node node = graphNodes.get(nodeId);
				activeNodes.setBool(node, true);
			}
			
			SmartOrganicLayouter layouter = new SmartOrganicLayouter();
			//layouter.setScope(SmartOrganicLayouter.SCOPE_SUBSET);
			layouter.setScope(SmartOrganicLayouter.SCOPE_ALL);
			layouter.setNodeSizeAware(true);
			layouter.setNodeOverlapsAllowed(false);
			layouter.setPreferredMinimalNodeDistance(gopts.getNodeDistance());
			layouter.setPreferredEdgeLength(gopts.getLinkLength());
			
			final Extents ex = options.getPageExtents();

			// layout selected graph
			ComponentLayouter componentLayouter = (ComponentLayouter)layouter.getComponentLayouter();
			componentLayouter.setStyle(ComponentLayouter.STYLE_ROWS);
			componentLayouter.setComponentArrangementEnabled(true);
			if (ex != null) {
				componentLayouter.setPreferredLayoutSize(ex.getWidth(), ex.getHeight());
			}
			
			impl = layouter;
		}
		
		impl.doLayout(graph);
		
		//  copy positions back in.
		for (Node node : getNodes()) {
			final String id = node.getId();
			final y.base.Node ynode = graphNodes.get(id);
			final YPoint location = graph.getLocation(ynode);
			
			node.setX((int)location.getX());
			node.setY((int)location.getY());
		}
	}


}
