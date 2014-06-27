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
public interface Link {

	/**
	 * @return
	 * 		The unique id of the link.
	 */
	public String getId();
	
	
	/**
	 * The id of the source node of the link.
	 * 
	 * @return
	 * 		The id of the source node.
	 */
	public String getSourceId();
	
	
	/**
	 * The id of the target node of the link.
	 * 
	 * @return
	 * 		The id of the target node.
	 */
	public String getTargetId();
	

	/**
	 * @return 
	 * 		The number of links in the aggregation
	 */
	public long getNumMembers();

	
	/**
	 * @return the relative importance of the link
	 */
	public double getWeight();
}
