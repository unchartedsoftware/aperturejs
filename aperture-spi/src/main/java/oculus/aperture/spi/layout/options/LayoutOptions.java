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
package oculus.aperture.spi.layout.options;

import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Properties;

/**
 * @author djonker
 *
 */
public interface LayoutOptions {

	/**
	 * The selected class of layout, to be matched against available layouts.
	 */
	public String getLayoutType();

	
	/**
	 * The extents of the layout space.
	 */
	public Extents getPageExtents();

	/**
	 * The extents of the view within which the layout will occur.
	 */
	public Extents getView();

	/**
	 * Magnification of the view, where 1.0 = 100%.
	 */
	public float getZoom();


	/**
	 * How to interpret input vertical and horizontal
	 */
	public enum ExtentsFit {
		
		/**
		 * Fit within extents without changing aspect ratio
		 */
		FIT,
		
		/**
		 * Only fit if the layout exceeds the extents (this is the default)
		 */
		LIMIT,
		
		/**
		 * Stretch or shrink to exact extents, possibly changing the aspect ratio.
		 */
		STRETCH,
		
		/**
		 * Ignore extents.
		 */
		NONE
	}
	
	/**
	 * How to interpret vertical and horizontal extents.
	 */
	public ExtentsFit getFit();

	

	/**
	 * Any non-standard layout hints specific to the type chosen.
	 */
	public Properties getHints();

}