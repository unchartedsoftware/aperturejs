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

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import oculus.aperture.layout.impl.BasicLayoutResults;
import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.LayoutResults;
import oculus.aperture.spi.layout.LayoutService;
import oculus.aperture.spi.layout.options.LayoutOptions;

import com.google.inject.Inject;


/**
 * Implements a GraphLayoutService. Note that this is not declared as a
 * Guice Singleton, meaning one will be created for every client that
 * injects it.
 * 
 * @author djonker
 */
public class LayoutServices implements LayoutService {

	private Map<String, List<LayoutGraphFactory>> layoutServiceProviders = 
		new HashMap<String, List<LayoutGraphFactory>>();

	/**
	 * Register all guice injected layout services.
	 */
	@Inject
	public LayoutServices(Set<LayoutGraphFactory> services){
		for (LayoutGraphFactory layoutService : services) {
			for(String layoutId : layoutService.getAvailableLayouts()){
				List<LayoutGraphFactory> facts = layoutServiceProviders.get(layoutId);
				if (facts == null) {
					layoutServiceProviders.put(layoutId, facts = new LinkedList<LayoutGraphFactory>());
				}
				// insert as first option.
				facts.add(0, layoutService);
			}
		}		
	}
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutService#layout(java.util.Collection, oculus.aperture.spi.layout.LinkSet, oculus.aperture.spi.Properties)
	 */
	@Override
	public LayoutResults layout(final Collection<? extends Node> nodes, Collection<? extends Link> links, LayoutOptions options) throws Exception {
		List<LayoutGraphFactory> providers = layoutServiceProviders.get(options.getLayoutType());

		// find providers for this type.
		if (providers != null) {
			
			for (LayoutGraphFactory provider : providers) {

				// a layout algorithm may reject a particular layout problem.
				if (provider.handles(options, nodes.size(), links.size())) {
					
					// Take the first and create the graph abstraction.
					LayoutGraph graph = provider.getGraph(options.getLayoutType());
					graph.setGraph(nodes, links);
					
					final Extents extents = graph.layout(options);
					
					return new BasicLayoutResults(nodes, links, extents);
				}
			}
			
			throw new Exception("No layout service provider accepted the layout task: " + options.getLayoutType());
			
		} else {
			throw new Exception("No layout service provider was found for the layout: " + options.getLayoutType());
		}
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutService#getAvailableLayouts()
	 */
	public List<String> getAvailableLayouts() {
		return new ArrayList<String>(layoutServiceProviders.keySet());
	}


	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutService#parseOptions(java.lang.String, oculus.aperture.spi.Properties)
	 */
	@Override
	public LayoutOptions parseOptions(String layoutType, Properties extents, Properties options) throws Exception {
		List<LayoutGraphFactory> providers = layoutServiceProviders.get(layoutType);

		// find providers for this type.
		if (providers != null) {
			
			return providers.get(0).parseOptions(layoutType, extents, options);
			
		} else {
			throw new Exception("No layout service provider was found for the layout: " + layoutType);
		}
	}
	
	
}
