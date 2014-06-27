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
package oculus.aperture.layout.tag;

import java.util.Collection;

import oculus.aperture.layout.LayoutGraph;
import oculus.aperture.layout.impl.BasicTagResult;
import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.layout.options.LayoutOptions;
import oculus.aperture.spi.layout.options.TagLayoutOptions;

/**
 * Exposes trellis deconfliction as a deconfliction service.
 * 
 * @author djonker
 */
public class TrellisDeconflictionService implements LayoutGraph {

	private TrellisDeconfliction deconfliction;
	private Collection<? extends Node> nodes;
	
	/**
	 * Default service constructor.
	 */
	public TrellisDeconflictionService() {
		deconfliction = new TrellisDeconfliction();
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraph#setGraph(java.util.Collection, java.util.Collection)
	 */
	@Override
	public void setGraph(Collection<? extends Node> nodes, Collection<? extends Link> links) {
		this.nodes = nodes;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraph#layout(oculus.aperture.spi.GraphLayoutOptions)
	 */
	@Override
	public Extents layout(LayoutOptions options) {
		TagLayoutOptions ex = (TagLayoutOptions) options;
		
		final int pos[] = deconfliction.deconflict(ex, nodes, null);
		int defpos = ex.getPreferredAlignment();
		
		// validate this.
		switch (defpos) {
		case TagLayoutOptions.ALIGN_BOTTOM_LEFT:
		case TagLayoutOptions.ALIGN_BOTTOM_CENTER:
		case TagLayoutOptions.ALIGN_BOTTOM_RIGHT:
		case TagLayoutOptions.ALIGN_TOP_LEFT:
		case TagLayoutOptions.ALIGN_TOP_CENTER:
		case TagLayoutOptions.ALIGN_TOP_RIGHT:
		case TagLayoutOptions.ALIGN_MIDDLE_RIGHT:
		case TagLayoutOptions.ALIGN_MIDDLE_LEFT:
			break;
			
		default:
			defpos = 0;
		}
		
		int i=0;
		for (Node node : nodes) {
			final boolean visible = pos[i] != 0;
			final BasicTagResult decon = new BasicTagResult(
					visible? pos[i] : defpos!=0? defpos : deconfliction.getPreferredAlignment(i), 
					visible, node.getWidth(), node.getHeight());
			
			node.setTag(decon);
			i++;
		}
		
		return ex.getPageExtents();
	}

	
}
