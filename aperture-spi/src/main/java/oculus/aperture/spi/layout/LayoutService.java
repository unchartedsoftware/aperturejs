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
package oculus.aperture.spi.layout;

import java.util.Collection;
import java.util.List;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.LayoutOptions;

/**
 * Service endpoint of a layout service.
 */
public interface LayoutService {

	/**
	 * Parses a generic set of properties into a specific typed set of layout properties.
	 * @throws Exception 
	 */
	public LayoutOptions parseOptions(String layoutType, Properties extents, Properties properties) throws Exception;
	
	/**
	 * Executes a layout on a simple, generic, interface-based graph representation.
	 */
	public LayoutResults layout(Collection<? extends Node> nodes, Collection<? extends Link> links, LayoutOptions options) throws Exception;
	
	/**
	 * Returns a list of the supported layouts provided by this particular layout service.
	 */
	public List<String> getAvailableLayouts();
}
