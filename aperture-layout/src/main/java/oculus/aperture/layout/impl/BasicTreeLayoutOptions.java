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

import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.TreeLayoutOptions;

/**
 * @author djonker
 *
 */
public class BasicTreeLayoutOptions extends BasicGraphLayoutOptions implements
		TreeLayoutOptions {

	private final int treeLevelDistance;
	private final String rootId;
	/**
	 * @param options
	 */
	public BasicTreeLayoutOptions(String layoutType, Properties extents, Properties options) {
		super(layoutType, extents, options);
		
		// only tree relevant
		treeLevelDistance = options.getInteger("treeLevelDistance", 100);
		rootId = options.getString("rootId", null);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.GraphLayoutOptions#getTreeLevelDistance()
	 */
	@Override
	public int getTreeLevelDistance() {
		return treeLevelDistance;
	}

	@Override
	public String getRootId() {
		return rootId;
	}
	
}
