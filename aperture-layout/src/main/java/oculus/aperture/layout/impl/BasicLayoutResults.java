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

import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.layout.LayoutResults;

/**
 * @author djonker
 *
 */
public class BasicLayoutResults implements LayoutResults {

	private Extents extents;
	private Collection<? extends Node> nodes;
	private Collection<? extends Link> links;
	
	/**
	 * Constructs a basic empty node layout.
	 */
	public BasicLayoutResults(
		Collection<? extends Node> nodes, 
		Collection<? extends Link> links, 
		Extents extents
	) {
		this.nodes = nodes;
		this.links = links;
		this.extents = extents;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.NodeLayout#getExtents()
	 */
	@Override
	public Extents getExtents() {
		return extents;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.NodeLayout#getNodes()
	 */
	@Override
	public Collection<? extends Node> getNodes() {
		return nodes;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutResults#getLinks()
	 */
	@Override
	public Collection<? extends Link> getLinks() {
		return links;
	}

	
}
