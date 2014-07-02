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

import java.util.ArrayList;
import java.util.List;

import oculus.aperture.spi.common.Node;

/**
 * Utilities for working with the quad tree structure
 * 
 * @author msavigny
 *
 */

public class QuadTreeUtils {

	/**
	 * Currently assumes the objects contained in the tree are LayoutNodes
	 * TODO : genericize the quadtree
	 * @param qn
	 * @return
	 */
	public static List<Node> getContainedNodes(QuadNode qn) {
		ArrayList<Node> nodes = new ArrayList<Node>(qn.getnChildren()); 
		getContainedNodesRecurse(qn, nodes);
		return nodes;
		
	}
	
	private static void getContainedNodesRecurse(QuadNode qn, List<Node> nodes) {
		if (qn.getData() != null) {
			nodes.add((Node)qn.getData().getValue());
		} else {
			getContainedNodesRecurse(qn.getNE(),nodes);
			getContainedNodesRecurse(qn.getNW(),nodes);
			getContainedNodesRecurse(qn.getSE(),nodes);
			getContainedNodesRecurse(qn.getSW(),nodes);
		}
	}
	
}
