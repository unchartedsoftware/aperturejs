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
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.TreeSet;

import oculus.aperture.graph.aggregation.ClusterConverter;
import oculus.aperture.graph.aggregation.OculusAggregator;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.graph.GraphAggregationResult;

import org.apache.commons.lang3.time.StopWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KSnapAggregator implements OculusAggregator {

	private final static Logger logger = LoggerFactory.getLogger(LouvainAggregator.class);
	
	
	
	
	protected class KSnapGroup implements Comparable<KSnapGroup>{
		
		public String groupID;
		public String attribute;
		public HashMap<String,KSnapNode> nodes = new HashMap<String,KSnapNode>();
		public Set<String> strongrelationships = new HashSet<String>();
		public KSnapGroup(String name){groupID=name;}
		public KSnapGroup(String name,String atr){groupID=name;attribute = atr;}
		public int ct;
		public Set<KSnapNode> argmaxct = new HashSet<KSnapNode>();
		
		
		public int compareTo(final KSnapGroup arg1) {
			if(this.ct==arg1.ct)
				return 0;
			if(this.ct<arg1.ct)
				return 1;
			else
				return -1;
		}
	}
	
	
	
	
	protected class KSnapLink implements Comparable<KSnapLink>{
		
		public String start;
		public String end;	
		
		
		public KSnapLink(String s,String e){
			start = s;
			end = e;
		}
		
		
		
		
		public int compareTo(final KSnapLink arg1) {
			if((this.start.equalsIgnoreCase(arg1.start) && this.end.equalsIgnoreCase(arg1.end)) || (this.start.equalsIgnoreCase(arg1.end) && this.end.equalsIgnoreCase(arg1.start)))
				return 0;			
			else
				return -1;
		}
		
		
		
		
		@Override
		public boolean equals(Object other){
		    if (other == null) return false;
		    if (other == this) return true;
		    if(other instanceof KSnapLink){
		    	KSnapLink arg1 = (KSnapLink)other;
			    if((this.start.equalsIgnoreCase(arg1.start) && this.end.equalsIgnoreCase(arg1.end)) || (this.start.equalsIgnoreCase(arg1.end) && this.end.equalsIgnoreCase(arg1.start))) 
			    	return true;
			    else
			    	return false;
		    }
		    return false;
		}
	}
	
	
	
	protected class KSnapNode {
		
		public Node node;
		public KSnapNode(Node n,String group){node= n;groupID=group;}
		public ArrayList<KSnapNode> neighbours= new ArrayList<KSnapNode>();
		public HashMap<String,Integer> pet = new HashMap<String,Integer>();//Participation in specific groups.
		public String groupID;
		
		
		@Override
		public boolean equals(Object other){
		    if (other == null) return false;
		    if (other == this) return true;
		    if(other instanceof KSnapNode){
		    	KSnapNode arg1 = (KSnapNode)other;
			    if((this.groupID==arg1.groupID && this.node.getId()==arg1.node.getId())) 
			    	return true;
			    else
			    	return false;
		    }
		    return false;
		}
	}
	
	
	
	
	protected ClusterConverter clusterer = null;
    protected Map<String, Node> nodeMap = null;
    protected Map<String, Link> linkMap = null;
    protected volatile Collection<Set<Node>> clusterSet = null;
    protected volatile GraphAggregationResult graphResult = null;
    
    protected Set<KSnapLink> stronglinks = new TreeSet<KSnapLink>();
    protected Set<KSnapLink> weaklinks = new TreeSet<KSnapLink>();
    protected int globalC = 0;//bad name but it's from the paper
    
	protected PriorityQueue<KSnapGroup> ctHeap= new PriorityQueue<KSnapGroup>();
	protected HashMap<String, KSnapGroup> groupArray = new HashMap<String, KSnapGroup>();
	protected HashMap<String, KSnapNode> allNodes = new HashMap<String, KSnapNode>();

	private double resolution;
	private volatile boolean cancel = false;
    private String status = STATUS_WAITING;
    private int progress;
    
    
	public KSnapAggregator(
		double resolution
	) {
    	this.resolution = resolution;
	}
	
	
	
	
	protected void sortNodesByAttributes() {
		
		if (nodeMap == null) {
    		return;
    	}
		
		for (Node element : nodeMap.values()) {
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}
			
		    String attribute = element.getType();

		    if (!groupArray.containsKey(attribute)) {
		    	groupArray.put(attribute, new KSnapGroup(attribute,attribute));
		    }
		    
		    KSnapNode n=new KSnapNode(element,attribute);
		    groupArray.get(attribute).nodes.put(element.getId(),n);
		    allNodes.put(element.getId(),n);		    
		} 
	}
	
	
	
	
	private float participationRatio(KSnapGroup start, KSnapGroup end){
		
		int petji=0;
		int petij=0;
		for(KSnapNode n:start.nodes.values()){
			for(KSnapNode t:n.neighbours){
				if(t.groupID==end.groupID){
					petji++;
				}
			}
		}
		
		for(KSnapNode n:end.nodes.values()){
			for(KSnapNode t:n.neighbours){
				if(t.groupID==start.groupID){
					petij++;
				}
			}
		}
		
		return (petji+petij)/(start.nodes.size()+end.nodes.size());
	}
	
	
	
	
	private void ct(){
		ctHeap.clear();
		
		for(KSnapGroup g:groupArray.values()) {
			g.argmaxct.clear();
			g.strongrelationships.clear();
			
			HashMap<String,Integer> pets=new HashMap<String,Integer>();
			HashMap<String,Set<KSnapNode>> ctNodes = new HashMap<String, Set<KSnapNode>>();
			for(KSnapNode n: g.nodes.values()){				
				for(KSnapNode item : n.neighbours) {						
					  if(!n.groupID.equalsIgnoreCase(item.groupID)){
						  if(!ctNodes.containsKey(item.groupID)){
							  Set<KSnapNode> ln = new HashSet<KSnapNode>();
							  ln.add(n);
							  ctNodes.put(item.groupID, ln);
						  }else{
							  ctNodes.get(item.groupID).add(n);
						  }
						  
						  if(!pets.containsKey(item.groupID))pets.put(item.groupID, 0);
						  pets.put(item.groupID,pets.get(item.groupID).intValue()+1);
						  
						  
						  if(!item.pet.containsKey(n.groupID))item.pet.put(n.groupID, 0);
						  item.pet.put(n.groupID,item.pet.get(n.groupID).intValue()+1);
						  
						  KSnapLink newl=new KSnapLink(g.groupID,item.groupID);
						  if(!(stronglinks.contains(newl) || weaklinks.contains(newl))){
							  double p = participationRatio(g,groupArray.get(item.groupID));
							  if(p<0.5){
								  stronglinks.add(newl);
							  }else{
								  weaklinks.add(newl);
							  }
						  }
					  }
				}
			}
			
			int maxct=-99999;
			for(Map.Entry<String,Integer> ct :pets.entrySet()){
				if(ct.getValue()>maxct){
					KSnapLink newl=new KSnapLink(g.groupID,ct.getKey());
					if(stronglinks.contains(newl)){// || weaklinks.contains(newl))){
						g.ct=ctNodes.get(ct.getKey()).size();//ct.getValue();	
					}else{
						g.ct=g.nodes.size() - ctNodes.get(ct.getKey()).size();//ct.getValue();
					}
					
					maxct=g.ct;
					g.argmaxct = ctNodes.get(ct.getKey());
				}
			}
			//System.out.println("CT is " + g.ct + "for group " + g.groupID);
			ctHeap.add(g);
		}
	}
	
	
	
	
	private void split(){
		KSnapGroup top = ctHeap.poll();
		
		if(top==null || top.nodes == null){
			return;			
		}
		while(top.nodes.size()<2){
			if(ctHeap.isEmpty())
			{
				//System.out.print("No more heap! \n");
				return;
			}
			top = ctHeap.poll();			
		}	
		
		if(top.nodes.size() == top.argmaxct.size()){
			split();
			return;
		}
		String newgroupname = top.groupID + groupArray.size();
		KSnapGroup newgroup = new KSnapGroup(newgroupname);
		newgroup.attribute = top.attribute;//preserving original attribute
		groupArray.put(newgroupname,newgroup);
		//System.out.print("\nAdding group " + newgroupname +  "\n");
		for(KSnapNode item : top.argmaxct ) {
			
			//System.out.print("Removing " + item.node.getId() + "from" + top.groupID + "current size " + top.nodes.size() + "\n");
			top.nodes.remove(item.node.getId());
			//System.out.print("Adding " + item.node.getId() + "to" + newgroupname +  "\n");

			item.groupID = newgroupname;
			newgroup.nodes.put(item.node.getId(), item);
		}
		
	}
	
	
	
	
	private double diversity(){
		int dpcs=0;
		for(KSnapLink lk:stronglinks){
			KSnapGroup s= groupArray.get(lk.start);
			KSnapGroup e= groupArray.get(lk.end);
			if(!s.attribute.equalsIgnoreCase(e.attribute)){
				dpcs++;
			}
			
		}
		return dpcs/globalC;
	}
	
	
	
	
	private double conciseness(){
		return groupArray.size()+stronglinks.size();
	}
	
	
	
	
	private double coverage(){
		
		if (nodeMap == null) {
    		return 0.0;
    	}
		
		int count = 0;
		for(KSnapLink lk:stronglinks){
			KSnapGroup s= groupArray.get(lk.start);
			KSnapGroup e= groupArray.get(lk.end);
			for(KSnapNode n:s.nodes.values()){
				for(KSnapNode ne:n.neighbours){
					if(ne.groupID.equalsIgnoreCase(e.groupID)){
						count++;
					}
				}
			}
			for(KSnapNode n:e.nodes.values()){
				for(KSnapNode ne:n.neighbours){
					if(ne.groupID.equalsIgnoreCase(s.groupID)){
						count++;
					}
				}
			}			
		}
		
		return count/this.nodeMap.size();
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
		
		logger.debug("Running kSnap clustering algorithm on " + nodeMap.size() + " nodes and " + linkMap.size() + " links...");
		
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();

		//int group=0;

		//First we sort all the incoming nodes on their attributes into different sets.
		sortNodesByAttributes();
		
		globalC = groupArray.size();
		
		//Now we create neighbour bitmaps and other data structures.
				
		for(Link newlink :linkMap.values()) {
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}
			
			allNodes.get(newlink.getSourceId()).neighbours.add(allNodes.get(newlink.getTargetId()));
			allNodes.get(newlink.getTargetId()).neighbours.add(allNodes.get(newlink.getSourceId()));
		}

		
		//Compute CT
		ArrayList<Double> interestingness=new ArrayList<Double>((int)resolution);
		for(int i = 0; i < resolution; i++){
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}
			
			stronglinks.clear();
			ct();		
			split();
			double t=diversity()*coverage()/conciseness();
			interestingness.add(t);
			//System.out.println(" Interestingness " + t);
		}	

		clusterSet = new ArrayList<Set<Node>>();

		for (KSnapGroup g : groupArray.values()) {
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}

			//int total=0;
			//group++;
			Set<Node> set=new HashSet<Node>();
			clusterSet.add(set);
			//int count = 0;
			for (KSnapNode n : g.nodes.values()) {
				//total++;
				//System.out.print(n.node.getLabel() + "\n");

				if (cancel) {
		    		setStatusWaiting();
		    		return;
		    	}
				
				set.add(n.node);
				//count++;g
			}
			//System.out.print("----------- " + g.groupID + " " + group +" t:" + total +  "\n");
		}

		if (clusterer != null) {
			graphResult = clusterer.convertClusterSet(clusterSet);
		}
		
		stopWatch.stop();
		logger.debug("Finished kSnap clustering algorithm.");
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
}
