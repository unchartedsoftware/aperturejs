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

import oculus.aperture.common.BasicExtents;
import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.GraphLayoutOptions;

/**
 * @author djonker
 */
public class BasicGraphLayoutOptions implements GraphLayoutOptions {

	private final BasicExtents view;
	private final BasicExtents page;
	private final float zoom;

	private ExtentsFit extentsFit = ExtentsFit.NONE;
	
	private final Properties hints;
	private final String layoutType;
	private final int linkLength;
	private final int nodeDistance;

	/**
	 * 
	 */
	public BasicGraphLayoutOptions(String layoutType, Properties extents, Properties options) {
		this.layoutType = layoutType;
		
		// extents, or default
		if (extents != null) {
			view = new BasicExtents(
					extents.getInteger("x", 0),
					extents.getInteger("y", 0),
					extents.getInteger("width", 800),
					extents.getInteger("height", 600)
				);

			Integer margin = extents.getInteger("margin", null);

			// was an integer supplied?
			if (margin != null) {
				page = view.inset(extents.getInteger("margin", 10));
				
			// else try it as an object, or default.
			} else {
				Properties omargin = extents.getPropertiesSet("margin", null);
				
				if (omargin != null) {
					page = view.inset(
						omargin.getInteger("top", 0),
						omargin.getInteger("right", 0),
						omargin.getInteger("bottom", 0),
						omargin.getInteger("left", 0)
					);
				} else {
					page = view.inset(10);
				}
			}
			
			// fit instructions
			try {
				extentsFit = ExtentsFit.valueOf(options.getString("fit", "fit").trim().toUpperCase());
			} catch (Exception e) {
			}

		} else {
			view = null;
			page = null;
		}

		zoom = extents.getFloat("zoom", 1f);

		// any optional hints.
		hints = options.getPropertiesSet("hints", null);
		
		// relevant in a mix of cases.
		linkLength = options.getInteger("linkLength", 100);
		nodeDistance = options.getInteger("nodeDistance", 100);

	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getExtentsFit()
	 */
	@Override
	public ExtentsFit getFit() {
		return extentsFit;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getHints()
	 */
	@Override
	public Properties getHints() {
		return hints;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutOptions#getExtents()
	 */
	@Override
	public Extents getPageExtents() {
		return page;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getLayoutExtents()
	 */
	@Override
	public Extents getView() {
		return view;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getZoom()
	 */
	@Override
	public float getZoom() {
		return zoom;
	}


	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getLayoutType()
	 */
	@Override
	public String getLayoutType() {
		return layoutType;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getLinkLength()
	 */
	@Override
	public int getLinkLength() {
		return linkLength;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getNodeDistance()
	 */
	@Override
	public int getNodeDistance() {
		return nodeDistance;
	}

}
