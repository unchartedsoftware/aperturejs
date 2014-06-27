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

public class QuadTree {
	private QuadNode root;
	
	public QuadTree(Rectangle2D rect) {
		root = new QuadNode(rect.getMinX(), rect.getMinY(), rect.getWidth(), rect.getHeight());
	}
	
	public QuadTree(double x, double y, double width, double height) {
		root = new QuadNode(x, y, width, height);
	}
	
	public void insert(double x, double y, Object dataVal) {
		insertIntoQuadNode(root, new QuadNodeData(x, y, dataVal));
	}
	
	public QuadNode getRoot() {
		return root;
	}
	
	private void insertIntoQuadNode(QuadNode qn, QuadNodeData data) {
		if (qn == null)
			return;
		qn.incrementChildren();
		
		// case 1: leaf node, no data
		// 	 just add the values and get out
		if (qn.getnChildren() == 1) {
			qn.setData(data);
			qn.setCenterOfMass( new Point2D.Double(data.getX(), data.getY()) );
			return;
		}
		
		// move the center of mass by scaling old value by (n-1)/n and adding the 1/n new contribution
		double scale = ((double)qn.getnChildren()-1)/qn.getnChildren();
		double newX = scale * qn.getCenterOfMass().getX() + (1-scale) * data.getX();
		double newY = scale * qn.getCenterOfMass().getY() + (1-scale) * data.getY();
		qn.getCenterOfMass().setLocation(newX, newY);

		// case 2: leaf needs to become internal
		if (qn.getData() != null) {
			Rectangle2D pb = qn.getBounds(); // shortens the following lines
			qn.setNW( new QuadNode(pb.getMinX(), pb.getCenterY(), pb.getWidth()/2, pb.getHeight()/2) );
			qn.setNE( new QuadNode(pb.getCenterX(), pb.getCenterY(), pb.getWidth()/2, pb.getHeight()/2) );
			qn.setSW( new QuadNode(pb.getMinX(), pb.getMinY(), pb.getWidth()/2, pb.getHeight()/2) );
			qn.setSE( new QuadNode(pb.getCenterX(), pb.getMinY(), pb.getWidth()/2, pb.getHeight()/2) );
			QuadNodeData oldValue = qn.getData();
			qn.setData(null);
			insertIntoContainingChildQuandrant(qn, oldValue);
		}
		
		// case 3: internal node, has more than one child but no nodedata
		//    just push into the proper subquadrant (which already exists)
		insertIntoContainingChildQuandrant(qn, data);
		
	}
	
	private void insertIntoContainingChildQuandrant(QuadNode qn, QuadNodeData qnd) {
		QuadNode childRecursionQuad = null;
		if (qn.getNW().getBounds().contains(qnd.getX(), qnd.getY())) {
			childRecursionQuad = qn.getNW();
		} else if (qn.getNE().getBounds().contains(qnd.getX(), qnd.getY())) {
			childRecursionQuad = qn.getNE();
		} else if (qn.getSW().getBounds().contains(qnd.getX(), qnd.getY())) {
			childRecursionQuad = qn.getSW();
		} else if (qn.getSE().getBounds().contains(qnd.getX(), qnd.getY())) {
			childRecursionQuad = qn.getSE();
		}
		insertIntoQuadNode(childRecursionQuad, qnd);
	}
	
}
