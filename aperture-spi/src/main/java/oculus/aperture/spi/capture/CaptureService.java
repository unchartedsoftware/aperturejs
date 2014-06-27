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
package oculus.aperture.spi.capture;

import java.util.Map;

import javax.xml.ws.http.HTTPException;

import oculus.aperture.spi.palette.ImageService;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

/**
 * @author rharper
 *
 */
public interface CaptureService extends ImageService {

	/**
	 * Captures a given we URL to an image
	 *
	 * @param params A set of typed parameters describing the request:
	 * <ul>
	 * <li><code>{String} <strong>page</strong></code> - the url of the page</li>
	 * <li><code>{String} <strong>format</strong>=["PNG"|"JPEG"]</code> - the desired image format</li>
	 * <li><code>{Integer} <strong>captureWidth</strong></code> - the width of the source capture</li>
	 * <li><code>{Integer} <strong>captureHeight</strong></code> - the height of the source capture</li>
	 * <br><br>
	 * <li><code>{Boolean} [<strong>reload</strong>=false]</code> - optionally whether to force a reload even if the url is the same as the last capture</li>
	 * <li><code>{Integer} [<strong>renderDelay</strong>=50]</code> - optionally the number of milliseconds to wait after load before capture</li>
	 * <li><code>{String} [<strong>username</strong>=null]</code> - optionally a username for basic http authentication</li>
	 * <li><code>{String} [<strong>password</strong>=null]</code> - optionally a password for basic http authentication</li>
	 * </ul>
	 * 
	 * @return The image data in byte form
	 * @throws HTTPException
	 * @throws IllegalArgumentException
	 */
	public ImageData inlineImageRender(Map<String, Object> params) throws HTTPException, IllegalArgumentException;
	
	/**
	 * Captures a given web URL to an image, storing the result in the CMS and returning the address details.
	 *
	 * @param params A set of typed parameters describing the request:
	 * <ul>
	 * <li><code>{String} <strong>page</strong></code> - the url of the page</li>
	 * <li><code>{String} <strong>format</strong>=["PNG"|"JPEG"]</code> - the desired image format.</li>
	 * <li><code>{Integer} <strong>captureWidth</strong></code> - the width of the source capture</li>
	 * <li><code>{Integer} <strong>captureHeight</strong></code> - the height of the source capture</li>
	 * <br><br>
	 * <li><code>{String} [<strong>store</strong>="aperture.render"]</code> - optionally the cms store to use</li>
	 * <li><code>{String} [<strong>id</strong>=null]</code> - optionally the id of the document to store, else one will be assigned</li>
	 * <li><code>{String} [<strong>rev</strong>=null]</code> - optionally the revision of the document to store, else one will be assigned</li>
	 * <br><br>
	 * <li><code>{Boolean} [<strong>reload</strong>=false]</code> - optionally whether to force a reload even if the url is the same as the last capture</li>
	 * <li><code>{Integer} [<strong>renderDelay</strong>=50]</code> - optionally the number of milliseconds to wait after load before capture</li>
	 * <li><code>{String} [<strong>username</strong>=null]</code> - optionally a username for basic http authentication</li>
	 * <li><code>{String} [<strong>password</strong>=null]</code> - optionally a password for basic http authentication</li>
	 * </ul>
	 * 
	 * 
	 * @return CMS info for the image
	 * @throws HTTPException
	 * @throws IllegalArgumentException
	 */
	public DocumentDescriptor storedImageRender(Map<String, Object> params) throws HTTPException, IllegalArgumentException;
}
