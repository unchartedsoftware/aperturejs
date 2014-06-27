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
package oculus.aperture.capture.phantom;
 
import oculus.aperture.common.rest.ApertureServerResource;

import org.restlet.data.CacheDirective;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;

import com.google.common.collect.ImmutableList;
import com.google.inject.Inject;

/**
 * @author djonker
 *
 */
public class PhantomStartRequestHandler extends ApertureServerResource {

	private RenderExecutor executor;
	
	/**
	 * Serves the purpose of pre-starting the renderer pool if desired.
	 * This can take a while (e.g. twenty seconds), so often it is
	 * ideal for the pool to prepare itself on startup rather than 
	 * first request.
	 */
	@Inject
	public PhantomStartRequestHandler(RenderExecutor executor) {
		this.executor = executor;
	}
	
	
	
	
	@Get
	public StringRepresentation start() {
		
		// never cache this response (in case you were thinking of it)
		getResponse().setCacheDirectives(ImmutableList.of(CacheDirective.noCache()));
		
		// make sure this is initialized and ready to go
		executor.init(getRootRef().toString());
		
		return new StringRepresentation("started");
	}
}
