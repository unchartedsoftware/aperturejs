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
package oculus.aperture.spi.common.data;

import java.util.List;

public interface QuantizedRange {

	/**
	 * Represents a single quantized band, which at minimum can
	 * be represented by it's minimum value.
	 */
	public interface Band {
		
		/**
		 * Any value greater or equal to this value will pass the
		 * first band membership qualification.
		 */
		public double getMin();
		
		/**
		 * Any value less than this value will pass the
		 * second band membership qualification.
		 */
		public double getLimit();
	}
	
	/**
	 * Expands to fit value, if necessary.
	 */
	public void expand(double value);
	
	/**
	 * @return the empty
	 */
	public boolean isEmpty();

	/**
	 * @return the lower bound of the range
	 */
	public double getStart();

	/**
	 * @return the upper bound of the range
	 */
	public double getEnd();

	/**
	 * Returns a rounded set of evenly quantized bands.
	 */
	public List<? extends Band> getBands();
	
	/**
	 * Returns the index of the band that the value falls into.
	 */
	public int bandIndex(double value);

}