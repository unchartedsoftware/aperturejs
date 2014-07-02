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
package oculus.aperture.layout.jgraph;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import oculus.aperture.common.EmptyProperties;
import oculus.aperture.layout.LayoutGraph;
import oculus.aperture.layout.LayoutGraphFactory;
import oculus.aperture.layout.impl.BasicGraphLayoutOptions;
import oculus.aperture.layout.impl.BasicHTreeLayoutOptions;
import oculus.aperture.layout.impl.BasicVTreeLayoutOptions;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.GraphLayoutOptions;
import oculus.aperture.spi.layout.options.HorizontalTreeLayoutOptions;
import oculus.aperture.spi.layout.options.LayoutOptions;
import oculus.aperture.spi.layout.options.VerticalTreeLayoutOptions;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.google.inject.name.Named;

/**
 * @author djonker
 *
 */
@Singleton
public class JGraphFactory implements LayoutGraphFactory {

	private final List<String> layouts;
	
	// default config is empty.
	private Properties config= EmptyProperties.EMPTY_PROPERTIES;
	
	@Inject(optional=true)
	public void setConfig(@Named("aperture.server.config") Properties config) {
		this.config = config;
	}
	
	/**
	 * Construct a new factory.
	 */
	public JGraphFactory() {
		
		List<String> layouts = new ArrayList<String>();
		layouts.add(GraphLayoutOptions.CIRCLE);
		layouts.add(GraphLayoutOptions.RADIAL); // not really supported but use circle.
		layouts.add(GraphLayoutOptions.ORGANIC);
		layouts.add(VerticalTreeLayoutOptions.VERTICAL_TREE);
		layouts.add(HorizontalTreeLayoutOptions.HORIZONTAL_TREE);
		
		this.layouts = Collections.unmodifiableList(layouts);
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.layout.GraphLayoutTypeService#getAvailableLayouts()
	 */
	@Override
	public List<String> getAvailableLayouts() {
		return layouts;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.GraphLayoutTypeService#getGraph(java.lang.String)
	 */
	@Override
	public LayoutGraph getGraph(String availableLayout) {
		return new JGraphLayoutService();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraphFactory#parseOptions(java.lang.String, oculus.aperture.spi.Properties)
	 */
	@Override
	public LayoutOptions parseOptions(String layoutType, Properties extents, Properties options) {
		if (layoutType.equals(HorizontalTreeLayoutOptions.HORIZONTAL_TREE)) {
			return new BasicHTreeLayoutOptions(layoutType, extents, options);
		} else if (layoutType.equals(VerticalTreeLayoutOptions.VERTICAL_TREE)) {
			return new BasicVTreeLayoutOptions(layoutType, extents, options);
		} 
		return new BasicGraphLayoutOptions(layoutType, extents, options);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.layout.LayoutGraphFactory#handles(oculus.aperture.spi.layout.LayoutOptions, int, int)
	 */
	@Override
	public boolean handles(LayoutOptions options, int numNodes, int numLinks) {
		
		// use a simple heuristic for now.
		return numLinks <= config.getInteger("aperture.layout.jgraph.limits.numlinks", 5000);
	}

}
