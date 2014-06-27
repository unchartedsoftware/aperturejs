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
package oculus.aperture.layout.ffd;

import java.awt.geom.Point2D;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;

import org.apache.log4j.Logger;

public class FFDMultigraphLayouter {

	private static final Logger logger = Logger.getLogger(FFDMultigraphLayouter.class);
	private class GraphModel {
		private Collection<Node> nodeList_;
		private Collection<Link> edgeList_;

		public GraphModel(Collection<Node> nodeMap, Collection<Link> edgeMap){
			this.nodeList_ = nodeMap;
			this.edgeList_ = edgeMap;
		}
		public Collection<Node> getNodes(){
			return this.nodeList_;
		}
		public Collection<Link> getEdges(){
			return this.edgeList_;
		}
	}	
	private GraphModel createSubgraph(Collection<? extends Node> nodes, Collection<? extends Link> edges) {
		Map<String, Node> nodeMap = new HashMap<String, Node>();
		Collection<Link> subLinks = new ArrayList<Link>();
        //Put all the nodes into the subgraph
		for (Node node : nodes) {
			nodeMap.put(node.getId(), node);
		}
		
		//Go through all the edges, and put those that have both origin and destination nodes in the nodes collection into the subgraph
		for (Link edge : edges) {
			if (edge.getSourceId() == null || edge.getTargetId() == null) continue;
			
			if (nodeMap.containsKey(edge.getSourceId()) && nodeMap.containsKey(edge.getTargetId())) {
				// add an edge if both ends are in the graph
				subLinks.add(edge);
			}
		}
		return new GraphModel(new ArrayList<Node>(nodeMap.values()), subLinks);
	}

	public NodesPositionState determineLayout(Collection<? extends Node> nodeList, Collection<? extends Link> edgeList)
			throws Exception {

		if (nodeList.size() == 0) {
			return new NodesPositionState();
		} 
		else if (nodeList.size() == 1) {
			NodesPositionState nps = new NodesPositionState();
			for (Node layoutNode : nodeList){
				layoutNode.setX(0);
				layoutNode.setY(0);
				nps.setPosition(layoutNode.getId(), 0, 0);
			}
			return nps;
		}
		else  {
			logger.info("Using parallel layout");
			
			FFDLayouter ofdlp = new FFDLayouter();
			//return ofdlp.determineLayout(inModel);
			
			// Create mappings between ids and node/edge objects.
			Map<String, Node> fullNodeMap = new HashMap<String, Node>();
			for (Node node : nodeList){
				fullNodeMap.put(node.getId(), node);
			}
			
			Map<String, Collection<Link>> fullLinkMap = new HashMap<String, Collection<Link>>();		
			Collection<Link> linkList = null;
			
			for (Link link : edgeList){
				String sourceId = link.getSourceId();
				String targetId = link.getTargetId();

				linkList = fullLinkMap.get(sourceId);
				if (linkList == null){
					linkList = new ArrayList<Link>();
				}
				if (!linkList.contains(link)){
					linkList.add(link);
					fullLinkMap.put(sourceId, linkList);
				}

				linkList = fullLinkMap.get(targetId);
				if (linkList == null){
					linkList = new ArrayList<Link>();
				}
				if (!linkList.contains(link)){
					linkList.add(link);
					fullLinkMap.put(targetId, linkList);
				}
			}
			
			Set<Set<Node>> subgraphs = ofdlp.getConnectedComponents(nodeList, fullNodeMap, fullLinkMap);
			logger.info("Partitions : "+subgraphs.size());
			Set<NodesPositionState> nodeStates = new HashSet<NodesPositionState>();
			for (Set<Node> component : subgraphs) {
				if (component.size() == 0) {
					logger.error("Found connected component with 0 nodes!");
					continue;
				}
				else if (component.size() == 1) {
					NodesPositionState nps = new NodesPositionState();
					Node layoutNode = component.iterator().next();
					layoutNode.setX(0);
					layoutNode.setY(0);
					nps.setPosition(layoutNode.getId(), 0, 0);
					nodeStates.add(nps);
				} 
				else {
					GraphModel graph = createSubgraph(component, edgeList);
					logger.info("Layout "+component.size()+" node partition");
					NodesPositionState nps = ofdlp.determineLayout(graph.getNodes(), graph.getEdges() );
					nodeStates.add(nps);
				}
			}
			
			//Merge node states
			logger.info("Determine final partition placement");
			Map<NodesPositionState, Point2D> offset = NodesStatePositionUtils.computeNPSOffsets(nodeStates);
			
			NodesPositionState finalPos = new NodesPositionState();
			double finalX=0, finalY=0;
			for (NodesPositionState nps : offset.keySet()) {
				Point2D off = offset.get(nps);
				for (String id : nps.getNodeIds()) {
					Node layoutNode = fullNodeMap.get(id);
					
					finalX = layoutNode.getX()+off.getX();
					finalY = layoutNode.getY()+off.getY(); 
					finalPos.setPosition(id, finalX, finalY);

					layoutNode.setX((int)finalX);
					layoutNode.setY((int)finalY);
				}
			}
			
			return finalPos;
		} 
		
	}

//	@Override
//	public void setFixedNodeSet(Collection<INodeModel> fixedNodes) {
//		//Currently not supported
//	}
//
//	@Override
//	public int getMaxSuggestedGraphSize() {
//		return Integer.parseInt(System.getProperty("guarddog.ffd.max.suggested", "500000"));
//	}
//	@Override
//	public boolean isUserInvokable() {
//		return true;
//	}
}
