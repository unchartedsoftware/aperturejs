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

import java.util.Collections;
import java.util.List;

import oculus.aperture.layout.LayoutGraph;
import oculus.aperture.layout.LayoutGraphFactory;
import oculus.aperture.layout.impl.BasicTagLayoutOptions;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.LayoutOptions;
import oculus.aperture.spi.layout.options.TagLayoutOptions;

/**
 * @author djonker
 *
 */
public class TrellisDeconflictionFactory implements LayoutGraphFactory {

	private final List<String> layouts;

	/**
	 * 
	 */
	public TrellisDeconflictionFactory() {
		layouts = Collections.singletonList(TagLayoutOptions.TAG);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraphFactory#getAvailableLayouts()
	 */
	@Override
	public List<String> getAvailableLayouts() {
		return layouts;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraphFactory#getGraph(java.lang.String)
	 */
	@Override
	public LayoutGraph getGraph(String availableLayout) {
		return new TrellisDeconflictionService();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraphFactory#parseOptions(java.lang.String, oculus.aperture.spi.Properties)
	 */
	@Override
	public LayoutOptions parseOptions(String layoutType, Properties extents, Properties options) {
		return new BasicTagLayoutOptions(layoutType, extents, options);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraphFactory#handles(oculus.aperture.spi.layout.LayoutOptions, int, int)
	 */
	@Override
	public boolean handles(LayoutOptions options, int numNodes, int numLinks) {
		return true;
	}
	
	

}
