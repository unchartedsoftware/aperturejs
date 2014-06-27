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
package oculus.aperture.common;

import oculus.aperture.spi.common.NodeTag;
import oculus.aperture.spi.common.Alignments.AnchorX;
import oculus.aperture.spi.common.Alignments.AnchorY;

/**
 * 
 * @author djonker
 */
public class BasicNodeTag implements NodeTag {

	private final boolean visible;
	
	private final AnchorX anchorX;
	private final AnchorY anchorY;
	
	/**
	 * Creates a simple layout tag
	 */
	public BasicNodeTag(boolean visible, AnchorX anchorX, AnchorY anchorY) {
		this.visible = visible;
		this.anchorX = anchorX;
		this.anchorY = anchorY;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutTag#getAnchorX()
	 */
	@Override
	public AnchorX getAnchorX() {
		return anchorX;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutTag#getAnchorY()
	 */
	@Override
	public AnchorY getAnchorY() {
		return anchorY;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutTag#isVisible()
	 */
	@Override
	public boolean isVisible() {
		return visible;
	}

}
