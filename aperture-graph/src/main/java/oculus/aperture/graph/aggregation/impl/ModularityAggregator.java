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
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import oculus.aperture.graph.aggregation.ClusterConverter;
import oculus.aperture.graph.aggregation.OculusAggregator;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.graph.GraphAggregationResult;

import org.apache.commons.lang3.time.StopWatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class ModularityAggregator implements OculusAggregator {

	private final static Logger logger = LoggerFactory.getLogger(ModularityAggregator.class);
	
	protected ClusterConverter clusterer;
    protected Map<String, Node> nodeMap;
    protected Map<String, Link> linkMap;
    
	private volatile boolean cancel = false;
    private String status = STATUS_WAITING;
    private int progress;
    
    protected volatile GraphAggregationResult result = null;
	
	final int nThreads = 10;
    final ExecutorService executor = Executors.newFixedThreadPool(nThreads, new ThreadFactory() {
		
		@Override
		public Thread newThread(Runnable r) {
			return new Thread(r, "ModularityAggregator Pool");
		}
	});
    
    protected volatile Collection<Set<Node>> clusterSet = null;
    protected volatile GraphAggregationResult graphResult = null;
    
    
    protected ConcurrentLinkedQueue<ModularityNode> groups = new ConcurrentLinkedQueue<ModularityAggregator.ModularityNode>();
    //protected ConcurrentLinkedQueue<ModularityLink> links = new ConcurrentLinkedQueue<ModularityAggregator.ModularityLink>();
    protected ArrayList<ModularityLink> links=null;
	protected class ModularityNode implements Comparable<ModularityNode>{		
		
		public ModularityNode(){}
		public ModularityNode(Node n){nodes.add(n);}
		public ArrayList<Node> nodes= new ArrayList<Node>();
		//public ArrayList<AtomicInteger>  degrees= new ArrayList<AtomicInteger>();
		public int totalvolume=0;
		
		public ArrayList<ModularityLink> links = new ArrayList<ModularityAggregator.ModularityLink>();
		public ConcurrentHashMap<ModularityNode,AtomicInteger> neighbourcounts = new ConcurrentHashMap<ModularityNode,AtomicInteger>();
		public void addLink(ModularityLink ln){
			links.add(ln);
			ModularityNode s = ln.source;
			ModularityNode t = ln.target;
			if(s==this){
				if(neighbourcounts.containsKey(t)){
					neighbourcounts.get(t).incrementAndGet();
				}else{
					neighbourcounts.put(t, new AtomicInteger(1));
				}
				if(nodes.size()==1){
					//this is first pass. counting degrees
					totalvolume++;
				}
			}else if(t==this){
				if(neighbourcounts.containsKey(s)){
					neighbourcounts.get(s).incrementAndGet();
				}else{
					neighbourcounts.put(s, new AtomicInteger(1));
					
				}
				if(nodes.size()==1){
					//this is first pass. counting degrees
					totalvolume++;
				}
				
			}else{
				System.out.println("Link being added has nothing to do with this node. Should not happen.");
			}
		}
		public int compareTo(final ModularityNode arg1) {
			if (arg1 == null) return -1;
		    if (arg1 == this) 
		    	return 0;
		    else
		    	return 1;
		}
		public void assimilate(ModularityNode n){
			//resistance is futile
			nodes.addAll(n.nodes);
			n.nodes.clear();
			links.addAll(n.links);
			n.links.clear();
			for(Map.Entry<ModularityNode, AtomicInteger> nc : n.neighbourcounts.entrySet()){
				if(nc.getKey()==this) continue;
				if(neighbourcounts.containsKey(nc.getKey())){
					neighbourcounts.get(nc.getKey()).addAndGet(nc.getValue().intValue());
				}else{
					neighbourcounts.put(nc.getKey(), nc.getValue());
				}
			}
			neighbourcounts.remove(n);
			totalvolume+=n.totalvolume;
		}
		
		@Override
		public boolean equals(Object other){
		    if (other == null) return false;
		    if (other == this) return true;
		   /* if(other instanceof ModularityNode){
		    	ModularityNode arg1 = (ModularityNode)other;
			    if((this.groupID==arg1.groupID && this.node.getId()==arg1.node.getId())) 
			    	return true;
			    else
			    	return false;
		    }*/
		    return false;
		}
	}
	protected class ModularityLink  implements Comparable<ModularityLink>{
		public ModularityLink(){}
		public ModularityLink(ModularityNode s,ModularityNode t){source=s;target=t;}
		public ModularityNode source;
		public ModularityNode target;
		public AtomicLong q=new AtomicLong(0);
		
		public int compareTo(final ModularityLink arg1) {
			if(this.q==arg1.q)
				return 0;
			if(this.q.intValue()<arg1.q.intValue())
				return 1;
			else
				return -1;
		}
	}
	
	public ModularityAggregator() {			
	    Runtime.getRuntime().addShutdownHook(new Thread(){
			public void run(){
				try {
					logger.debug("ModularityAggregator thread pool starting shutdown");
					executor.shutdown();
					try {
						if (!executor.awaitTermination(10, TimeUnit.SECONDS)) {
							logger.error("ModularityAggregator thread pool did not shut down gracefully");
						}
					} catch (InterruptedException e) {
						Thread.currentThread().interrupt();
					}
					executor.shutdownNow();
				}
				catch (Exception e) {
					logger.error("ModularityAggregator thread pool did not shut down gracefully");
				}
			}
		});
	}
	
	@Override
	public void run() {
		
		logger.debug("Running kSnap clustering algorithm on " + nodeMap.size() + " nodes and " + linkMap.size() + " links...");
		
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
		HashMap<String,ModularityNode> linklookup=new HashMap<String, ModularityAggregator.ModularityNode>();
		
		for(Node n: nodeMap.values()){
			ModularityNode mn=new ModularityNode(n);			
			linklookup.put(n.getId(),mn);		
			groups.add(mn);

		}
		links = new ArrayList<ModularityLink>();
		
		for(Link l: linkMap.values()){
			if(linklookup.containsKey(l.getSourceId()) && linklookup.containsKey(l.getTargetId())){
				//if this is not true we have links pointing to an invalid node...
				ModularityLink ml =new ModularityLink(linklookup.get(l.getSourceId()),linklookup.get(l.getTargetId()));
				links.add(ml);
				
				ModularityNode start= linklookup.get(l.getSourceId());
				ModularityNode end= linklookup.get(l.getSourceId());
				start.addLink(ml);
				end.addLink(ml);
			}
			
		}
		
		boolean notterminate = true;

		int linksize;
		
		while(notterminate){			
			final List<Future<?>> futures = new ArrayList<Future<?>>();
			notterminate = false;
			final PriorityBlockingQueue<ModularityLink> linksort = new PriorityBlockingQueue<ModularityLink>();
			linksize= links.size();
			final int itrsize=linksize/nThreads;
			for(int i = 0;i<nThreads;i++){
				
				final int passval =i; 
				
				Future<?> foo = executor.submit(new Callable<Boolean>(){
					@Override
					public Boolean call() throws Exception {
						boolean nt=false;
						for(int lnknum=0;lnknum<itrsize;lnknum++){							
							ModularityLink ln = links.get(passval*itrsize + lnknum);
							long nc=0;
							if(ln.source.neighbourcounts.containsKey(ln.target)){
							 nc=ln.source.neighbourcounts.get(ln.target).intValue();
							}
							else{
								System.out.println("Oooops");
							}
							
							long q = nc-(ln.source.totalvolume*ln.target.totalvolume)/2;
							
							if(q>0)nt=true;
							ln.q.set(q);
							linksort.add(ln);							
						}
						return nt;
					}
					});
				
				futures.add(foo);

				
			}
			
			for (Future<?> foo : futures) {
				try {
					notterminate=(Boolean)foo.get();
				} catch (InterruptedException interruptedCancellingAndSignalling) {
					Thread.currentThread().interrupt();
				} catch (ExecutionException wtf) {
					wtf.printStackTrace();
				}
			}
			
			if(!notterminate)break;
			//Now we take each link in the queue and add it to maximal matching 
			ConcurrentLinkedQueue<ModularityLink> maximalmatching =  new ConcurrentLinkedQueue<ModularityAggregator.ModularityLink>();
			ConcurrentSkipListSet<ModularityNode> vertexcheck =  new ConcurrentSkipListSet<ModularityAggregator.ModularityNode>();
			ModularityLink top=linksort.poll();
			maximalmatching.add(top);
			vertexcheck.add(top.source);
			vertexcheck.add(top.target);
			while(!linksort.isEmpty()){
				ModularityLink nlnk=linksort.poll();
				if(nlnk.q.intValue()<0)continue;
				
				if(vertexcheck.contains(nlnk.source) || vertexcheck.contains(nlnk.target)) 
					continue;
				maximalmatching.add(nlnk);
				vertexcheck.add(nlnk.source);
				vertexcheck.add(nlnk.target);
			}

			//Now we take all the pairs in maximal matching and fuse them
			for(ModularityLink ln : maximalmatching){
				ModularityNode so = ln.source;
				ModularityNode tr = ln.target;
				so.assimilate(tr);
				groups.remove(tr);
				
				
				links.remove(ln);
			}
			linksize= links.size();
			if(linksize==1) 
				notterminate=false;
		}
		
		/*
		final List<Future<?>> futures = new ArrayList<Future<?>>();
		
		Future<?> foo = executor.submit(new Runnable(){

			@Override
			public void run() {

			}});
		
		futures.add(foo);
		*/
		clusterSet = new ArrayList<Set<Node>>();

		
		for (ModularityNode g : groups) {
			
			if (cancel) {
	    		setStatusWaiting();
	    		return;
	    	}
			Set<Node> set=new HashSet<Node>();
			clusterSet.add(set);
			
			for (Node n :g.nodes) {

				if (cancel) {
		    		setStatusWaiting();
		    		return;
		    	}
				
				set.add(n);

				
			}

		}
		if (clusterer != null) {
			graphResult = clusterer.convertClusterSet(clusterSet);
		}
		stopWatch.stop();
		System.out.println("Finished Modularity clustering algorithm.");
		System.out.println("Algorithm took " + stopWatch.toString());//30 = 33.487
		stopWatch.reset();
		this.result=result;
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
		return this.result;
	}	

	@Override
	public Collection<Set<Node>> getClusterSet() {
		return this.clusterSet;
	}

}
	