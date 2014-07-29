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

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;
import java.awt.font.FontRenderContext;
import java.awt.font.TextLayout;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.RenderedImage;
import java.io.IOException;

import oculus.aperture.spi.palette.ImageService.ImageType;

import com.google.inject.Inject;
import com.google.inject.Singleton;

/**
 * @author djonker
 *
 */
@Singleton
public class DefaultCodeIconFactory implements CodeIconFactory {

	private FontProvider fonts;
	
	@Inject
	public DefaultCodeIconFactory(FontProvider fonts) {
		this.fonts = fonts;
	}
	
	/* (non-Javadoc)
	 * @see coded.CodeIconFactory#make(java.awt.Image, int, int, int, java.lang.String, oculus.aperture.spi.palette.ImageService.Format)
	 */
	@Override
	public RenderedImage make(Image img, final int w, final int h, int codeHeight, String code, ImageType format) throws IOException {
		
		final BufferedImage icon = new BufferedImage(w, h + codeHeight, BufferedImage.TYPE_INT_ARGB);
		
		final Graphics2D g2 = (Graphics2D) icon.getGraphics();
		
		// draw in image 
		g2.drawImage(img, 
				(w-img.getWidth(null))/2, 
				(h-img.getHeight(null))/2, null);

		// choose font.
		final FontRenderContext frc = g2.getFontRenderContext();
		final Font font = fonts.getFont(Font.BOLD, codeHeight);
		
		g2.setFont(font);
		g2.setColor(Color.BLACK);
		g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		
		// calculate end size.
		final TextLayout layout = new TextLayout(code, font, frc);
		final Rectangle2D b = layout.getBounds();

		// draw it.
		final int x = (int)Math.round(0.5*(w - b.getWidth()));
		final int y = h+ codeHeight+ (int)Math.round(0.5*(codeHeight - layout.getAscent() - layout.getDescent()));
		
		// draw in code symbol
		layout.draw(g2, x, y);
		
		
		// encode and return it.
		return icon;

	}

}
