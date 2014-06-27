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

import java.util.Collection;
import java.util.Map;


/**
 * Abstracts a node definition in the layout scheme.
 * 
 * @author djonker
 */
public interface Node {

	/**
	 * @return
	 * 		The unique id of the node.
	 */
	public String getId();
	
	
	/**
	 * @return 
	 * 		The type of the node
	 */
	public String getType();

	
	/**
	 * @return 
	 * 		The number of nodes in the aggregation
	 */
	public long getNumMembers();
	
	/**
	 * Sets the incident links of this node to the supplied collection
	 */
	public void setIncidentLinks(Collection<Link> links);
	
	/**
	 * Adds a link to the list of incident links
	 */
	public void addIncidentLink(Link link);
	
	/**
	 * @return 
	 * 		The incident links of this node
	 */
	public Collection<Link> getIncidentLinks();
	
	/**
	 * @return
	 * 		The width of the node.
	 */
	public int getWidth();
	
	
	/**
	 * @return
	 * 		The height of the node.
	 */
	public int getHeight();
	
	/**
	 * @return
	 * 		The x position of the node.
	 */
	public double getX();
	
	/**
	 * @return
	 * 		The y position of the node.
	 */
	public double getY();


	/**
	 * @return the relative importance of the node
	 */
	public double getWeight();

	
	/**
	 * @return
	 *		The label of the node, if present.
	 */
	public String getLabel();
		
	
	/**
	 * @return any tag associated with the node
	 */
	public NodeTag getTag();
	
	
	/**
	 * @return a map of implementation specific properties.
	 */
	public Map<String, Object> getAttrs();


	/**
	 * Sets the x position
	 */
	public void setX(double x);


	/**
	 * Sets the y position
	 */
	public void setY(double y);

	/**
	 * Sets the width of the node.
	 */
	public void setWidth(int w);
	
	/**
	 * Sets the height of the node.
	 */
	public void setHeight(int h);
	
	/**
	 * Sets any tag associated with the node
	 */
	public void setTag(NodeTag tag);
}
