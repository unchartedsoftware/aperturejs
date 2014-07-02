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

import oculus.aperture.spi.common.Alignments;


/**
 * @author djonker
 *
 */
public interface TagLayoutOptions extends GraphLayoutOptions, Alignments {
	
	/**
	 * Tag layout type
	 */
	final static String TAG = "tag";
	
	
	
	/**
	 * Globally defined width reserved for each tag, as an integer.
	 */
	public int getTagWidth();
	
	/**
	 * Globally defined height reserved for each tag, as an integer.
	 */
	public int getTagHeight();

	
	/**
	 * @see oculus.aperture.spi.common.Alignments
	 */
	public int getAlignmentOptions();
	
	/**
	 * Returns the preferred alignment of new tags or zero if undefined.
	 * If undefined the preferred alignment of each tag will be 
	 * opposite the center of the screen.
	 * 
	 * @see oculus.aperture.spi.common.Alignments
	 */
	public int getPreferredAlignment();
	
	/**
	 * If true, prefers the current alignment over all else, if set.
	 */
	public boolean preferCurrentAlignment();
}
