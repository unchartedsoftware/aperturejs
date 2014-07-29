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
package oculus.aperture.icons.coded;

import java.awt.Font;
import java.io.IOException;
import java.io.InputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Singleton;

/**
 * @author djonker
 *
 */
@Singleton
public class DefaultFontProvider implements FontProvider {

	private final Font boldFont;
	private final Font normalFont;
	
	final Logger logger = LoggerFactory.getLogger(getClass());

	
	/**
	 * Constructs a default font provider.
	 */
	public DefaultFontProvider() {
		boldFont = loadFont("/oculus/aperture/common/fonts/DroidSans-Bold.ttf",
				new Font("SansSerif", Font.BOLD, 12));
		normalFont = loadFont("/oculus/aperture/common/fonts/DroidSans.ttf",
				new Font("SansSerif", Font.PLAIN, 12));
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.icons.FontProvider#getFont(int, int)
	 */
	@Override
	public Font getFont(int fontStyle, float size) {
		if (fontStyle == Font.BOLD) {
			return boldFont.deriveFont(size);
		} else {
			return normalFont.deriveFont(size);
		}
	}

	/**
	 * Loads a font from a stream
	 */
	private Font loadFont(String path, Font fallbackFont) {
		final InputStream is = getClass().getResourceAsStream(path);
		Font font = null;
		
		if (is != null) {
			try {
				font = Font.createFont(Font.TRUETYPE_FONT, is);
				
			} catch (Exception e) {
				logger.warn("Failed to load default font "+ path, e);
			}
			
			try {
				is.close();
			} catch (IOException e) {
			}
		}
		
		return font != null? font : fallbackFont;
	}
	
}
