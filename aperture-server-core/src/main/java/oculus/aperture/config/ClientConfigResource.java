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
package oculus.aperture.config;

import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;
import org.restlet.resource.ServerResource;

import com.google.inject.Inject;
import com.google.inject.name.Named;

/**
 * Provides a configuration resource as javascript. An optional REST endpoint 
 * that can be used by the client to reference a config file that lives outside of
 * the war file, in an easily edited location on the web server. 
 * 
 * When aperture.client.configfile is not configured in the server configuration
 * this endpoint will return an empty string. The expectation in that case is 
 * that the client will reference a static resource instead of this endpoint. 
 * This ensures that aperture apps can be deployed without services (like this one).
 *
 */
public class ClientConfigResource extends ServerResource {

	
	private final String js;

	
	@Inject
	public ClientConfigResource(@Named("aperture.client.config") String json) {
		this.js = json;
	}
	
	
	@Get
	public StringRepresentation getConfig() {
		
		// Get parameters from query
		Form form = getRequest().getResourceRef().getQueryAsForm();		
		String jsonP = form.getFirstValue("jsonp");					
		
		// Handle JSONP request
		String result;
		if( jsonP != null && jsonP.isEmpty() == false ) {
			// Allow a different method to be called
			result = jsonP + "(" + js + ");";
		} else {
			if (!js.trim().startsWith("aperture.config.provide")) {
				// Call the default, config.provide
				result = "aperture.config.provide(" + js + ");";
			} else {
				result = js;
			}
		}

		StringRepresentation sr = new StringRepresentation(result);
		sr.setMediaType(MediaType.APPLICATION_JAVASCRIPT);
		
		return sr;
	}
	
	
	
}
