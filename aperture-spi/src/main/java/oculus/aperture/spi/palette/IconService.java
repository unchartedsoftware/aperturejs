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
package oculus.aperture.spi.palette;

import java.awt.Image;
import java.util.Map;

/**
 * Represents a service endpoint for a single ontology of icons. An icon service
 * may map directly into a set of icons or it may index another icon service.
 * 
 * @author djonker
 */
public interface IconService extends ImageService {

	/**
	 * Returns an icon to represent the specified ontological type having
	 * the specified ontological properties.
	 * 
	 * @param type
	 * 		The id of the ontological type (typically a noun) for the ontology served
	 * 		by this service.
	 * 
	 * @param attributes
	 * 		Optional named property values (typically adjectives) that further characterize 
	 * 		the element.
	 * 
	 * @param width
	 * 		The width of the icon desired.
	 * 
	 * @param height
	 * 		The height of the icon desired.
	 * 
	 * @param format
	 * 		The format of the image desired.
	 * 
	 * @return
	 * 		The image data, including mime type.
	 * 
	 * @throws IllegalArgumentException
	 */
	public ImageData getIcon( String type, Map<String,String> attributes,
			int width, int height, ImageType format ) throws ImageProcessingException;
	
	/**
	 * Returns an icon to represent the specified ontological type having
	 * the specified ontological properties.
	 * 
	 * @param type
	 * 		The id of the ontological type (typically a noun) for the ontology served
	 * 		by this service.
	 * 
	 * @param attributes
	 * 		Optional named property values (typically adjectives) that further characterize 
	 * 		the element.
	 * 
	 * @param width
	 * 		The width of the icon desired.
	 * 
	 * @param height
	 * 		The height of the icon desired.
	 * 
	 * @return
	 * 		The image.
	 * 
	 * @throws IllegalArgumentException
	 */
	public Image getIconImage( String type, Map<String,String> attributes,
			int width, int height ) throws ImageProcessingException;

}
