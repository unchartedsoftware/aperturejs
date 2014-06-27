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

import oculus.aperture.common.rest.ResourceDefinition;
import oculus.aperture.layout.ffd.FFDLayoutFactory;
import oculus.aperture.layout.jgraph.JGraphFactory;
import oculus.aperture.layout.rest.LayoutResource;
import oculus.aperture.layout.tag.TrellisDeconflictionFactory;
import oculus.aperture.spi.layout.LayoutService;

import com.google.inject.AbstractModule;
import com.google.inject.multibindings.MapBinder;
import com.google.inject.multibindings.Multibinder;

public class BaseLayoutModule extends AbstractModule{

	@Override
	protected void configure() {
		// does most of the layout work.
		bind(LayoutService.class).to(LayoutServices.class);

		Multibinder<LayoutGraphFactory> binder =
			Multibinder.newSetBinder(binder(), LayoutGraphFactory.class);

		// should any of these be optional?
		binder.addBinding().to(FFDLayoutFactory.class);
		binder.addBinding().to(JGraphFactory.class);
		binder.addBinding().to(TrellisDeconflictionFactory.class);

		// rest
		MapBinder<String, ResourceDefinition> resourceBinder =
			MapBinder.newMapBinder(binder(), String.class, ResourceDefinition.class);

		resourceBinder.addBinding("/layout").toInstance(new ResourceDefinition(LayoutResource.class));
	}
}
