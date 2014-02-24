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
package oculus.aperture.capture;

import oculus.aperture.capture.phantom.PhantomInlineCaptureResource;
import oculus.aperture.capture.phantom.PhantomStartRequestHandler;
import oculus.aperture.capture.phantom.PhantomStoredImageResource;
import oculus.aperture.capture.phantom.RenderExecutor;
import oculus.aperture.capture.phantom.impl.PhantomRendererPool;
import oculus.aperture.capture.phantom.impl.PhantomRequestTaskResource;
import oculus.aperture.capture.phantom.impl.PhantomTaskResource;
import oculus.aperture.common.rest.ResourceDefinition;
import oculus.aperture.spi.capture.CaptureService;

import com.google.inject.AbstractModule;
import com.google.inject.multibindings.MapBinder;
import com.google.inject.name.Names;

public class PhantomCaptureModule extends AbstractModule{

	@Override
	protected void configure() {

		// Bind the capture mechanism implementation
		bind(RenderExecutor.class).to(PhantomRendererPool.class);
		bind(CaptureService.class).to(PhantomRendererPool.class);

		// the service will swap in a uid for {workerId} if defined here.
		// for correct operation it must be present if there is more than one phantom process / worker
		final String requestPath = "/capture/{workerId}/requestTask.html";
		bindConstant().annotatedWith(Names.named("aperture.imagecapture.phantomjs.requestendpoint")).to(requestPath);

		
		// Bind REST endpoints for clients.
		MapBinder<String, ResourceDefinition> resourceBinder =
			MapBinder.newMapBinder(binder(), String.class, ResourceDefinition.class);

		// Bind for POSTing or GETing capture results
		resourceBinder.addBinding("/capture/start").toInstance(new ResourceDefinition(PhantomStartRequestHandler.class));
		resourceBinder.addBinding("/capture/store").toInstance(new ResourceDefinition(PhantomStoredImageResource.class));
		resourceBinder.addBinding("/capture/inline").toInstance(new ResourceDefinition(PhantomInlineCaptureResource.class));
		
		// phantom internal implementation endpoints - never cache these
		resourceBinder.addBinding("/capture/{workerId}/taskmanager").toInstance(new ResourceDefinition(PhantomTaskResource.class));
		resourceBinder.addBinding(requestPath).toInstance(new ResourceDefinition(PhantomRequestTaskResource.class));
	}
}
