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

import java.awt.image.RenderedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import oculus.aperture.spi.palette.ImageService.ImageType;
import oculus.aperture.spi.palette.ImageService.ImageData;

/**
 * A package-protected default implementation of the {@link ImageData} interface.
 *
 */
public class IconData implements ImageData {

	private final byte[] data;
	private final String mediaType;

	public IconData(byte[] data, String mediaType) {
		this.data = data;
		this.mediaType = mediaType;
	}
	
	public IconData(RenderedImage img, ImageType format) throws IOException {
		ByteArrayOutputStream bos = new ByteArrayOutputStream();

		if (format == null || format == ImageType.SVG) {
			format = ImageType.PNG;
		}
		
		// write in the image.
		ImageIO.write(img, format.getExtension().substring(1), bos);

		this.data = bos.toByteArray();
		this.mediaType = format.getMimeType();
	}

	@Override
	public byte[] getData() {
		return data;
	}

	@Override
	public String getMediaType() {
		return mediaType;
	}


}
