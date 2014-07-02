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
package oculus.aperture.graph.aggregation.impl;

import java.util.Map;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;


public class BasicSingletonResult {

	private final Map<String, Node> nodes;
	private final Map<String, Link> links;
	private final Map<String, Node> aggregatedSingletonNodes;
	private final Map<String, Link> aggregatedSingletonLinks;
	
	public BasicSingletonResult(
		Map<String, Node> nodes,
		Map<String, Link> links,
		Map<String, Node> aggregatedSingletonNodes,
		Map<String, Link> aggregatedSingletonLinks
	) {
		this.nodes = nodes;
		this.links = links;
		this.aggregatedSingletonNodes = aggregatedSingletonNodes;
		this.aggregatedSingletonLinks = aggregatedSingletonLinks;
	}

	public Map<String, Node> getNodes() {
		return nodes;
	}

	public Map<String, Link> getLinks() {
		return links;
	}

	public Map<String, Node> getAggregatedSingletonNodes() {
		return aggregatedSingletonNodes;
	}
	
	public Map<String, Link> getAggregatedSingletonLinks() {
		return aggregatedSingletonLinks;
	}
}
