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
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;

import org.apache.log4j.Logger;


/**
 * A force-directed layout algorithm.
 * @author cwu
 *
 */
public class FFDLayouter {
	private static final Logger logger = Logger.getLogger(FFDLayouter.class.getName());

	/**
	 * Given a graph and a node, does a depth first search to find all connected nodes.  Connected nodes
	 * are placed into the foundNodes set.
	 * @param inModel
	 * @param node
	 * @param foundNodes
	 */
	private void depthFirstSearch(Map<String, Node> nodeMap,
			Map<String, Collection<Link>> linkMap,
			Node refNode, 
			LinkedHashSet<Node> foundNodes) {
		//Make sure node is in foundNodes
		foundNodes.add(refNode);
		
		//Collection<LayoutLink> edges = inModel.getIncidentEdges(node);  //better be quick
		Collection<Link> edges = linkMap.get(refNode.getId());
		if (edges == null){
			return;
		}
		for (Link edge : edges) {
			Node node = nodeMap.get(edge.getSourceId());
			if (node == refNode){
				node = nodeMap.get(edge.getTargetId());
			}
			
			//Node already found
			if (foundNodes.contains(node)) continue;
			
			depthFirstSearch(nodeMap, linkMap, node, foundNodes);
		}
		
	}

	/**
	 * Given a graph, return a set of subgraphs, where each subgraph is a connected component of the
	 * input graph.
	 */
	protected Set<Set<Node>> getConnectedComponents(Collection<? extends Node> nodes,
			Map<String, Node> nodeMap,
			Map<String, Collection<Link>> linkMap) {
		
		//Keeps track of visited nodes.
		Set<Node> unvisitedNodes = new HashSet<Node>();
		
		//Resulting graphs
		Set<Set<Node>> components = new HashSet<Set<Node>>();

		unvisitedNodes.addAll(nodes);
		while(!unvisitedNodes.isEmpty()) {
			Node refNode = unvisitedNodes.iterator().next();
			LinkedHashSet<Node> componentNodes = new LinkedHashSet<Node>();
			depthFirstSearch(nodeMap, linkMap, refNode, componentNodes);
			unvisitedNodes.removeAll(componentNodes);
			components.add(componentNodes);
			//System.out.println("["+componentNodes.size()+"] "+unvisitedNodes.size()+"/"+inGraph.getNodes().size());
		}

		return components;
	}
	public NodesPositionState determineLayout(Collection<Node> nodeList, Collection<Link> edgeList) throws Exception {
		logger.info("Performing Oculus force layout...");
		
		// Set initial positions, calculate bounds
		// Create a node hashmap for quick look-up.
		Map<String, Node> nodeMap = new HashMap<String, Node>();

		ArrayList<String> fixedNodes = new ArrayList<String>();
		for (Node node : nodeList){
			fixedNodes.add(node.getId());
			nodeMap.put(node.getId(), node);
		}
		
		Map<String, Collection<Link>> linkMap = new HashMap<String, Collection<Link>>();		
		Collection<Link> linkList = null;
		
		for (Link link : edgeList){
			String sourceId = link.getSourceId();
			String targetId = link.getTargetId();

			linkList = linkMap.get(sourceId);
			if (linkList == null){
				linkList = new ArrayList<Link>();
			}
			if (!linkList.contains(link)){
				linkList.add(link);
				linkMap.put(sourceId, linkList);
			}

			linkList = linkMap.get(targetId);
			if (linkList == null){
				linkList = new ArrayList<Link>();
			}
			if (!linkList.contains(link)){
				linkList.add(link);
				linkMap.put(targetId, linkList);
			}
		}
		
		
//		fixedNodes.removeAll(Application.getInstance().getGraphViewer().getNodeSelectionModel().getAllSelectedParts());
		if (fixedNodes.size() == nodeList.size()) fixedNodes.clear();
		
		long startms = System.currentTimeMillis();
		Map<String, Point2D> graphNodes = new HashMap<String, Point2D>(); // initial positional state
		
		//Find subgraphs
		
		Set<Set<Node>> subgraphs = getConnectedComponents(nodeList, nodeMap, linkMap);
		//Set<IGraphModel> subgraphs = Collections.singleton(inModel);
		
		logger.info("Found "+subgraphs.size()+" connected components in "+(System.currentTimeMillis()-startms)/1000+"s");
		
		Random generator = new Random();

		double newX, newY;
		double minX = Double.MAX_VALUE;
		double maxX = -Double.MAX_VALUE;
		double minY = Double.MAX_VALUE;
		double maxY = -Double.MAX_VALUE;
		
		int randomDim = (int)Math.sqrt(subgraphs.size());
		int offx = 0;
		int offy = 0;
		
		for (Set<Node> subgraph : subgraphs) {
			
			
			for (Node nm: subgraph) {
				if (fixedNodes.contains(nm)) {
					newX = nm.getX();
					newY = nm.getY();
				} else {
					newX = generator.nextDouble()+offx;
					newY = generator.nextDouble()+offy;
				}
				graphNodes.put(nm.getId(), new Point2D.Double(newX, newY));
				if (newX < minX)	minX = newX;
				if (newX > maxX)	maxX = newX;
				if (newY < minY)	minY = newY;
				if (newY > maxY)	maxY = newY;
			}

			offx++;
			if (offx >= randomDim) {
				offx = 0;
				offy ++;
			}
		}
		
		// for termination tests
		double width = maxX - minX;
		double height = maxY - minY;
		double area = width * height;
		double k = Math.sqrt(area/nodeList.size()); // used to scale the vectors
		double temperature = 0.5*Math.min(width, height); // initially you cant take steps larger than 15% of the total view
		double stepLimit = Math.min(maxX - minX, maxY - minY)/1000;
		
		double step = Double.MAX_VALUE;
		double theta = Double.parseDouble(System.getProperty("dashboard.layouts.FFD.theta", "1.0")); // theta parameter for the Quigley-Eades algorithm, used to choose node/pseudo-node comparison
		int iteration = 0;

		// create threads
		int nProcessors = Runtime.getRuntime().availableProcessors();
		final ExecutorService threadPool = Executors.newFixedThreadPool(nProcessors, new ThreadFactory() {
			
			@Override
			public Thread newThread(Runnable r) {
				return new Thread(r, "FFDLayouter Pool");
			}
		});
		
		Runtime.getRuntime().addShutdownHook(new Thread(){
			public void run(){
				try {
					logger.debug("FFDLayouter thread pool starting shutdown");
					threadPool.shutdown();
					try {
						if (!threadPool.awaitTermination(10, TimeUnit.SECONDS)) {
							logger.error("FFDLayouter thread pool did not shut down gracefully");
						}
					} catch (InterruptedException e) {
						Thread.currentThread().interrupt();
					}
					threadPool.shutdownNow();
				}
				catch (Exception e) {
					logger.error("FFDLayouter thread pool did not shut down gracefully");
				}
			}
		});
		
		int max_iterations = Integer.parseInt(System.getProperty("dashboard.layouts.FFD.max.iterations", "10000"));
		do {
			step = doForceLayoutStep(threadPool, nodeList, edgeList, fixedNodes, graphNodes, k, theta, temperature);
			iteration++;
			temperature *= (1 - (double)iteration/max_iterations); // RHS approaches 1 as you iterate making the scale 0
		} while (step > stepLimit && temperature > 0d);
		
		//Do final scaling of result to -10,10
		for (Node nm: nodeList) {
			Point2D xy = graphNodes.get(nm.getId());
			if (xy.getX() < minX)
				minX = xy.getX();
			if (xy.getX() > maxX)
				maxX = xy.getX();
			if (xy.getY() < minY)
				minY = xy.getY();
			if (xy.getY() > maxY)
				maxY = xy.getY();
		}

		double sx = 100d/(maxX-minX);
		double sy = 100d/(maxY-minY);

		// Convert the calculated points back into a list of nodes.
		nodeMap.clear();
		
		NodesPositionState nps = new NodesPositionState();
		for (Node layoutNode: nodeList) {
			Point2D xy = graphNodes.get(layoutNode.getId());
			layoutNode.setX((int) ((xy.getX()-minX)*sx));
			layoutNode.setY((int) ((xy.getY()-minY)*sy));
			nps.setPosition(layoutNode.getId(), (xy.getX()-minX)*sx, (xy.getY()-minY)*sy);
		}		

		logger.debug("Oculus force layout completed in  " + ((double)System.currentTimeMillis()-startms)/1000+"s and using " + iteration + " iterations.");

		return nps;
	}
	
	/**
	 * using the nodes and edges/perform one step of a force-directed layout
	 * - find the bounding box and create a quadtree
	 * - for each edge, contract the nodes as if they were connected by a spring
	 * - for each node, find a relevant node or pseudonode (if the nodes are far away) and calculate a repulsion like electron particles
	 * - update the system downplaying any huge changes
	 * @param threadPool 
	 * @param nodeList
	 * @param edgeList
	 * @param origNPS
	 * @return
	 */
	public double doForceLayoutStep(ExecutorService threadPool, Collection<Node> nodeList,
			Collection<Link> edgeList, Collection<String> fixedNodes,
			Map<String, Point2D> origNPS, 
			double k, double theta, double temperature) {
		// get a bounding box for the points
		double minX = Double.MAX_VALUE;
		double maxX = Double.MIN_VALUE;
		double minY = Double.MAX_VALUE;
		double maxY = Double.MIN_VALUE;
		for (Node nm: nodeList) {
			Point2D xy = origNPS.get(nm.getId());
			if (xy.getX() < minX)
				minX = xy.getX();
			if (xy.getX() > maxX)
				maxX = xy.getX();
			if (xy.getY() < minY)
				minY = xy.getY();
			if (xy.getY() > maxY)
				maxY = xy.getY();
		}
		
		// create quadtree decomposition
		double boundingBoxBuffer = 0.05 * Math.max(maxX - minX, maxY - minY);
		QuadTree qt = new QuadTree(minX-boundingBoxBuffer, minY-boundingBoxBuffer, maxX - minX + 2*boundingBoxBuffer, maxY - minY + 2*boundingBoxBuffer);
		for (Node nm: nodeList) {
			Point2D xy = origNPS.get(nm.getId());
			qt.insert(xy.getX(), xy.getY(), nm);
		}

		// for tracking the aggregate displacements
		ConcurrentHashMap<String, MyPoint> displacements = new ConcurrentHashMap<String, FFDLayouter.MyPoint>();
		for (Node nm: nodeList) {
			displacements.put(nm.getId(), new MyPoint(0, 0));
		}
		
		// TYPE 1: Calculate attractive forces
		// For each edge, create a spring attraction
		for (Link em: edgeList) {
			String srcID = em.getSourceId();
			String destID = em.getTargetId();
			if (srcID.equals(destID)) continue;
			Point2D srcPt = origNPS.get(srcID);
			Point2D dstPt = origNPS.get(destID);
			if (srcPt == null || dstPt == null) continue;
			MyPoint vectSrcToDest = getAttractionVector(srcPt, dstPt, k);
			
			if (!fixedNodes.contains(em.getSourceId())) {
				displacements.get(srcID).addVectorInPlace(vectSrcToDest);
			}
			if (!fixedNodes.contains(em.getTargetId())) {
				displacements.get(destID).addScaledVectorInPlace(-1, vectSrcToDest);
			}
		}
		
		// TYPE 2: Calculate repulsive forces
		// split the nodes up into #thread groups
		Map<String, Future<MyPoint>> futures = new HashMap<String, Future<MyPoint>>();
		for (Node nm : nodeList) {
			if (!fixedNodes.contains(nm.getId())) {
				futures.put(nm.getId(), threadPool.submit(new RepulsionCalculator(nm, qt, origNPS, k, theta)));
			}
		}
		
		for (String s : futures.keySet()) {
			try {
				MyPoint res = futures.get(s).get(); // get the result
				displacements.get(s).addVectorInPlace(res);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
			} catch (ExecutionException e) {
				e.printStackTrace();
			}
		}
	
		// apply displacements, limiting step size to temperature
		// track the biggest change we make
		double largestStep = Double.MIN_VALUE;
		for (String id: origNPS.keySet()) {
			Point2D oldPosition = origNPS.get(id);
			MyPoint proposedDisplacement = displacements.get(id);
			double norm = proposedDisplacement.getNorm();
			if (norm > temperature) {
				// too big, scale the step to temp
				proposedDisplacement.scaleInPlace(temperature/norm);
				norm = temperature;
			}
			if (largestStep < norm)
				largestStep = norm;
			origNPS.put(id, new Point2D.Double(oldPosition.getX() + proposedDisplacement.getX(), oldPosition.getY() + proposedDisplacement.getY()));
		}
		
		return largestStep;
	}
	
	/**
	 * Calculate the contribution from all the nodes in qn to the node with the id 'currentID'
	 */
	private MyPoint getRepulsionContribution(QuadNode qn, String currentID, Map<String, Point2D> nps, double k, double theta) {
		Point2D currentPosition = nps.get(currentID);
		
		if (qn.getnChildren() == 0)  // nothing to compute
			return null;
		if (qn.getnChildren() == 1) { // leaf
			Object uncastNode = qn.getData().getValue();
			if (!(uncastNode instanceof Node)) {
				System.err.println("Failed to find proper data in quadtree");
			}
			Node nm = (Node)uncastNode;
			if (nm.getId().equals(currentID))
				return null;
			Point2D currentLeafPosition = nps.get(nm.getId());
			MyPoint repulsion = getRepulsionVector(currentPosition, currentLeafPosition.getX(), currentLeafPosition.getY(), k);
//			if (nm instanceof IGroupNodeModel) {		//Scale repulsion for group nodes based on number of contained nodes
//				int containedNodes = ((IGroupNodeModel)nm).getChildren().size();
//				repulsion.setXY(repulsion.getX()*containedNodes, repulsion.getY()*containedNodes);
//			}
			return repulsion;
		}
		if (shouldCompareAsPseudoNode(qn, nps.get(currentID), theta)) {
			Point2D com = qn.getCenterOfMass();
			MyPoint repulsion = getRepulsionVector(currentPosition, com.getX(), com.getY(), k);
			repulsion.setXY(repulsion.getX() * qn.getnChildren(), repulsion.getY() * qn.getnChildren());
			return repulsion;
		}
		
		// failed to resolve a repulsion, try the children
		MyPoint nwVector = getRepulsionContribution(qn.getNW(), currentID, nps, k, theta);
		MyPoint neVector = getRepulsionContribution(qn.getNE(), currentID, nps, k, theta);
		MyPoint swVector = getRepulsionContribution(qn.getSW(), currentID, nps, k, theta);
		MyPoint seVector = getRepulsionContribution(qn.getSE(), currentID, nps, k, theta);
		
		MyPoint out = new MyPoint(0, 0);
		if (nwVector != null) out.addVectorInPlace(nwVector);
		if (neVector != null) out.addVectorInPlace(neVector);
		if (swVector != null) out.addVectorInPlace(swVector);
		if (seVector != null) out.addVectorInPlace(seVector);
		
		return out;
	}
	
	/**
	 * Used to decide whether to recurse on this quad node or just use the center of mass
	 * Basically tests if the node far enough that this quad is might as well act as a point 
	 * in terms of repulsion
	 * 
	 * If s/d <= theta, then d is big compared to s and we should just consider this a pseudo node
	 */
	private boolean shouldCompareAsPseudoNode(QuadNode qn, Point2D currentpos, double theta) {
		double s = Math.min(qn.getBounds().getWidth(), qn.getBounds().getHeight()); // use the smaller box dimension
		Point2D com = qn.getCenterOfMass();
		double d = com.distance(currentpos.getX(), currentpos.getY());
		return (s/d) <= theta;
	}
	
	private MyPoint getAttractionVector(Point2D src, Point2D dest, double k) {
		MyPoint v = new MyPoint(dest.getX() - src.getX(), dest.getY() - src.getY());
		double norm = v.getNorm(); // don't do this excessively
		v.scaleInPlace( 1/norm ); // normalize
		v.scaleInPlace( getAttractionScaling(k, norm) );  // magic coeff from Kobourov paper
		return v;
	}
	
	/**
	 * Give the repulsion affect of 'repulsor' on 'target'
	 * i.e the vector should point FROM repulsor TO target
	 */
	private MyPoint getRepulsionVector(Point2D target, double repulsorX, double repulsorY, double k) {
		MyPoint repulseV = new MyPoint(target.getX() - repulsorX, target.getY() - repulsorY); // direction
		double norm = repulseV.getNorm();
		repulseV.scaleInPlace(1/norm);
		repulseV.scaleInPlace( getRepulsionScaling(k, norm) ); // magic coeff rom Kobourov paper
		return repulseV;
	}
	
	private double getAttractionScaling(double k, double d) {
		return d*d/k;
	}
	
	private double getRepulsionScaling(double k, double d) {
		return k*k/d;
	}

	
//	@Override
//	public void setFixedNodeSet(Collection<LayoutNode> fixedNodes) {
//		// not supported
//	}
//
//	@Override
//	public int getMaxSuggestedGraphSize() {
//		return Integer.parseInt(System.getProperty("guarddog.ffd.max.suggested", "500000"));
//	}
//		
//	@Override
//	public boolean isUserInvokable() {
//		return true;
//	}
	
	private class MyPoint extends Point2D.Double {
		
		/**
		 * 
		 */
		private static final long serialVersionUID = -3432988691521846674L;

		public MyPoint (double x, double y) {
			super(x, y);
		}

		public double getNorm() {
			return Math.sqrt(x*x + y*y);
		}
		
//		public void normalize() {
//			this.scaleInPlace(1/this.getNorm());
//		}
//		 
		public void scaleInPlace(double s) {
			this.x *= s;
			this.y *= s;
		}
		
		public void addVectorInPlace(Point2D.Double p) {
			addScaledVectorInPlace(1d, p);
		}
		
		public void addScaledVectorInPlace(double d, Point2D.Double p) {
			this.x += d*p.getX();
			this.y += d*p.getY();
		}
		
		public void setXY(double x, double y) {
			this.x = x;
			this.y = y;
		}
		
	}
	
	private class RepulsionCalculator implements Callable<MyPoint> {

		private Map<String, Point2D> _nps;
		private double _k;
		private double _theta;
		private QuadTree _qt;
		private Node _nm;
		
		public RepulsionCalculator(Node nm, QuadTree qt, Map<String, Point2D> nps, double k, double theta) {
			_nm = nm;
			_nps = nps;
			_k = k;
			_qt = qt;
			_theta = theta;
		}
		
		@Override
		public MyPoint call() throws Exception {
			return getRepulsionContribution(_qt.getRoot(), _nm.getId(), _nps, _k, _theta);
		}
	}


}
