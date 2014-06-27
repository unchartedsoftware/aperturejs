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
package oculus.aperture.icons.batik;

import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.InputStream;

import oculus.aperture.spi.palette.ImageProcessingException;

import org.apache.batik.transcoder.TranscoderException;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.image.ImageTranscoder;

/**
 * @author djonker
 */
public class ImageRasterizer {

	/**
	 * Rasterizes an svg source as an image.
	 */
	public static Image drawImage(InputStream svg, int width, int height) throws ImageProcessingException {
		BufferedImageTranscoder transcoder = new BufferedImageTranscoder(BufferedImage.TYPE_INT_ARGB);
		 
		// hints
		if (width > 0)
			transcoder.addTranscodingHint(ImageTranscoder.KEY_WIDTH, new Float(width));
		if (height > 0)
			transcoder.addTranscodingHint(ImageTranscoder.KEY_HEIGHT, new Float(height));
		
	    TranscoderInput input = new TranscoderInput(svg);
	    try {
	    	transcoder.transcode(input, null);
		} catch (TranscoderException e) {
			throw new ImageProcessingException("Exception transcoding SVG to image: "+ e.getMessage(), e);
		}
	 
	    return transcoder.getBufferedImage();			
	}
}
