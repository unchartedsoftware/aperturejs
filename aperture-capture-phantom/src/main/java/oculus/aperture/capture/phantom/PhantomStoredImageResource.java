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

import java.io.IOException;
import java.util.Map;

import oculus.aperture.capture.phantom.data.ProcessedTaskInfo;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

import org.restlet.data.Form;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.representation.Representation;

import com.google.common.collect.Maps;
import com.google.inject.Inject;

/**
 * Provides access to an image capture service.  Accepts one of two content types:
 * URL as text/plain: captures the url
 * HTML as text/html: captures the given HTML data
 *
 * Expects all transmitted data in UTF-8
 */
public class PhantomStoredImageResource extends PhantomCaptureResource {
	
	@Inject
	public PhantomStoredImageResource(
		RenderExecutor phantomManager
	) throws IOException {
		super(phantomManager);
	}
	
	
	
	
	@Override
	protected Representation executeTask(Map<String, Object> params) {
		
		Form form = getRequest().getResourceRef().getQueryAsForm();

		String store = form.getFirstValue("store");
		
		if (store == null) {
			store = config.getString("aperture.imagecapture.cms.store", "aperture");
		}
		
		// these may all validly be null
		params.put("store", store);
		params.put("id", form.getFirstValue("id"));
		params.put("rev", form.getFirstValue("rev"));

		// execute
		DocumentDescriptor taskInfo = phantomManager.storedImageRender(params);

		
		Map<String,Object> response = Maps.newHashMap();
		
		// process result.
		if (taskInfo != ProcessedTaskInfo.NONE) {
			
			// Return a response containing a JSON block with the id/rev
			response.put("id", taskInfo.getId());
			response.put("store", taskInfo.getStore());
			
	
			// if have a revision append it.
			if (taskInfo.getRevision() != null) {
				response.put("rev", taskInfo.getRevision());
			}
			
		} else {
			return null;
			
		}

		// Return a JSON response
		return new JsonRepresentation(response);
	}
}
