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
import java.util.LinkedList;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import oculus.aperture.graph.aggregation.ClusterConverter;
import oculus.aperture.graph.aggregation.OculusAggregator;
import oculus.aperture.graph.aggregation.util.AggregationUtilities;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.graph.GraphAggregationResult;

import org.apache.commons.lang3.time.StopWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LouvainAggregator implements OculusAggregator {
	
	private final static Logger logger = LoggerFactory.getLogger(LouvainAggregator.class);
	
	protected ClusterConverter clusterer = null;
    protected Map<String, Node> nodeMap = null;
    protected Map<String, Link> linkMap = null;
    protected CommunityStructure structure = null;
    protected volatile Collection<Set<Node>> clusterSet = null;
    protected volatile GraphAggregationResult graphResult = null;
    
    private double resolution;
    private volatile boolean cancel = false;
    private String status = STATUS_WAITING;
    private int progress;
	private boolean calculateLinkWeights = true;
    
    
    public LouvainAggregator(
    	double resolution
    ) {
    	this.resolution = resolution;
    }
    
    
    
    
    protected double getLinkWeight(Node node, Node neighbor) {
		
    	if (linkMap == null) {
    		return 0.0;
    	}
    	
    	if (!calculateLinkWeights) {
    		return 1.0;
    	}
    	
		double linkWeight = 0;
		
		for (Link link : node.getIncidentLinks()) {
			if ((link.getSourceId().equalsIgnoreCase(node.getId()) && link.getTargetId().equalsIgnoreCase(neighbor.getId())) ||
				(link.getSourceId().equalsIgnoreCase(neighbor.getId()) && link.getTargetId().equalsIgnoreCase(node.getId()))
			) {
				linkWeight += link.getWeight();
			}
		}
		
		return linkWeight;
	}
    
    
    
    
    protected void parceCommunities(
    	final int[] comStructure
	) {
    	if (nodeMap == null ||
    		structure == null
    	) {
    		return;
    	}
    	
    	Map<Integer, Set<Node>> clusterMap = new HashMap<Integer, Set<Node>>();
    	for (Node node : nodeMap.values()) {
    		
    		int index = comStructure[structure.map.get(node)];
    		
    		if (clusterMap.containsKey(index)) {
    			Set<Node> cluster = clusterMap.get(index);
    			cluster.add(node);
    		} else {
    			Set<Node> cluster = new HashSet<Node>();
    			cluster.add(node);
    			clusterMap.put(index, cluster);
    		}
    	}
    	
    	clusterSet = clusterMap.values();
    	
    	if (clusterer != null) {
    		graphResult = clusterer.convertClusterSet(clusterSet);
    	}
	}
    
    
    
    
    private double q(
    	int node, 
    	Community community
    ) {
    	if (structure == null) {
    		return 0.0;
    	}
    	
        Double edgesToDouble = structure.nodeConnectionsWeight[node].get(community);
        double edgesTo = 0;
        if (edgesToDouble != null) {
            edgesTo = edgesToDouble.doubleValue();
        }
        double weightSum = community.weightSum;
        double nodeWeight = structure.weights[node];
        
        double qValue;
        if ((structure.nodeCommunities[node] == community) && (structure.nodeCommunities[node].size() > 1)) {
            qValue = resolution * edgesTo - (nodeWeight * (weightSum - nodeWeight)) / (2.0 * structure.graphWeightSum);
        } else if ((structure.nodeCommunities[node] == community) && (structure.nodeCommunities[node].size() == 1)) {
            qValue = 0.0;
        } else {
        	qValue = resolution * edgesTo - (nodeWeight * weightSum) / (2.0 * structure.graphWeightSum);
        }
        
        return qValue;
    }
    
    
    
    
    
    protected class ModEdge {

        private int source;
        private int target;
        private double weight;

        public ModEdge(int source, int target, double weight) {
            this.source = source;
            this.target = target;
            this.weight = weight;
        }
        
        public int getSource() {
        	return source;
        }
        
        public int getTarget() {
        	return target;
        }
        
        public double getWeight() {
        	return weight;
        }
    }
    
    
    
    
    protected class CommunityStructure {

        private Map<Community, Double>[] nodeConnectionsWeight;
        private Map<Community, Integer>[] nodeConnectionsCount;
        private Map<Node, Integer> map;
        private Community[] nodeCommunities;
        private double[] weights;
        private double graphWeightSum;
        private LinkedList<ModEdge>[] topology;
        private LinkedList<Community> communities;
        private int N;
        private Map<Integer, Community> invMap;
        
        
        
        
        @SuppressWarnings("unchecked")
		CommunityStructure() {
        	
        	if (nodeMap == null ||
        		linkMap == null
        	) {
        		return;
        	}
            
            N = nodeMap.size();
            
            nodeConnectionsWeight = new HashMap[N];
            nodeConnectionsCount = new HashMap[N];
            nodeCommunities = new Community[N];
            topology = new LinkedList[N];
            weights = new double[N];
            map = new HashMap<Node, Integer>();
            invMap = new HashMap<Integer, Community>();
            communities = new LinkedList<Community>();
            
            int index = 0;
            for (Node node : nodeMap.values()) {
            	
            	if (cancel) {
            		setStatusWaiting();
            		return;
            	}
            	
                map.put(node, index);
                nodeCommunities[index] = new Community(this);
                nodeConnectionsWeight[index] = new HashMap<Community, Double>();
                nodeConnectionsCount[index] = new HashMap<Community, Integer>();
                weights[index] = 0;
                nodeCommunities[index].seed(index);
                Community hidden = new Community(structure);
                hidden.nodes.add(index);
                invMap.put(index, hidden);
                communities.add(nodeCommunities[index]);               
                index++;
            } 
            
            double progressInterval = 89.0 / (double)nodeMap.size();
            double progressAccumulation = 0;

            for (Node node : nodeMap.values()) {
            	
            	progressAccumulation += progressInterval;
            	if (progressAccumulation >= 1.0) {
            		progress += Math.round(progressAccumulation);
            		progressAccumulation = 0;
            	}
            			
            	if (cancel) {
            		setStatusWaiting();
            		return;
            	}
            	
                int node_index = map.get(node);
                topology[node_index] = new LinkedList<ModEdge>();

                for (Node neighbor : AggregationUtilities.getNeighbors(node, nodeMap)) {
                	
                	if (cancel) {
                		setStatusWaiting();
                		return;
                	}
                	
                    if (node == neighbor) {
                        continue;
                    }
                    int neighbor_index = map.get(neighbor);
                    double weight = getLinkWeight(node, neighbor);
                      
                    weights[node_index] += weight;
                    ModEdge me = new ModEdge(node_index, neighbor_index, weight);
                    topology[node_index].add(me);
                    Community adjCom = nodeCommunities[neighbor_index];
                    nodeConnectionsWeight[node_index].put(adjCom, weight);
                    nodeConnectionsCount[node_index].put(adjCom, 1);
                    nodeCommunities[node_index].connectionsWeight.put(adjCom, weight);
                    nodeCommunities[node_index].connectionsCount.put(adjCom, 1);
                    nodeConnectionsWeight[neighbor_index].put(nodeCommunities[node_index], weight);
                    nodeConnectionsCount[neighbor_index].put(nodeCommunities[node_index], 1);
                    nodeCommunities[neighbor_index].connectionsWeight.put(nodeCommunities[node_index], weight);
                    nodeCommunities[neighbor_index].connectionsCount.put(nodeCommunities[node_index], 1);
                    graphWeightSum += weight;
                }
            }
            graphWeightSum /= 2.0;
        }
        
        
        
        
		private void addNodeTo(int node, Community to) {
            to.add(new Integer(node));
            nodeCommunities[node] = to;

            for (ModEdge e : topology[node]) {
                int neighbor = e.getTarget();

                // Remove Node Connection to this community
                Double neighEdgesTo = nodeConnectionsWeight[neighbor].get(to);
                if (neighEdgesTo == null) {
                    nodeConnectionsWeight[neighbor].put(to, e.getWeight());
                } else {
                    nodeConnectionsWeight[neighbor].put(to, neighEdgesTo + e.getWeight());
                }
                
                Integer neighCountEdgesTo = nodeConnectionsCount[neighbor].get(to);
                if (neighCountEdgesTo == null) {
                    nodeConnectionsCount[neighbor].put(to, 1);
                } else {
                    nodeConnectionsCount[neighbor].put(to, neighCountEdgesTo + 1);
                }

                Community adjCom = nodeCommunities[neighbor];
                Double wEdgesto = adjCom.connectionsWeight.get(to);
                if (wEdgesto == null) {
                    adjCom.connectionsWeight.put(to, e.weight);
                } else {
                    adjCom.connectionsWeight.put(to, wEdgesto + e.weight);
                }
                
                Integer cEdgesto = adjCom.connectionsCount.get(to);
                if (cEdgesto == null) {
                    adjCom.connectionsCount.put(to, 1);
                } else {
                    adjCom.connectionsCount.put(to, cEdgesto + 1);
                }

                Double nodeEdgesTo = nodeConnectionsWeight[node].get(adjCom);
                if (nodeEdgesTo == null) {
                    nodeConnectionsWeight[node].put(adjCom, e.weight);
                } else {
                    nodeConnectionsWeight[node].put(adjCom, nodeEdgesTo + e.weight);
                }
                
                Integer nodeCountEdgesTo = nodeConnectionsCount[node].get(adjCom);
                if (nodeCountEdgesTo == null) {
                    nodeConnectionsCount[node].put(adjCom, 1);
                } else {
                    nodeConnectionsCount[node].put(adjCom, nodeCountEdgesTo + 1);
                }

                if (to != adjCom) {
                    Double comEdgesto = to.connectionsWeight.get(adjCom);
                    if (comEdgesto == null) {
                        to.connectionsWeight.put(adjCom, e.weight);
                    } else {
                        to.connectionsWeight.put(adjCom, comEdgesto + e.weight);
                    }
                    
                    Integer comCountEdgesto = to.connectionsCount.get(adjCom);
                    if (comCountEdgesto == null) {
                        to.connectionsCount.put(adjCom, 1);
                    } else {
                        to.connectionsCount.put(adjCom, comCountEdgesto + 1);
                    }
                }
            }
        }
        
        
        
        
        private void removeNodeFrom(int node, Community from) {
                       
            Community community = nodeCommunities[node];
            for (ModEdge e : topology[node]) {
                int neighbor = e.getTarget();

                // Remove Node Connection to this community
                Double edgesTo = nodeConnectionsWeight[neighbor].get(community);
                Integer countEdgesTo = nodeConnectionsCount[neighbor].get(community);
                if (countEdgesTo - 1 == 0) {
                    nodeConnectionsWeight[neighbor].remove(community);
                    nodeConnectionsCount[neighbor].remove(community);
                } else {
                    nodeConnectionsWeight[neighbor].put(community, edgesTo - e.getWeight());
                    nodeConnectionsCount[neighbor].put(community, countEdgesTo - 1);
                }

                // Remove Adjacency Community's connection to this community
                Community adjCom = nodeCommunities[neighbor];
                Double oEdgesto = adjCom.connectionsWeight.get(community);
                Integer oCountEdgesto = adjCom.connectionsCount.get(community);
                if (oCountEdgesto - 1 == 0) {
                    adjCom.connectionsWeight.remove(community);
                    adjCom.connectionsCount.remove(community);
                } else {
                    adjCom.connectionsWeight.put(community, oEdgesto - e.getWeight());
                    adjCom.connectionsCount.put(community, oCountEdgesto - 1);
                }
                
                if (node == neighbor) {
                    continue;
                }

                if (adjCom != community) {
                    Double comEdgesto = community.connectionsWeight.get(adjCom);
                    Integer comCountEdgesto = community.connectionsCount.get(adjCom);
                    if (comCountEdgesto - 1 == 0) {
                        community.connectionsWeight.remove(adjCom);
                        community.connectionsCount.remove(adjCom);
                    } else {
                        community.connectionsWeight.put(adjCom, comEdgesto - e.getWeight());
                        community.connectionsCount.put(adjCom, comCountEdgesto - 1);
                    }
                }

                Double nodeEgesTo = nodeConnectionsWeight[node].get(adjCom);
                Integer nodeCountEgesTo = nodeConnectionsCount[node].get(adjCom);
                if (nodeCountEgesTo - 1 == 0) {
                    nodeConnectionsWeight[node].remove(adjCom);
                    nodeConnectionsCount[node].remove(adjCom);
                } else {
                    nodeConnectionsWeight[node].put(adjCom, nodeEgesTo - e.getWeight());
                    nodeConnectionsCount[node].put(adjCom, nodeCountEgesTo - 1);
                }
            }
            from.remove(new Integer(node));
        }
        
        
        
        
        private void moveNodeTo(int node, Community to) {
            Community from = nodeCommunities[node];
            removeNodeFrom(node, from);
            addNodeTo(node, to);
        }
        
        
        
        
		@SuppressWarnings("unchecked")
		private void zoomOut() {
			if (structure == null) {
				return;
			}
			
            int M = communities.size();
            LinkedList<ModEdge>[] newTopology = new LinkedList[M];
            int index = 0;
            nodeCommunities = new Community[M];
            nodeConnectionsWeight = new HashMap[M];
            nodeConnectionsCount = new HashMap[M];
            HashMap<Integer, Community> newInvMap = new HashMap<Integer, Community>();
            
            for (int i = 0; i < communities.size(); i++) {
                Community com = communities.get(i);
                nodeConnectionsWeight[index] = new HashMap<Community, Double>();
                nodeConnectionsCount[index] = new HashMap<Community, Integer>();
                newTopology[index] = new LinkedList<ModEdge>();
                nodeCommunities[index] = new Community(com);
                Set<Community> iter = com.connectionsWeight.keySet();
                double weightSum = 0;

                Community hidden = new Community(structure);
                for (Integer nodeInt : com.nodes) {
                    Community oldHidden = invMap.get(nodeInt);
                    hidden.nodes.addAll(oldHidden.nodes);
                }
                
                newInvMap.put(index, hidden);
                for(Community adjCom : iter) {
                    int target = communities.indexOf(adjCom);
                    double weight = com.connectionsWeight.get(adjCom);
                    if(target == index)
                        weightSum += 2.*weight;
                    else
                        weightSum += weight;
                    ModEdge e = new ModEdge(index, target, weight);
                    newTopology[index].add(e);
                }
                
                weights[index] = weightSum;
                nodeCommunities[index].seed(index);

                index++;
            }
            communities.clear();

            for (int i = 0; i < M; i++) {
                Community com = nodeCommunities[i];
                communities.add(com);
                for (ModEdge e : newTopology[i]) {
                    nodeConnectionsWeight[i].put(nodeCommunities[e.target], e.getWeight());
                    nodeConnectionsCount[i].put(nodeCommunities[e.target], 1);
                    com.connectionsWeight.put(nodeCommunities[e.target], e.getWeight());
                    com.connectionsCount.put(nodeCommunities[e.target], 1);
                }

            }

            N = M;
            topology = newTopology;
            invMap = newInvMap;
        }
		
		
		
		public Map<Node, Integer> getMap() {
			return map;
		}
    }
    
    
    
    
    protected class Community {
        double weightSum;
        CommunityStructure structure;
        LinkedList<Integer> nodes;
        HashMap<Community, Double> connectionsWeight;
        HashMap<Community, Integer> connectionsCount;
        
        
        
        
        public int size() {
            return nodes.size();
        }
        
        
        
        
        public Community(Community com) {
            structure = com.structure;
            connectionsWeight = new HashMap<Community, Double>();
            connectionsCount = new HashMap<Community, Integer>();
            nodes = new LinkedList<Integer>();
        }
        
        
        
        
        public Community(CommunityStructure structure) {
            this.structure = structure;
            connectionsWeight = new HashMap<Community, Double>();
            connectionsCount = new HashMap<Community, Integer>();
            nodes = new LinkedList<Integer>();
        }
        
        
        
        
        public void seed(int node) {
            nodes.add(node);
            weightSum += structure.weights[node];
        }
        
        
        
        
        public boolean add(int node) {
            nodes.addLast(new Integer(node));
            weightSum += structure.weights[node];
            return true;
        }
        
        
        
        
        public boolean remove(int node) {
            boolean result = nodes.remove(new Integer(node));
            weightSum -= structure.weights[node];
            if (nodes.size() == 0) {
                structure.communities.remove(this);
            }
            return result;
        }
    }




	@Override
	public void requestCancel() {
		cancel = true;
		status = STATUS_CANCELLING;
	}




	@Override
	public String getStatus() {
		return status;
	}




	@Override
	public int getPercentComplete() {
		return progress;
	}




	@Override
	public void run() {
		progress = 0;
		this.clusterSet = null;
		this.graphResult = null;
		cancel = false;
		status = STATUS_AGGREGATING;
    	
    	logger.debug("Running Louvain clustering algorithm on " + nodeMap.size() + " nodes and " + linkMap.size() + " links...");
		
    	StopWatch stopWatch = new StopWatch();
		stopWatch.start();
    	
		progress = 1;
		
		structure = new CommunityStructure();
    	
        Random rand = new Random();

        boolean someChange = true;
        while (someChange) {
        	
        	if (cancel) {
        		setStatusWaiting();
        		return;
        	}
        	
            someChange = false;
            boolean localChange = true;
            while (localChange) {
            	
            	if (cancel) {
            		setStatusWaiting();
            		return;
            	}
            	
                localChange = false;
                
                // we always use randomisation as it produces a better decomposition. However,
                // it does increase the computation time.
                int start = Math.abs(rand.nextInt()) % structure.N;
                
                int step = 0;
                for (int i = start; step < structure.N; i = (i + 1) % structure.N) {
                	
                	if (cancel) {
                		setStatusWaiting();
                		return;
                	}
                	
                    step++;
                    double best = 0.;
                    Community bestCommunity = null;
                    Community nodecom = structure.nodeCommunities[i];
                    Set<Community> iter = structure.nodeConnectionsWeight[i].keySet();
                    for(Community com : iter) {
                    	
                    	if (cancel) {
                    		setStatusWaiting();
                    		return;
                    	}
                    	
                        double qValue = q(i, com);
                        if (qValue > best) {
                            best = qValue;
                            bestCommunity = com;
                        } 
                    }
                    if ((nodecom != bestCommunity) && (bestCommunity != null)) {
                        structure.moveNodeTo(i, bestCommunity);
                        localChange = true;
                    }
                }
                someChange = localChange || someChange;
            }

            if (someChange) {
                structure.zoomOut();
            }
        }
        
        progress = 95;

        int[] comStructure = new int[nodeMap.size()];
        int count = 0;
        for (Community com : structure.communities) {
            
        	if (cancel) {
        		setStatusWaiting();
        		return;
        	}
        	
        	for (Integer node : com.nodes) {
                
        		if (cancel) {
            		setStatusWaiting();
            		return;
            	}
            	
            	Community hidden = structure.invMap.get(node);
                for (Integer nodeInt : hidden.nodes) {
                	
                	if (cancel) {
                		setStatusWaiting();
                		return;
                	}
                    
                	comStructure[nodeInt] = count;
                }
            }
            count++;
        }
        
        progress = 98;
        
        if (cancel) {
    		setStatusWaiting();
    		return;
    	}
        
        parceCommunities(comStructure);
        
        stopWatch.stop();
		logger.debug("Finished Louvain clustering algorithm.");
		if (graphResult != null) {
			logger.debug("reduced " + nodeMap.size() + " nodes to " + graphResult.getNodes().size());
			logger.debug("reduced " + linkMap.size() + " links to " + graphResult.getLinks().size());
		}
		logger.debug("Algorithm took " + stopWatch.toString());
		stopWatch.reset();
		
		setStatusWaiting();
		progress = 100;
	}
	
	
	
	
	private void setStatusWaiting() {
		status = STATUS_WAITING;
	}




	@Override
	public void setClusterConverter(ClusterConverter clusterer) {
    	this.clusterer = clusterer;
	}




	@Override
	public void setGraph(Map<String, Node> nodeMap, Map<String, Link> linkMap) {
    	this.nodeMap = nodeMap;
    	this.linkMap = linkMap;
	}




	@Override
	public GraphAggregationResult getAggregationResult() {
		return this.graphResult;
	}




	@Override
	public Collection<Set<Node>> getClusterSet() {
		return this.clusterSet;
	}




	public void setResolution(double resolution) {
		this.resolution = resolution;
	}
	
	
	
	
	public void calculateLinkWeighting(boolean calculateLinkWeights) {
		this.calculateLinkWeights = calculateLinkWeights;
	}
}
