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
package oculus.aperture.graph.aggregation.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.UUID;

import oculus.aperture.graph.aggregation.ClusterConverter;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.data.QuantizedRange;
import oculus.aperture.spi.graph.GraphAggregationResult;


public class BasicClusterConverter implements ClusterConverter {
	
	protected Map<String, Node> nodeMap;
	protected Map<String, Link> linkMap;
	protected Map<String, QuantizedRange> nodeWeightRanges; 
	
    private boolean anonymizeIDs = false;
	
	
	public BasicClusterConverter(
		Map<String, Node> nodeMap,
		Map<String, Link> linkMap,
		Map<String, QuantizedRange> nodeWeightRanges
	) {
		this.nodeMap = nodeMap;
		this.linkMap = linkMap;
		this.nodeWeightRanges = nodeWeightRanges;
	}
	
	
	
	@Override
	public GraphAggregationResult convertClusterSet(
		Collection<Set<Node>> clusterSet
	) {
		// Create new hash map of clustered nodes
		final Map<String, Node> aggregatedNodes = new HashMap<String, Node>(clusterSet.size());
		final Map<String, Set<Node>> aggregatedSets = new HashMap<String, Set<Node>>(clusterSet.size());
		
		for (Set<Node> set : clusterSet) {
			
			// unique sets of each type found.
			Map<String, Set<Node>> typedSets = new HashMap<String, Set<Node>>();
			
			for (Node node : set) {
				Set<Node> typedSet = typedSets.get(node.getType());

				if (typedSet == null) {
					typedSet = new HashSet<Node>();
					typedSets.put(node.getType(), typedSet);
				}
				typedSet.add(node);
			}
			
			for (Entry<String, Set<Node>> typedSet : typedSets.entrySet()) {
				
				final Set<Node> nodes = typedSet.getValue();
				final String type = typedSet.getKey();
				final QuantizedRange weightRange = nodeWeightRanges.get(type);
				
				int size = nodes.size();
				if (size > 0) {
					if (size == 1) {
						Node node = nodes.iterator().next();
						aggregatedNodes.put(node.getId(), node);
						aggregatedSets.put(node.getId(), nodes);
					} else {
						final BasicAggregateNode aggr= BasicAggregateNode.fromMembers(
							type, 
							nodes, 
							weightRange, 
							(anonymizeIDs) ? UUID.randomUUID().toString() : null
						);
						
						aggregatedNodes.put(aggr.getId(), aggr);
						aggregatedSets.put(aggr.getId(), nodes);
					}
				}
			}
		}
		
		// create cluster node map
		Map<String, String> clusterNodeMap = new HashMap<String, String>();
		for (Node node : nodeMap.values()) {
			boolean isAggregated = false;
			for (Entry<String, Set<Node>> entry : aggregatedSets.entrySet()) {
				if (entry.getValue().contains(node)) {
					clusterNodeMap.put(node.getId(), entry.getKey());
					isAggregated = true;
					break;
				} 
			}
			
			if (isAggregated) {
				continue;
			}

			clusterNodeMap.put(node.getId(), node.getId());
			aggregatedNodes.put(node.getId(), node);
		}
		
		// map original links to new nodes
		final Map<String, Link> aggregatedLinks = new HashMap<String, Link>();
		for (Link link : linkMap.values()) {
			String source = clusterNodeMap.get(link.getSourceId());
			String target = clusterNodeMap.get(link.getTargetId());
			Double amount = link.getWeight();
			long number = link.getNumMembers();
			
			if (source == null ||
				source.isEmpty() ||
				target == null ||
				target.isEmpty() ||
				source.equalsIgnoreCase(target)
			) {
				continue;
			}
			
			String newLinkId = source + "_" + target;
			if (aggregatedLinks.containsKey(newLinkId)) {
				BasicAggregateLink aggLink = (BasicAggregateLink)aggregatedLinks.get(newLinkId);
				
				// add amount to aggregated link
				Double linkWeight = aggLink.getWeight();
				linkWeight += amount;
				aggLink.setWeight(linkWeight);
				
				// add number of links to aggregated link
				long linkNumber = aggLink.getNumMembers();
				linkNumber += number;
				aggLink.setNumMembers(linkNumber);
				
				continue;
			}
			
			aggregatedLinks.put(newLinkId, new BasicAggregateLink(newLinkId, source, target, amount, number));
		}
		
		return new BasicGraphAggregationResult(
			aggregatedNodes,
			aggregatedLinks,
			nodeWeightRanges,
			null
		);
	}



	@Override
	public void anonymizeAggregateIDs(boolean anonymizeIDs) {
		this.anonymizeIDs = anonymizeIDs;
	}
}