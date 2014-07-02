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
package oculus.aperture.spi.common;

/**
 * @author djonker
 *
 */
public interface Alignments {

	/**
	 * A horizontal anchor
	 * @author djonker
	 */
	public enum AnchorX {
		left,
		middle,
		right;
	}
	
	/**
	 * A vertical anchor
	 * @author djonker
	 */
	public enum AnchorY {
		top,
		middle,
		bottom;
		
		/**
		 * Returns the alignment flag for the combination of this anchor with the specified x anchor.
		 */
		public int and(AnchorX x) {
			switch (this) {
			case top:
				switch (x) {
				case left:
					return ALIGN_TOP_LEFT;
				case right:
					return ALIGN_TOP_RIGHT;
				default:
					return ALIGN_TOP_CENTER;
				}
				
			case middle:
				switch (x) {
				case left:
					return ALIGN_MIDDLE_LEFT;
				default:
					return ALIGN_MIDDLE_RIGHT;
				}
				
			default:
				switch (x) {
				case left:
					return ALIGN_BOTTOM_LEFT;
				case right:
					return ALIGN_BOTTOM_RIGHT;
				default:
					return ALIGN_BOTTOM_CENTER;
				}
			}
		}
	}
	
	/**
	 * Align the bottom right corner of the primitive to the node position.
	 */
	public final static int ALIGN_TOP_RIGHT = 1;
	
	/**
	 * Align the bottom center of the primitive to the node position.
	 */
	public final static int ALIGN_TOP_CENTER = 2;
	
	/**
	 * Align the bottom left corner of the primitive to the node position.
	 */
	public final static int ALIGN_TOP_LEFT = 4;
	
	/**
	 * Align the middle right of the primitive to the node position.
	 */
	public final static int ALIGN_MIDDLE_RIGHT = 8;
	
	/**
	 * Align the middle left of the primitive to the node position.
	 */
	public final static int ALIGN_MIDDLE_LEFT = 16;
	
	/**
	 * Align the top right corner of the primitive to the node position.
	 */
	public final static int ALIGN_BOTTOM_RIGHT = 32;
	
	/**
	 * Align the top center of the primitive to the node position.
	 */
	public final static int ALIGN_BOTTOM_CENTER = 64;
	
	/**
	 * Align the top left corner of the primitive to the node position.
	 */
	public final static int ALIGN_BOTTOM_LEFT = 128;
	
	/**
	 * Align the bottom of the primitive to the node position by any horizontal alignment.
	 */
	public final static int ALIGN_TOP_ANY = ALIGN_TOP_RIGHT
			| ALIGN_TOP_CENTER | ALIGN_TOP_LEFT;
	
	/**
	 * Align the top of the primitive to the node position by any horizontal alignment.
	 */
	public final static int ALIGN_BOTTOM_ANY = ALIGN_BOTTOM_RIGHT | ALIGN_BOTTOM_CENTER
			| ALIGN_BOTTOM_LEFT;
	
	/**
	 * Align the right side of the primitive to the node position by any vertical alignment.
	 */
	public final static int ALIGN_RIGHT_ANY = ALIGN_TOP_RIGHT
			| ALIGN_MIDDLE_RIGHT | ALIGN_BOTTOM_RIGHT;
	
	/**
	 * Align the left side of the primitive to the node position by any vertical alignment.
	 */
	public final static int ALIGN_LEFT_ANY = ALIGN_TOP_LEFT
			| ALIGN_MIDDLE_LEFT | ALIGN_BOTTOM_LEFT;
	
	/**
	 * Align the primitive to the node position by any alignment. This is the default.
	 */
	public final static int ALIGN_ANY = ALIGN_TOP_ANY | ALIGN_BOTTOM_ANY
			| ALIGN_MIDDLE_RIGHT | ALIGN_MIDDLE_LEFT;


}
