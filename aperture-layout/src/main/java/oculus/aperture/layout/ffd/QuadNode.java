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

/**
 * Representing a quadrangle in space with either nothing or a single DataVal in it.
 * The number of children is the aggregate of all DataVal's in this rectangle's
 * geometric space.
 * @author cwu
 *
 */
public class QuadNode {
	private Rectangle2D bounds;		// area covered
	private QuadNode NW, NE, SW, SE;	// children
	private QuadNodeData data;			// if no children, the data node here
	private int nChildren;
	private Point2D centerOfMass;
	
	QuadNode(double x, double y, double width, double height) {
		bounds = new Rectangle2D.Double(x, y, width, height);
		nChildren = 0;
	}

	public Rectangle2D getBounds() {
		return bounds;
	}

	public QuadNode getNW() {
		return NW;
	}

	public QuadNode getNE() {
		return NE;
	}

	public QuadNode getSW() {
		return SW;
	}

	public QuadNode getSE() {
		return SE;
	}

	public void setNW(QuadNode nW) {
		NW = nW;
	}

	public void setNE(QuadNode nE) {
		NE = nE;
	}

	public void setSW(QuadNode sW) {
		SW = sW;
	}

	public void setSE(QuadNode sE) {
		SE = sE;
	}
	
	
	public QuadNodeData getData() {
		return data;
	}

	public int getnChildren() {
		return nChildren;
	}

	public Point2D getCenterOfMass() {
		return centerOfMass;
	}

	public void setData(QuadNodeData data) {
		this.data = data;
	}

	public void setCenterOfMass(Point2D centerOfMass) {
		this.centerOfMass = centerOfMass;
	}
	
	public void incrementChildren() {
		nChildren++;
	}


}
