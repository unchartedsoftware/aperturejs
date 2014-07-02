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

import java.util.Map;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.data.QuantizedRange;
import oculus.aperture.spi.graph.GraphAggregationResult;

/**
 * A simple wrapping of a set of aggregation results.
 * 
 * @author djonker
 */
public class BasicGraphAggregationResult implements GraphAggregationResult {

	private final Map<String, QuantizedRange> linkWeightRanges;
	private final Map<String, QuantizedRange> nodeWeightRanges;
	private final Map<String, ? extends Link> links;
	private final Map<String, ? extends Node> nodes;
	private final long maxNumMembers;
	
	
	
	
	/**
	 * Clones the graph aggregation result.
	 */
	public BasicGraphAggregationResult(GraphAggregationResult aggregationResult) {
		nodes = aggregationResult.getNodes();
		links = aggregationResult.getLinks();
		nodeWeightRanges = aggregationResult.getNodeWeightRanges();
		linkWeightRanges = aggregationResult.getLinkWeightRanges();
		maxNumMembers = aggregationResult.getMaxNumMembers();
	}
	
	
	
	
	/**
	 * Sets all fields in construction
	 */
	public BasicGraphAggregationResult(
		Map<String, Node> nodes,
		Map<String, Link> links,
		Map<String, QuantizedRange> nodeWeightRanges,
		Map<String, QuantizedRange> linkWeightRanges
	) {
		
		this.nodes = nodes;
		this.links = links;
		this.nodeWeightRanges = nodeWeightRanges;
		this.linkWeightRanges = linkWeightRanges;
		
		long max= 1;
		for (Node node : nodes.values()) {
			if (max < node.getNumMembers()) {
				max = node.getNumMembers();
			}
		}
		this.maxNumMembers = max;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.GraphAggregationService.GraphAggregationResult#getNodes()
	 */
	@Override
	public Map<String, ? extends Node> getNodes() {
		return nodes;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.GraphAggregationService.GraphAggregationResult#getLinks()
	 */
	@Override
	public Map<String, ? extends Link> getLinks() {
		return links;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.GraphAggregationService.GraphAggregationResult#getNodeWeightRanges()
	 */
	@Override
	public Map<String, QuantizedRange> getNodeWeightRanges() {
		return nodeWeightRanges;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.GraphAggregationService.GraphAggregationResult#getLinkWeightRanges()
	 */
	@Override
	public Map<String, QuantizedRange> getLinkWeightRanges() {
		return linkWeightRanges;
	}
	
	
	
	
	/*
	 * (non-Javadoc)
	 * @see oculus.charitynet.spi.GraphAggregationService.GraphAggregationResult#getMaxNumMembers()
	 */
	public long getMaxNumMembers() {
		return maxNumMembers;
	}
	
	
	
	
}
