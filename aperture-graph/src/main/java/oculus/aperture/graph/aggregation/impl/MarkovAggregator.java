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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import net.sf.javaml.clustering.mcl.SparseMatrix;
import net.sf.javaml.clustering.mcl.SparseVector;
import oculus.aperture.graph.aggregation.ClusterConverter;
import oculus.aperture.graph.aggregation.OculusAggregator;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.graph.GraphAggregationResult;

import org.apache.commons.lang3.time.StopWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class MarkovAggregator implements OculusAggregator {
	
	private final static Logger logger = LoggerFactory.getLogger(MarkovAggregator.class);
	
	protected ClusterConverter clusterer = null;
	protected Map<String, Node> nodeMap = null;
    protected Map<String, Link> linkMap = null;
    protected volatile Collection<Set<Node>> clusterSet = null;
    protected volatile GraphAggregationResult graphResult = null;
	
    private volatile boolean cancel = false;
    private String status = STATUS_WAITING;
    private int progress;
	
    
	public MarkovAggregator() {}
	
	
	
	
	protected double getLinkWeight(Link link) {
		return 1.0;
	}
	
	
	
	
	protected Collection<Set<Node>> parceClusters(
		Map<Integer, ArrayList<Integer>> map, 
		Map<Integer, String> idLookup
	){
		if (nodeMap == null) {
	    	return null;
	    }
		
		List<Set<Node>> clusterSet =  new ArrayList<Set<Node>>();
        Set<ArrayList<Integer>> sortedClusters = new HashSet<ArrayList<Integer>>();
		for (ArrayList<Integer> c : map.values()) {
			
			if (!sortedClusters.contains(c)) {
				sortedClusters.add(c);
				
				Set<Node> cluster = new HashSet<Node>();
				for (Integer in : c) {
					String nodeId = idLookup.get(in);
					cluster.add(nodeMap.get(nodeId));
				}
				
				if (clusterSet.contains(cluster)) {
					continue;
				}
				
				clusterSet.add(cluster);
			}
		}
		
		return clusterSet;
	}




	private SparseMatrix run(SparseMatrix a, double maxResidual, double pGamma, double loopGain, double maxZero) {
		
        // add cycles
        addLoops(a, loopGain);

        // make stochastic
        a.normaliseRows();
        
        double residual = 1.;

        // main iteration
        while (residual > maxResidual) {
        	
        	if (cancel) {
        		setStatusWaiting();
        		return null;
        	}
        	
            a = expand(a);
            residual = inflate(a, pGamma, maxZero);
            logger.debug("residual energy = " + residual);
        }
        return a;
    }
	
	
	
	
	private void addLoops(SparseMatrix a, double loopGain) {
        if (loopGain <= 0) {
            return;
        }
        for (int i = 0; i < a.size(); i++) {
            a.add(i, i, loopGain);
        }
    }
	
	
	
	
	private SparseMatrix expand(SparseMatrix m) {
        m = m.times(m);
        return m;
    }
	
	
	
	
	private double inflate(SparseMatrix m, double p, double zeromax) {
        double res = 0.;

        m.hadamardPower(p);
        m.prune(zeromax);
        SparseVector rowsums = m.normalise(1.);

        // check if done: if the maximum element
        for (int i : rowsums.keySet()) {
            SparseVector row = m.get(i);
            double max = row.max();
            double sumsq = row.sum(2.);
            res = Math.max(res, max - sumsq);
        }
        return res;
    }
	
	
	
	
	private Map<Integer, ArrayList<Integer>> getClusters(SparseMatrix matrix) {
		 
        Map<Integer, ArrayList<Integer>> clusters = new HashMap<Integer, ArrayList<Integer>>();
        double[][] mat = matrix.getDense();
        for (int i = 0; i < mat.length; i++) {
            for (int j = 0; j < mat[0].length; j++) {
                double value = mat[i][j];
                if (value != 0.0) {
                    if (i == j) {
                        continue;
                    }
 
                    if (clusters.containsKey(j)) {
                        ArrayList<Integer> columnCluster = clusters.get(j);
                        if (clusters.containsKey(i)) {
                            ArrayList<Integer> rowCluster = clusters.get(i);
                            if (rowCluster == columnCluster) {
                                continue;
                            }
                            columnCluster.addAll(rowCluster);
                        } else {
                            columnCluster.add(i);
                        }
                        for (Integer in : columnCluster) {
                            clusters.put(in, columnCluster);
                        }
                    } else {
                        ArrayList<Integer> rowCluster;
                        if (clusters.containsKey(i)) {
                            rowCluster = clusters.get(i);
                            rowCluster.add(j);
                        } else {
                            rowCluster = new ArrayList<Integer>();
                            rowCluster.add(j);
                            rowCluster.add(i);
                        }
                        for (Integer in : rowCluster) {
                            clusters.put(in, rowCluster);
                        }
                    }
                }
            }
        }
 
        return clusters;
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
		
		logger.debug("Running MCL clustering algorithm on " + nodeMap.size() + " nodes and " + linkMap.size() + " links...");
		
		StopWatch overallStopWatch = new StopWatch();
		overallStopWatch.start();
		
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
		 
		// create a sparse matrix and populate with links
		SparseMatrix mat = new SparseMatrix();
				
		// create nodeId-to-index lookup table
		Map<String, Integer> indexLookup = new HashMap<String, Integer>(nodeMap.size());
		Map<Integer, String> idLookup = new HashMap<Integer, String>(nodeMap.size()); 
		int index = 0;
		for (Entry<String, Node> entry : nodeMap.entrySet()) {
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}
			
			mat.add(
				index, 
				index, 
				0
			);
			
			indexLookup.put(entry.getKey(), index);
			idLookup.put(index, entry.getKey());
			index++;
		}
		
		for (Link link : linkMap.values()) {
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}
			
			int row = indexLookup.get(link.getSourceId());
			int column = indexLookup.get(link.getTargetId());
			double weight = getLinkWeight(link);
			
			mat.add(row, column, weight);
			mat.add(column, row, weight);
		}
		
		indexLookup.clear();
		indexLookup = null;
		
		
		stopWatch.stop();
		logger.debug("Sparse matrix creation time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		// The Markov Clustering algorithm wants the matrix in row-major format
		mat = mat.transpose();
		
		stopWatch.stop();
		logger.debug("Transpose time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		logger.debug("Beginning Markov clusterer...");
		
		if (cancel) {
    		setStatusWaiting();
    		return;
    	}
		
		mat = run(
			mat, 
			0.0010, 
			2.0, 
			1.0,
			0.0010
		);
		
		if (mat == null) {
    		setStatusWaiting();
    		return;
    	}
		
		stopWatch.stop();
		logger.debug("MCL algorithm time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		if (cancel) {
    		setStatusWaiting();
    		return;
    	}
		
		Map<Integer, ArrayList<Integer>> map = getClusters(mat);
		
		clusterSet = parceClusters(map, idLookup);
		
		stopWatch.stop();
		logger.debug("Creating cluster set from sparse matrix time: " + stopWatch.toString());
		stopWatch.reset();
		stopWatch.start();
		
		if (cancel) {
    		setStatusWaiting();
    		return;
    	}
		
		if (clusterer != null) {
			graphResult = clusterer.convertClusterSet(clusterSet);
		}
		
		stopWatch.stop();
		logger.debug("cluster conversation time: " + stopWatch.toString());
		stopWatch.reset();
		
		overallStopWatch.stop();
		logger.debug("Finished MCL clustering algorithm.");
		if (graphResult != null) {
			logger.debug("reduced " + nodeMap.size() + " nodes to " + graphResult.getNodes().size());
			logger.debug("reduced " + linkMap.size() + " links to " + graphResult.getLinks().size());
		}
		logger.debug("Algorithm took " + overallStopWatch.toString());
		overallStopWatch.reset();
		
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
}