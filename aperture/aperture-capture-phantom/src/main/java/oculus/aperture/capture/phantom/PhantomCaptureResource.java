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

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import oculus.aperture.common.EmptyProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.capture.CaptureService;
import oculus.aperture.spi.common.Properties;

import org.json.JSONArray;
import org.json.JSONObject;
import org.restlet.data.CacheDirective;
import org.restlet.data.Cookie;
import org.restlet.data.Form;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.resource.Get;
import org.restlet.resource.ResourceException;

import com.google.common.collect.Maps;
import com.google.inject.Inject;
import com.google.inject.name.Named;

/**
 * Provides access to an image capture service.  Accepts one of two content types:
 * URL as text/plain: captures the url
 * HTML as text/html: captures the given HTML data
 *
 * Expects all transmitted data in UTF-8
 */
public abstract class PhantomCaptureResource extends ApertureServerResource {
	
	protected RenderExecutor phantomManager;
	
	// The default time to wait for a page to load before rendering.
	private final int DEFAULT_RENDER_DELAY = 50;
	
	// default config is empty.
	protected Properties config= EmptyProperties.EMPTY_PROPERTIES;
	
	@Inject(optional=true)
	public void setConfig(@Named("aperture.server.config") Properties config) {
		this.config = config;
	}
	
	@Inject
	public PhantomCaptureResource(
		RenderExecutor phantomManager
	) throws IOException {
		this.phantomManager = phantomManager;
	}
	
	
	
	
	/**
	 * Handles POST calls to the capture endpoint.  The body of the POST contains either
	 * a URL to capture or static HTML content to capture.
	 * 
	 * @param  entity
	 * @return On success, a 201 status, a JSON block containing the id of the image resource created and
	 * 		   a Location Ref header with the URL to the created resource.  On failure a fail status code plus a
	 * 		   JSON block with an error message.
	 * @throws ResourceException
	 */
	@Get
	public Representation getCapturedImage() throws ResourceException {

		Form form = getRequest().getResourceRef().getQueryAsForm();

		// make sure this is initialized and ready to go
		phantomManager.init(getRootRef().toString());

		// Get parameters from query
		int captureWidth = 16;
		int captureHeight = 16;
		CaptureService.ImageType format = CaptureService.ImageType.PNG;

		
		// get url from query
		String url = form.getFirstValue("page");
		if( url == null ) {
			// Should never get here, but error with no id
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST,
				"Must provide an id");
		}
		
		boolean cacheable= true;
		// get cache flag from query. currently only accepts indication that it should not cache at all.
		String str = form.getFirstValue("cache");
		if( str != null ) {
			if (str.equalsIgnoreCase("false") || str.equalsIgnoreCase("no-cache") || str.equalsIgnoreCase("none")) {
				cacheable = false;
			}
		}

		boolean reload= false;
		// get reload flag
		str = form.getFirstValue("reload");
		if( str != null ) {
			reload = Boolean.valueOf(str);
		}

		// get capture width from query
		str = form.getFirstValue("captureWidth");
		if( str != null ) {
			try {
				captureWidth = Integer.valueOf(str);
			} catch (NumberFormatException e) {
				// Not a number
				getApertureLogger().error("Bad number format in 'captureWidth' parameter", e);
			}
		}

		// get capture height from query
		str = form.getFirstValue("captureHeight");
		if( str != null ) {
			try {
				captureHeight = Integer.valueOf(str);
			} catch (NumberFormatException e) {
				// Not a number
				getApertureLogger().error("Bad number format in 'captureHeight' parameter", e);
			}
		}

		// get capture format from query
		str = form.getFirstValue("format");
		if( str != null ) {
			try {
				format = CaptureService.ImageType.valueOf(str);
				
				if (format.equals(CaptureService.ImageType.SVG)) {
					throw new IllegalArgumentException();
				}
			} catch (IllegalArgumentException e) {
				// Not a valid format
				getApertureLogger().error("Unsupported image format in 'format' parameter: " + str, e);
			}
		}

		int renderDelay = DEFAULT_RENDER_DELAY;
		
		// get the desired render delay from query
		str = form.getFirstValue("renderDelay");
		if( str != null ) {
			try {
				renderDelay = Integer.valueOf(str);
			} catch (IllegalArgumentException e) {
			}
		}
		
		// get username from query if exists
		String username = form.getFirstValue("username");
		
		// get password from query if exists
		String password = form.getFirstValue("password");
		
		// create a temporary file that phantomJS will render to
		File tempFile = null;
		try {
			tempFile = File.createTempFile("phantom_tmp", format.getExtension());
		} catch (IOException e1) {
			throw new ResourceException(Status.SERVER_ERROR_INTERNAL,
				"Unable to crate temporary file for image rendering.");
		}

		JSONArray cookies = new JSONArray();
		for(Cookie cookie : getRequest().getCookies()) {
			String hostDomain = getRequest().getResourceRef().getHostDomain();
			if(cookie.getDomain() == null) {
				cookie.setDomain(hostDomain);
			} else if(!cookie.getDomain().equals(hostDomain)) {
				continue; // filter out cookies from other domains
			}
			cookies.put(new JSONObject(cookie));
		}
		
		// Create JSON object to that packages up information needed by phantomJS
		Map<String,Object> params = Maps.newHashMap();
		params.put("source", url);
		params.put("reload", reload);
		params.put("width", captureWidth);
		params.put("height", captureHeight);
		params.put("mimeType", format.getMimeType());
		params.put("renderDelay", renderDelay);
		params.put("filename", tempFile);
		params.put("username", username);
		params.put("password", password);
		params.put("cookies", cookies);
		
		// execute task
		Representation rep = executeTask(params);

		// Remove temp file
		if (tempFile != null && tempFile.exists()) {
			if (!tempFile.delete()) {
				getApertureLogger().warn("Failed to delete temp image: " + tempFile.getAbsolutePath());
			}
		}

		final int maxAge = config.getInteger("aperture.imagecapture.maxage", 604800);

		// should specify cache directive here from config
		getResponse().setCacheDirectives(
			Collections.singletonList(cacheable? CacheDirective.maxAge(maxAge):
				CacheDirective.noCache()));
					
		if (rep == null) {
			throw new ResourceException(
				Status.SERVER_ERROR_INTERNAL,
				"Image rendering failed to complete for an unknown reason."
			);
		}
		
		return rep;
	}




	protected abstract Representation executeTask(Map<String, Object> jsonRep);
}
