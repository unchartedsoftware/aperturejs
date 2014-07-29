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
package oculus.aperture.capture.phantom.impl;

import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URL;
import java.nio.charset.Charset;

import oculus.aperture.common.rest.ApertureServerResource;

import org.restlet.data.CacheDirective;
import org.restlet.data.MediaType;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;

import com.google.common.collect.ImmutableList;
import com.google.common.io.CharStreams;
import com.google.common.io.InputSupplier;
import com.google.common.io.Resources;

/**
 * This rest resource serves the phantom.js instance with the necessary
 * code to ask the server for tasks to execute.
 */
public class PhantomRequestTaskResource extends ApertureServerResource {

	// Load this once on first use
	static String requestHTML;
	static {
		URL path = PhantomRequestTaskResource.class.getResource("requestTask.html");
		InputSupplier<InputStreamReader> inp = Resources.newReaderSupplier(path, Charset.forName("UTF-8"));
		
		try {
			requestHTML = CharStreams.toString(inp);
		} catch (IOException e) {
			System.err.println("Failed to load requestTask.html");
		}
	}
	
	public PhantomRequestTaskResource() {
	}
	
	@Get
	public StringRepresentation getRequestTask() {
		// never cache this response (in case you were thinking of it)
		getResponse().setCacheDirectives(ImmutableList.of(CacheDirective.noCache()));
		
		return new StringRepresentation(requestHTML, MediaType.TEXT_HTML);

	}
}
