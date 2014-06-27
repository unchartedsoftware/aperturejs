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
package oculus.aperture.icons;

import java.awt.Image;
import java.io.InputStream;
import java.util.Map;

import oculus.aperture.icons.batik.IconDataEncoder;
import oculus.aperture.icons.batik.ImageRasterizer;
import oculus.aperture.spi.palette.IconService;
import oculus.aperture.spi.palette.ImageProcessingException;

import com.google.inject.Singleton;

/**
 * A small icon ontology focused on human social cultural behavior analysis,
 * and artifacts (sources and products) of that analysis.
 * 
 * @author djonker
 */
@Singleton
public class SocioCulturalIconService implements IconService {

	private final SocioCulturalIconIndex index;
	
	public SocioCulturalIconService() {
		index = new SocioCulturalIconIndex();
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.IconService#getIcon(java.lang.String, java.util.Map, int, int, oculus.aperture.spi.ImageService.Format)
	 */
	@Override
	public ImageData getIcon(String type,
			Map<String, String> attributes, int width, int height,
			ImageType format) throws ImageProcessingException {

		// this must at least be present.
		if (type == null) {
			throw new IllegalArgumentException("getIcon request failed due to null type");
		}
		
		// this we can default
		if (format == null) {
			format = ImageType.PNG;
		}
		
		// get the source of the icon, to start.
		final InputStream svg = index.getStream(type, attributes);

		if (svg != null) {
			
			// note this will take care of closing the stream.
			return IconDataEncoder.encode(svg, format, width, height);
		}
		
		return null;
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.palette.IconService#getIconImage(java.lang.String, java.util.Map, int, int)
	 */
	@Override
	public Image getIconImage(String type, Map<String, String> attributes,
			int width, int height) throws ImageProcessingException {
		
		// this must at least be present.
		if (type == null) {
			throw new IllegalArgumentException("getIcon request failed due to null type");
		}
		
		// get the source of the icon, to start.
		final InputStream svg = index.getStream(type, attributes);

		if (svg != null) {
			
			// note this will take care of closing the stream.
			return ImageRasterizer.drawImage(svg, width, height);
		}
		
		return null;
	}


}
