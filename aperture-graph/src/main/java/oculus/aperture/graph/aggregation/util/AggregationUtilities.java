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
package oculus.aperture.graph.aggregation.util;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import oculus.aperture.common.data.BoundedLinearQuantizedRange;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.data.QuantizedRange;

import org.apache.commons.lang3.time.StopWatch;
import org.jgrapht.DirectedGraph;
import org.jgrapht.alg.ConnectivityInspector;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class AggregationUtilities {
	
	private final static Logger logger = LoggerFactory.getLogger(AggregationUtilities.class);
	
	public static final int DEFAULT_NUM_WEIGHT_BINS = 5;
	
	
	public static Collection<Pair<Map<String, Node>, Map<String, Link>>> findSubgraphs(
		Map<String, Node> nodeMap,
		Map<String, Link> linkMap
	) {
		logger.debug("Running subgraph finding algorithm...");
		
		StopWatch overallStopWatch = new StopWatch();
		overallStopWatch.start();
		
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
	
		// create a JGraphT graph
		DirectedGraph<Node, Link> graph = new DefaultDirectedGraph<Node, Link>(Link.class);
			
		// populate the graph with our nodes and links
		for (Node node : nodeMap.values()) {
			graph.addVertex(node);
		}
		
		for (Link link : linkMap.values()) {
			graph.addEdge( 
				nodeMap.get(link.getSourceId()), 
				nodeMap.get(link.getTargetId()),
				link
			);
		}
		
		stopWatch.stop();
		logger.debug("Graph creation time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		// using the JGraphT 
		ConnectivityInspector<Node, Link> inspector = new ConnectivityInspector<Node, Link>(graph);
		List<Set<Node>> connectedSets = inspector.connectedSets();
		
		stopWatch.stop();
		logger.debug("Connectivity calculation time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		// If the original graph is a fully connected graph then we simply return the original graph
		if (connectedSets.size() == 1) {
			Pair<Map<String, Node>, Map<String, Link>> full_graph = new Pair<Map<String, Node>, Map<String, Link>>(nodeMap, linkMap);
			List<Pair<Map<String, Node>, Map<String, Link>>> returnList = new ArrayList<Pair<Map<String, Node>, Map<String, Link>>>(1);
			returnList.add(full_graph);
			return returnList;
		}
		
		// Iterate over the connected sets and create new subgraphs
		List<Pair<Map<String, Node>, Map<String, Link>>> returnList = new ArrayList<Pair<Map<String, Node>, Map<String, Link>>>(connectedSets.size());
		for (Set<Node> subgraph : connectedSets) {
			Map<String, Node> subgraphNodeMap = new HashMap<String, Node>(subgraph.size());
			Map<String, Link> subgraphLinkMap = new HashMap<String, Link>(subgraph.size());
			
			for (Node source : subgraph) {
				
				subgraphNodeMap.put(source.getId(), source);
				
				for (Node target : subgraph) {
					Set<Link> links = graph.getAllEdges(source, target);
					if (links == null || links.isEmpty()) {
						continue;
					}
					
					for (Link link : links) {
						subgraphLinkMap.put(link.getId(), link);
					}
				}
			}
			
			Pair<Map<String, Node>, Map<String, Link>> subgraphPair = new Pair<Map<String, Node>, Map<String, Link>>(
				subgraphNodeMap, 
				subgraphLinkMap
			);
			returnList.add(subgraphPair);
		}
		
		stopWatch.stop();
		logger.debug("Subgraph partitioning time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		overallStopWatch.stop();
		logger.debug("Finished subgraph finding algorithm.");
		logger.debug("Algorithm took " + overallStopWatch.toString());
		overallStopWatch.reset();
		
		return returnList;
	}
	
	
	
	
	public static Collection<Node> getNeighbors(
    	Node node,
		Map<String, Node> nodeMap
	) {
		Map<String, Node> neighbors = new HashMap<String, Node>();
		
		for (Link link : node.getIncidentLinks()) {
			String id;
			if (!link.getSourceId().equalsIgnoreCase(node.getId())) {
				id = link.getSourceId();
			} else {
				id = link.getTargetId();
			}
			Node neighbour = nodeMap.get(id);
			if (neighbour != null) {
				neighbors.put(neighbour.getId(), neighbour);
			}
		}
		
		return neighbors.values();
	}
	
	
	
	
	public static double getTotalDegree(
    	Node node,
		Map<String, Node> nodeMap, 
		Map<String, Link> linkMap
	) {
    	double degree = 0;
		
		for (Link link : linkMap.values()) {
			if (link.getSourceId().equalsIgnoreCase(node.getId()) ||
				link.getTargetId().equalsIgnoreCase(node.getId())
			) {
				if (link.getSourceId().equalsIgnoreCase(link.getTargetId())) continue;
				degree++;
			}
		}
		
		return degree;
	}
	
	
	
	
	public static Map<String, QuantizedRange> updateNodeWeightRanges(Map<String, QuantizedRange> weightRanges, Collection<Node> nodes) {

		// if this hasn't been supplied, then create it.
		if (weightRanges == null) {
			weightRanges = new HashMap<String, QuantizedRange>();
		}
		
		// start by processing for ranges.
		for (Node node : nodes) {
			QuantizedRange weightRange = weightRanges.get(node.getType());
			if (weightRange == null) {
				weightRanges.put(node.getType(), 
						weightRange= new BoundedLinearQuantizedRange(DEFAULT_NUM_WEIGHT_BINS));
			}
			weightRange.expand(node.getWeight());
		}
		
		return weightRanges;
	}
}