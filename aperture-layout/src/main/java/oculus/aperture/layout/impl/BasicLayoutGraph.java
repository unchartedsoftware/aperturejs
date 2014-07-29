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
package oculus.aperture.layout.impl;

import java.util.Collection;

import oculus.aperture.common.BasicExtents;
import oculus.aperture.layout.LayoutGraph;
import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.layout.options.LayoutOptions;
import oculus.aperture.spi.layout.options.LayoutOptions.ExtentsFit;

/**
 * Abstract implementation of <class>LayoutGraph</class>.
 *
 */
public abstract class BasicLayoutGraph implements LayoutGraph {
	

	private Collection<? extends Node> nodes;
	private Collection<? extends Link> links;
	
	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraph#setGraph(java.util.Collection, java.util.Collection)
	 */
	@Override
	public void setGraph(Collection<? extends Node> nodes, Collection<? extends Link> links) {
		this.nodes = nodes;
		this.links = links;
	}

	/**
	 * Returns the list of nodes.
	 */
	protected Collection<? extends Node> getNodes() {
		return nodes;
	}

	/**
	 * Returns the list of links.
	 */
	protected Collection<? extends Link> getLinks() {
		return links;
	}
	
	/**
	 * Executes the layout.
	 */
	protected abstract void doLayout(LayoutOptions options);


	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.AbstractGraph#layout(oculus.aperture.spi.Properties)
	 */
	@Override
	public Extents layout(LayoutOptions options) {
		
		// call into subclass implementation to do the bulk of the work
		doLayout(options);

		// then form result
		final BasicExtents extents = new BasicExtents();
		
		for (Node node : nodes) {
			extents.extend((int)node.getX(), (int)node.getY());
			extents.extend((int)node.getX()+ node.getWidth(), (int)node.getY()+ node.getHeight());
		}
		
		// add any extras.
		return processExtents(nodes, extents, options);
	}

	/**
	 * Scale to fit extents as requested.
	 */
	private BasicExtents processExtents(Collection<? extends Node> nodes, BasicExtents graphExtents, LayoutOptions options) {
		final ExtentsFit fit = options.getFit();
		final BasicExtents fitTo = new BasicExtents(options.getPageExtents());
		
		// any fitting required?
		if (!fit.equals(ExtentsFit.NONE) && !fitTo.isEmpty() && !graphExtents.isEmpty()) {
			
			// if limit and within it, no further action required.
			if (fit.equals(ExtentsFit.LIMIT) && fitTo.contains(graphExtents) ) {
				return graphExtents;
			}
			
			float sx = (float)fitTo.getWidth() / graphExtents.getWidth();
			float sy = (float)fitTo.getHeight() / graphExtents.getHeight();

			// keep aspect ratio?
			if (!fit.equals(ExtentsFit.STRETCH)) {
				if (sx > sy) {
					sx = sy;
				} else {
					sy = sx;
				}
			}
			
			int tx = (int)Math.round(fitTo.getLeft() - sx*graphExtents.getLeft()
				+ 0.5f*(fitTo.getWidth() - sx*graphExtents.getWidth()));
			
			int ty = (int)Math.round(fitTo.getTop() - sy*graphExtents.getTop()
				+ 0.5f*(fitTo.getHeight() - sy*graphExtents.getHeight()));

			// transformation necessary?
			if (sx != 1 || sy != 1 || tx != 0 || ty != 0) {
				for (Node node : nodes) {
					node.setX((int)Math.round(tx + sx* node.getX() + 0.5*(sx)* node.getWidth()));
					node.setY((int)Math.round(ty + sy* node.getY() + 0.5*(sy)* node.getHeight()));
				}
				
				final BasicExtents e = new BasicExtents();
				
				e.extend(tx + graphExtents.getLeft(), 
						ty + graphExtents.getTop());
				e.extend(tx + (int)Math.round(sx*graphExtents.getRight()), 
						ty + (int)Math.round(sy*graphExtents.getBottom()));
				
				return e;
			}
		}
		
		return graphExtents;
	}
	
}
