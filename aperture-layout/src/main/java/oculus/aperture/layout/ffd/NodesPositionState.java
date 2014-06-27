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
import java.awt.geom.Rectangle2D;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import oculus.aperture.spi.common.Node;


/**
 * NodePositionState contains a set of node ids and associated positions
 * in world space.
 *
 * 
 * @author msavigny
 *
 */
public class NodesPositionState {

	private Map<String, Point2D.Double> _posMap;
	
	private Rectangle2D.Double _bb;
	
	/**
	 * Builds an empty node position state.
	 */
	public NodesPositionState() {
		_posMap = new HashMap<String, Point2D.Double>();
	}
	
	/**
	 * Builds a node position state from a graph and a set of nodes of interest
	 * @param graph
	 * @param collection
	 */
	public NodesPositionState(Collection<Node> collection) {
		_posMap = new HashMap<String, Point2D.Double>();
		for (Node nm : collection) {
			_posMap.put(nm.getId(), new Point2D.Double(nm.getX(), nm.getY()));
		}
	}
	
	public NodesPositionState(Map<String, Node> graph, Set<String> nodeIds) {
		_posMap = new HashMap<String, Point2D.Double>();
		for (String id : nodeIds) {
			Node nm = graph.get(id);
			if (nm == null) continue;
			_posMap.put(id, new Point2D.Double(nm.getX(), nm.getY()));
		}
	}

	public void setPosition(String id, double x, double y) {
		_posMap.put(id, new Point2D.Double(x, y));
		_bb = null;
	}
	
	public Set<String> getNodeIds() {
		return _posMap.keySet();
	}
	
	public Point2D getPositionForId(String id) {
		return _posMap.get(id);
	}
	
	public Collection<Point2D.Double> getAllPositions() {
		return _posMap.values();
	}
	
	public Rectangle2D getBoundingBox() {
		if (_bb != null) return _bb;
		_bb = new Rectangle2D.Double();
		for (Point2D.Double p : _posMap.values()) {
			_bb.add(p);
		}
		
		return _bb;
	}
	
}
