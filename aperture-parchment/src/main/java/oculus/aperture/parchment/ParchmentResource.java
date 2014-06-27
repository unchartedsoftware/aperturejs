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
package oculus.aperture.parchment;
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


import java.io.IOException;
import java.io.InputStream;

import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.common.rest.BlobRepresentation;
import oculus.aperture.spi.palette.ImageProcessingException;

import org.restlet.data.MediaType;
import org.restlet.representation.Representation;
import org.restlet.resource.Get;

import com.google.common.io.ByteStreams;

/**
 * @author djonker
 *
 */
public class ParchmentResource extends ApertureServerResource {

	/**
	 * Parchment image resource.
	 */
	public ParchmentResource() {
	}

	@Get
	public Representation getParchment() throws ImageProcessingException {
		
		// get the ontology specifier
		final String sconfidence = (String)getRequest().getAttributes().get("confidence");
		final String scurrency = (String)getRequest().getAttributes().get("currency");

		int confidence = 100;
		int currency = 100;
		
		if (sconfidence != null && !sconfidence.isEmpty()) {
			try {
				confidence = snapFrom(Integer.parseInt(sconfidence));
			} catch (NumberFormatException e) {
				throw new ImageProcessingException("Failed to parse parchment confidence as an integer", e);
			}
		}
		if (scurrency != null && !scurrency.isEmpty()) {
			try {
				currency = snapFrom(Integer.parseInt(scurrency));
			} catch (NumberFormatException e) {
				throw new ImageProcessingException("Failed to parse parchment currency as an integer", e);
			}
		}
		
		// form name.
		final String name = "" + confidence + "-" + currency + ".jpg";
		
		// check for it.
		final InputStream stream = ParchmentResource.class.getResourceAsStream(name);

		if (stream == null) {
			throw new ImageProcessingException("Failed to load parchment image "+ name);
		}
		
		try {
			// return it.
			return new BlobRepresentation(MediaType.IMAGE_JPEG, ByteStreams.toByteArray(stream));
			
		} catch (IOException e) {
			throw new ImageProcessingException("Failed to read bytes from parchment image stream.", e);
		}
	}

	
	/**
	 * Snap to interval for parchment images.
	 */
	private static final int IMAGE_INTERVAL = 20;

	/**
	 * Snap to a valid increment.
	 */
	private int snapFrom(int raw) {
		if (raw >= 100)
			return 100;
		if (raw <= 0)
			return 0;
		
		return IMAGE_INTERVAL * (int)Math.round(1f/IMAGE_INTERVAL * raw);
	}
}
