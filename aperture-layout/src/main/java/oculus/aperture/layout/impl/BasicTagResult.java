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
package oculus.aperture.layout.impl;

import oculus.aperture.spi.common.NodeTag;
import oculus.aperture.spi.common.Alignments.AnchorX;
import oculus.aperture.spi.common.Alignments.AnchorY;
import oculus.aperture.spi.layout.options.TagLayoutOptions;


/**
 * A tag layout result.
 * 
 * @author djonker
 */
public class BasicTagResult implements NodeTag {

	private final boolean visible;
	
	private final AnchorX anchorX;
	private final AnchorY anchorY;
	
	private final int offsetY;
	private final int offsetX;
	
	/**
	 * Constructs a tag layout result representation.
	 * 
	 * @param result
	 * 		The result of the layout as one of the 
	 * 		alignment flags specified in Alignments.
	 * 
	 * @param visible
	 * 		Whether or not the tag is visible or hidden.
	 * 
	 * @param nodeWidth
	 * 		The width of the node being tagged.
	 * 
	 * @param nodeHeight
	 * 		The width of the node being tagged.
	 */
	public BasicTagResult(int result, boolean visible, int nodeWidth, int nodeHeight) {
		this.visible = visible;

		// vertical alignment
		switch (result) {
		case TagLayoutOptions.ALIGN_BOTTOM_LEFT:
		case TagLayoutOptions.ALIGN_BOTTOM_CENTER:
		case TagLayoutOptions.ALIGN_BOTTOM_RIGHT:
			offsetY = (int)Math.round(-.5f* nodeHeight);
			anchorY = AnchorY.bottom;
			break;
			
		case TagLayoutOptions.ALIGN_TOP_LEFT:
		case TagLayoutOptions.ALIGN_TOP_CENTER:
		case TagLayoutOptions.ALIGN_TOP_RIGHT:
			offsetY = (int)Math.round(.5f* nodeHeight);
			anchorY = AnchorY.top;
			break;
			
		default:
			offsetY = 0;
			anchorY = AnchorY.middle;
		}

		// horizontal alignment
		switch (result) {
		case TagLayoutOptions.ALIGN_BOTTOM_RIGHT:
		case TagLayoutOptions.ALIGN_MIDDLE_RIGHT:
		case TagLayoutOptions.ALIGN_TOP_RIGHT:
			anchorX = AnchorX.right;
			offsetX = (int)Math.round(-.5f* nodeWidth);
			break;
			
		case TagLayoutOptions.ALIGN_BOTTOM_LEFT:
		case TagLayoutOptions.ALIGN_MIDDLE_LEFT:
		case TagLayoutOptions.ALIGN_TOP_LEFT:
			anchorX = AnchorX.left;
			offsetX = (int)Math.round(.5f* nodeWidth);
			break;
		
		default:
			anchorX = AnchorX.middle;
			offsetX = 0;
		}
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutTag#isVisible()
	 */
	public boolean isVisible() {
		return visible;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutTag#getAnchorX()
	 */
	public AnchorX getAnchorX() {
		return anchorX;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutTag#getAnchorY()
	 */
	public AnchorY getAnchorY() {
		return anchorY;
	}

	/**
	 * @return the offsetY
	 */
	public int getOffsetY() {
		return offsetY;
	}

	/**
	 * @return the offsetX
	 */
	public int getOffsetX() {
		return offsetX;
	}

	
}
