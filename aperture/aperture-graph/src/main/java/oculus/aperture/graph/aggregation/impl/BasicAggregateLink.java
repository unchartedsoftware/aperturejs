package oculus.aperture.graph.aggregation.impl;

import oculus.aperture.common.BasicLink;


public class BasicAggregateLink extends BasicLink {

	/**
	 * Constructs a new link set wrapper for a json array
	 */
	public BasicAggregateLink(
		String id,
		String sourceId,
		String targetId,
		double weight,
		long numMembers
	) {
		super(id, sourceId, targetId);
		setWeight(weight);
		setNumMembers(numMembers);
	}
}
