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

import oculus.aperture.capture.phantom.data.PhantomImageData;
import oculus.aperture.common.rest.BlobRepresentation;
import oculus.aperture.spi.palette.ImageService.ImageData;

import org.restlet.data.Disposition;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.Representation;

import com.google.inject.Inject;

/**
 * Provides access to an image capture service.  Accepts one of two content types:
 * URL as text/plain: captures the url
 * HTML as text/html: captures the given HTML data
 *
 * Expects all transmitted data in UTF-8
 */
public class PhantomInlineCaptureResource extends PhantomCaptureResource {
	
	@Inject
	public PhantomInlineCaptureResource(
		RenderExecutor phantomManager
	) throws IOException {
		super(phantomManager);
	}
	
	
	
	
	@Override
	protected Representation executeTask(Map<String, Object> params) {
		final Form form = getRequest().getResourceRef().getQueryAsForm();
		final String filename = form.getFirstValue("downloadAs");
		
		ImageData imageData = phantomManager.inlineImageRender(params);

		if (imageData != PhantomImageData.NONE) {
			// Return a blob response
			final Representation resp = new BlobRepresentation(
				MediaType.valueOf(imageData.getMediaType()),
				imageData.getData()
			);
			
			if (filename != null && !filename.isEmpty()) {
				final Disposition disposition = new Disposition(Disposition.TYPE_ATTACHMENT);
				disposition.setFilename(filename);
				
				resp.setDisposition(disposition);
			}
			
			return resp;
		}

		// blame the client
		setStatus(Status.CLIENT_ERROR_NOT_FOUND);
		
		return null;
	}
}
