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
import java.util.Set;

import oculus.aperture.common.BasicNode;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.data.QuantizedRange;
import oculus.aperture.spi.graph.AggregateNode;

public class BasicAggregateNode extends BasicNode implements AggregateNode {

	private long[] memberDist;
	private Map<String, Double> memberWeights;
	private Map<String, String> memberLabels;
	private Set<String> memberIDs;
	private Node topMember;
	
	
	
	
	/**
	 * 
	 */
	public BasicAggregateNode(
		String id, 
		String nodeType,
		long numMembers,
		Set<String> memberIDs,
		Node topMember,
		Map<String, Double> memberWeights,
		Map<String, String> memberLabels
	) {
		super(id, nodeType);

		this.memberIDs = memberIDs;
		this.topMember = topMember;
		this.memberWeights = memberWeights;
		this.memberLabels = memberLabels;
		
		setNumMembers(numMembers);
	}
	
	/*
	 * (non-Javadoc)
	 * @see oculus.charitynet.spi.AggregateNode#getLabel()
	 */
	@Override
	public String getLabel() {
		if (super.getLabel() != null)
			return super.getLabel();
		
		// pluralize type
		String type = getType().charAt(getType().length()-1) == 'y'? 
				getType().substring(0, getType().length()-1) + "ies" : getType() + "s";
				
		return "" + getNumMembers() + " "+ type;
	}

	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.AggregateNode#getWeightDist()
	 */
	@Override
	public long[] getWeightDist() {
		return memberDist;
	}

	/**
	 * 
	 * @param membersByWeightBin
	 */
	public void setWeightDist(long[] membersByWeightBin) {
		memberDist= membersByWeightBin;
	}
	
	/**
	 * Creates an aggregate from a set of member nodes.
	 * @param nodeType
	 * @param members
	 * @param aggregateId UUID of the aggregate node. Default is NULL. If this is set, this will be used as the node's id instead the CSV-based id.
	 * @return
	 */
	public static BasicAggregateNode fromMembers(String nodeType, Collection<Node> members, QuantizedRange weightRange, String aggregateId) {
		
		//String charityNodeId = UUID.randomUUID().toString();
		// ID of aggregated node is a CSV string of all its
		// constituent nodes.
		final StringBuilder charityNodeBuild = new StringBuilder();
		
		// label begins with the most important member.
		String label = null;
		
		double maxWeight= -1;
		double weight = 0;
		final long weightBins[] = new long[weightRange.getBands().size()];
		Node topMember = null;
		int numMembers = 0;
		Map<String, Double> weights = new HashMap<String, Double>();
		Map<String, String> labels = new HashMap<String, String>();
		
		Set<String> ids = new HashSet<String>();
		for (Node node : members){
			
			ids.addAll(getIds(node));
			numMembers += getNumMembers(node);
			
			// append to label
			charityNodeBuild.append(node.getId());
			charityNodeBuild.append(',');
			
			// find most important child.
			Node mostImportantChild = getTopMember(node);
			if (mostImportantChild != null && maxWeight < mostImportantChild.getWeight()) {
				maxWeight = mostImportantChild.getWeight();
				label = mostImportantChild.getLabel();
				topMember = mostImportantChild;
			}
			
			Map<String, Double> memberWeights = getWeights(node);
			for (double memberWeight :memberWeights.values()) {
				weight += memberWeight;
				weightBins[weightRange.bandIndex(memberWeight)]++;
			}
			weights.putAll(memberWeights);
			
			Map<String, String> memberLabels = getLabels(node);
			labels.putAll(memberLabels);
		}
		charityNodeBuild.setLength(charityNodeBuild.length()-1);
		
		final String charityNodeId = aggregateId == null?charityNodeBuild.toString():aggregateId;
		
		final BasicAggregateNode aggr = new BasicAggregateNode(
			charityNodeId, 
			nodeType,
			numMembers,
			ids,
			topMember,
			weights,
			labels
		);
		
		aggr.setLabel(label + " +" + (numMembers-1));
		
		aggr.setWeight(weight);
		aggr.setWeightDist(weightBins);

		return aggr;
	}
	
	
	
	
	private static Map<String, Double> getWeights(Node node) {
		
		if (node instanceof AggregateNode) {
			AggregateNode aggNode = (AggregateNode)node;
			if (aggNode.getWeights().size() > 0) {
				return aggNode.getWeights();
			}
		}
					
		Map<String, Double> result = new HashMap<String, Double>(1);
		result.put(node.getId(), node.getWeight());
		
		return result;
	}
	
	
	
	
	private static Map<String, String> getLabels(Node node) {
		
		if (node instanceof AggregateNode) {
			AggregateNode aggNode = (AggregateNode)node;
			if (aggNode.getMemberLabels().size() > 0) {
				return aggNode.getMemberLabels();
			}
		}
					
		Map<String, String> result = new HashMap<String, String>(1);
		result.put(node.getId(), node.getLabel());
		
		return result;
	}
	
	
	
	
	private static Node getTopMember(Node node) {
		
		if (node instanceof AggregateNode) {
			AggregateNode aggNode = (AggregateNode)node;
			if (aggNode.getTopContributingMember() != null) {
				return aggNode.getTopContributingMember();
			}
		}
		
		return node;
	}
	
	
	
	
	private static Set<String> getIds(Node node) {
		
		Set<String> result = new HashSet<String>();
		
		if (node instanceof AggregateNode) {
			AggregateNode aggNode = (AggregateNode)node;
			if (aggNode.getNumMembers() > 0) {
				result.addAll(((AggregateNode)node).getMemberIDs());
				return result;
			}
		}
		
		result.add(node.getId());
		return result;
	}
	
	
	
	
	private static int getNumMembers(Node node) {
		
		if (node instanceof AggregateNode) {
			AggregateNode aggNode = (AggregateNode)node;
			if (aggNode.getNumMembers() > 0) {
				return (int)aggNode.getNumMembers();
			}
		}
		
		return 1;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.AggregateNode#getMemberIDs()
	 */
	@Override
	public Set<String> getMemberIDs() {
		return memberIDs;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.AggregateNode#getTopContributingMember()
	 */
	@Override
	public Node getTopContributingMember() {
		return topMember;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.AggregateNode#getWeights()
	 */
	@Override
	public Map<String, Double> getWeights() {
		return memberWeights;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.spi.AggregateNode#getLabels()
	 */
	@Override
	public Map<String, String> getMemberLabels() {
		return memberLabels;
	}
}
