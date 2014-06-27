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
package oculus.aperture.common;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;

import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.NodeTag;

/**
 * 
 * @author djonker
 */
public class BasicNode implements Node {

	private String id;
	private String type;
	private String label;
	private int w, h;
	private double y;
	private double x;
	private double weight;
	private Map<String, Object> ex;
	private NodeTag tag;
	private long numMembers = 1;
	private Collection<Link> incidentLinks;
	
	/**
	 * 
	 */
	public BasicNode(String id, String type) {
		this.id = id;
		this.type = type;
		this.w = this.h = 6;
	}
	public BasicNode(String id, int x, int y, int w, int h) {
		this.id = id;
		this.x= x;
		this.y= y;
		this.w= w;
		this.h= h;
	}
	
	public BasicNode(String id, String type, int x, int y, int w, int h) {
		this.id = id;
		this.type = type;
		this.x= x;
		this.y= y;
		this.w= w;
		this.h= h;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.Node#getId()
	 */
	@Override
	public String getId() {
		return id;
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#getType()
	 */
	@Override
	public String getType() {
		return type;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.Node#getWidth()
	 */
	@Override
	public int getWidth() {
		return w;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.Node#getHeight()
	 */
	@Override
	public int getHeight() {
		return h;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.Node#getX()
	 */
	@Override
	public double getX() {
		return x;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.Node#getY()
	 */
	@Override
	public double getY() {
		return y;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#getWeight()
	 */
	@Override
	public double getWeight() {
		return weight;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#getLabel()
	 */
	@Override
	public String getLabel() {
		return label;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#getNumMembers()
	 */
	@Override
	public long getNumMembers() {
		return numMembers;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#getExtendedAttributes()
	 */
	@Override
	public Map<String, Object> getAttrs() {
		if (ex == null) {
			ex = new HashMap<String, Object>(2);
		}
		return ex;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#setX(int)
	 */
	@Override
	public void setX(double x) {
		this.x = x;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#setY(int)
	 */
	@Override
	public void setY(double y) {
		this.y = y;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#getTag()
	 */
	@Override
	public NodeTag getTag() {
		return tag;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#setTag(oculus.aperture.spi.layout.LayoutTag)
	 */
	@Override
	public void setTag(NodeTag tag) {
		this.tag = tag;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#setHeight(int)
	 */
	@Override
	public void setHeight(int h) {
		this.h = h;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutNode#setWidth(int)
	 */
	@Override
	public void setWidth(int w) {
		this.w = w;
	}
	/**
	 * Sets the relative importance of the node.
	 */
	public void setWeight(double weight) {
		this.weight = weight;
	}

	/**
	 * Sets the label of the node.
	 */
	public void setLabel(String label) {
		this.label = label;
	}
	
	/**
	 * Sets the count of members
	 */
	public void setNumMembers(long number) {
		numMembers = number;
	}
	
	/**
	 * Sets the count of members
	 */
	public void setAttribute(String key, Object value) {
		if (ex == null) {
			ex = new HashMap<String, Object>();
		}
		
		ex.put(key, value);
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((id == null) ? 0 : id.hashCode());
		return result;
	}
	
	/* (non-Javadoc)
	 * @see java.lang.Object#equals(java.lang.Object)
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (!(obj instanceof Node))
			return false;
		Node other = (Node) obj;
		if (id == null) {
			if (other.getId() != null)
				return false;
		} else if (!id.equals(other.getId()))
			return false;
		return true;
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Node#setIncidentLinks(java.util.Collection)
	 */
	@Override
	public void setIncidentLinks(Collection<Link> links) {
		incidentLinks = new HashSet<Link>(links);
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Node#addIncidentLink(oculus.aperture.spi.common.Link)
	 */
	@Override
	public void addIncidentLink(Link link) {
		if (incidentLinks == null) {
			incidentLinks = new HashSet<Link>();
		}
		incidentLinks.add(link);
	}
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Node#getIncidentLinks()
	 */
	@Override
	public Collection<Link> getIncidentLinks() {
		return incidentLinks;
	}
	
}
