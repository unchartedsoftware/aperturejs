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
package oculus.aperture.layout;

import java.util.List;

import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.LayoutOptions;

/**
 * @author djonker
 */
public interface LayoutGraphFactory {

	/**
	 * Returns the full set of supported layouts.
	 */
	public List<String> getAvailableLayouts();
	
	/**
	 * Gets a graph implementation capable of handling the layout specified.
	 */
	public LayoutGraph getGraph(String availableLayout);
	
	/**
	 * Parses a generic set of properties into a specific typed set of layout properties.
	 */
	public LayoutOptions parseOptions(String layoutType, Properties extents, Properties options);

	/**
	 * 
	 */
	public boolean handles(LayoutOptions options, int numNodes, int numLinks);
	
}
