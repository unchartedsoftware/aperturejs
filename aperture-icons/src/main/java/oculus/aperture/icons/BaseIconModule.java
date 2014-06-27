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
package oculus.aperture.icons;

import oculus.aperture.common.rest.ResourceDefinition;
import oculus.aperture.icons.coded.CodeIconFactory;
import oculus.aperture.icons.coded.DefaultCodeIconFactory;
import oculus.aperture.icons.coded.DefaultFontProvider;
import oculus.aperture.icons.coded.FontProvider;
import oculus.aperture.spi.palette.IconService;

import org.restlet.routing.Variable;

import com.google.inject.AbstractModule;
import com.google.inject.multibindings.MapBinder;

/**
 * Default icon set.
 * 
 * @author djonker
 */
public class BaseIconModule extends AbstractModule {

	@Override
	protected void configure() {
		bind(FontProvider.class).to(DefaultFontProvider.class);
		bind(CodeIconFactory.class).to(DefaultCodeIconFactory.class);
		
		// this is multi-bound by icon ontology name. Note that other modules can safely
		// contribute bindings as well to be aggregated by guice elsewhere for injection.
		MapBinder<String, IconService> mapbinder = MapBinder.newMapBinder(
				binder(), String.class, IconService.class);

		// Bind the service implementation
	    mapbinder.addBinding("aperture-hscb").to(SocioCulturalIconService.class);

	    
		MapBinder<String, ResourceDefinition> resourceBinder =
			MapBinder.newMapBinder(binder(), String.class, ResourceDefinition.class);

        // Provides the icon bindings.
        resourceBinder.addBinding("/icon/{ontology}/{type}").toInstance(
        		new ResourceDefinition(IconResource.class).setVariable("type",
						new Variable(Variable.TYPE_URI_PATH, "", false, false)));
	}
}
