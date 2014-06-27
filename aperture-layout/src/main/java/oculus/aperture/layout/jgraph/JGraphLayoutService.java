/**
 * Copyright (c) 2013-2014 Oculus Info Inc. 
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
package oculus.aperture.layout.jgraph;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import oculus.aperture.layout.impl.BridgedLayoutGraph;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.layout.options.GraphLayoutOptions;
import oculus.aperture.spi.layout.options.HorizontalTreeLayoutOptions;
import oculus.aperture.spi.layout.options.LayoutOptions;
import oculus.aperture.spi.layout.options.TreeLayoutOptions;
import oculus.aperture.spi.layout.options.VerticalTreeLayoutOptions;

import com.mxgraph.layout.mxCircleLayout;
import com.mxgraph.layout.mxCompactTreeLayout;
import com.mxgraph.layout.mxFastOrganicLayout;
import com.mxgraph.layout.mxGraphLayout;
import com.mxgraph.model.mxCell;
import com.mxgraph.model.mxGraphModel;
import com.mxgraph.util.mxRectangle;
import com.mxgraph.view.mxGraph;

/**
 * Wrapper for applying layout algorithms of JGraph toolkit.
 * 
 * @author dcheng
 *
 */
public class JGraphLayoutService extends BridgedLayoutGraph {
	
	
	private mxGraph graph;
	private mxCell defaultParent;
	private Map<String, mxCell> graphNodes = new HashMap<String, mxCell>();

	/**
	 * Constructs a new jgraph implementation
	 */
	public JGraphLayoutService() {
		graph = new mxGraph();
		defaultParent = (mxCell) graph.getDefaultParent();

		// open immediately for update
		graph.getModel().beginUpdate();
	}
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.layout.AbstractLayoutService#doLayout(oculus.aperture.spi.Properties)
	 */
	@Override
	protected void doLayout(LayoutOptions options) {
		final String layoutType = options.getLayoutType();
		final String tempRootId = "_tempR00t_";

		List<Object> tempObjects = new ArrayList<Object>();
		mxGraphLayout layout;
		
		if (layoutType.equals(VerticalTreeLayoutOptions.VERTICAL_TREE) ||
				layoutType.equals(HorizontalTreeLayoutOptions.HORIZONTAL_TREE)){

			TreeLayoutOptions topts = (TreeLayoutOptions) options;

			String rootId = topts.getRootId();
			boolean hasValidRoot = false;
			// Check if there is a user defined root node.
			if (rootId != null){
				Object rootObj = ((mxGraphModel)graph.getModel()).getCell(rootId);
				if (rootObj != null){
					mxCell rootCell = (mxCell)rootObj;
					graph.getModel().setRoot(rootCell);
					hasValidRoot = true;
				}
			}

			// Check if the graph topology has a natural root
			// node, if not we want to create a temporary one
			// that will be removed after the layout has been
			// applied.
			if (!hasValidRoot) {
				// Find all children of a given parent which do not have incoming edges.
				List<Object> roots = graph.findTreeRoots(defaultParent);
				if (roots.size() > 1){
					// Create a new root.
					mxCell rootCell = (mxCell) graph.insertVertex(defaultParent, null, tempRootId, 0, 0, 1, 1);
					rootCell.setId(tempRootId);
					tempObjects.add(rootCell);
					// Now create edges between the temp root node.
					for (int i=0; i < roots.size(); i++){
						mxCell tRoot = (mxCell)roots.get(i);
						tempObjects.add(graph.insertEdge(defaultParent, "edge_" + rootCell.getId() + "_" + tRoot.getId(), "edge", 
								rootCell, tRoot));
					}
				}
			}
			
			boolean isInverted = false;
			mxCompactTreeLayout treeLayout;

			if (layoutType.equals(VerticalTreeLayoutOptions.VERTICAL_TREE)) {
				isInverted = !((VerticalTreeLayoutOptions)topts).isBottomToTop();
				treeLayout = new mxCompactTreeLayout(graph, false, isInverted);
			} else {
				isInverted = ((HorizontalTreeLayoutOptions)topts).isRightToLeft();
				treeLayout = new mxCompactTreeLayout(graph, true, isInverted);
			}

			treeLayout.setNodeDistance(topts.getNodeDistance());
			treeLayout.setLevelDistance(topts.getTreeLevelDistance());
			
			layout = treeLayout;
			
		} else if (layoutType.equals(GraphLayoutOptions.CIRCLE) ||
				layoutType.equals(GraphLayoutOptions.RADIAL)){
			final GraphLayoutOptions gopts = (GraphLayoutOptions) options;
			
			if (gopts.getLinkLength() > 0) {
				layout = new mxCircleLayout(graph, gopts.getLinkLength());
				
			} else {
				// Use the default radius set by JGraph.
				layout = new mxCircleLayout(graph);
			}
			
		// default is organic.
		} else {
			// ????
			double forceConstant_ = 200; // fast organic
			double initialTemp_ = 200; // fast organic
			
			mxFastOrganicLayout organicLayout = new mxFastOrganicLayout(graph);
			organicLayout.setForceConstant(forceConstant_);
			organicLayout.setInitialTemp(initialTemp_);
			organicLayout.setUseInputOrigin(true);
			
			layout = organicLayout;
		}
		
		// let if fly
		layout.execute(defaultParent);
		
		// mark the end of changes
		graph.getModel().endUpdate();
		
		// Remove any temporary objects.
		if (tempObjects.size() > 0){
			graph.removeCells(tempObjects.toArray());
		}
		
		//  copy positions back in.
		for (Node node : getNodes()) {
			final String id = node.getId();
			final mxRectangle bounds = graphNodes.get(id).getGeometry();

			node.setX((int)bounds.getX()); 
			node.setY((int)bounds.getY());
		}
	}
	
	
	
	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.impl.BridgedLayoutGraph#addLink(oculus.aperture.spi.layout.LayoutLink)
	 */
	@Override
	protected void onAddLink(Link link) {
		graph.insertEdge(defaultParent, null, "edge", 
				graphNodes.get(link.getSourceId()), graphNodes.get(link.getTargetId()));
	}

	
	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.impl.BridgedLayoutGraph#addNode(oculus.aperture.spi.layout.LayoutNode)
	 */
	@Override
	protected void onAddNode(Node node) {
		mxCell cell = (mxCell)graph.insertVertex(defaultParent, node.getId(), node.getId(), 
				node.getX(), node.getY(), node.getWidth(), node.getHeight());
		graphNodes.put(node.getId(), cell); 
	}


}
