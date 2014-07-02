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
package oculus.aperture.spi.graph;

import java.util.Map;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.data.QuantizedRange;




/**
 * The result of a graph aggregation operation.
 * 
 * @author djonker
 */
public interface GraphAggregationResult {
	
	/**
	 * Returns the list of nodes.
	 */
	public Map<String, ? extends Node> getNodes();

	/**
	 * Returns the list of links
	 */
	public Map<String, ? extends Link> getLinks();
	
	
	/**
	 * Returns the size of the largest aggregate node, in terms of number of members.
	 */
	public long getMaxNumMembers();
	
	/**
	 * Returns quantized ranges for each node type.
	 */
	public Map<String, QuantizedRange> getNodeWeightRanges();
	
	/**
	 * Returns quantized ranges for each link type.
	 */
	public Map<String, QuantizedRange> getLinkWeightRanges();

}
