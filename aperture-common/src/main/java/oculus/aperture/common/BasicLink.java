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

import oculus.aperture.spi.common.Link;

/**
 * Implements a JSON version of an abstract representation of a set of links
 * 
 * @author djonker
 */
public class BasicLink implements Link {

	
	private String id;
	private double weight;
	private long numMembers;
	private final String targetId, sourceId;
	
	/**
	 * Constructs a new link set wrapper for a json array
	 */
	public BasicLink(String id, String sourceId, String targetId) {
		this.id = id;
		this.sourceId = sourceId;
		this.targetId = targetId;
	}


	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutLink#getSourceId()
	 */
	@Override
	public String getSourceId() {
		return sourceId;
	}


	/* (non-Javadoc)
	 * @see oculus.aperture.spi.LinkSet#getTargetId(int)
	 */
	@Override
	public String getTargetId() {
		return targetId;
	}


	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutLink#getId()
	 */
	@Override
	public String getId() {
		return id;
	}


	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutLink#getWeight()
	 */
	@Override
	public double getWeight() {
		return weight;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutLink#getNumMembers()
	 */
	@Override
	public long getNumMembers() {
		return numMembers;
	}

	/**
	 * Sets the relative importance of the node.
	 */
	public void setWeight(double weight) {
		this.weight = weight;
	}

	/**
	 * Sets the count of member links
	 */
	public void setNumMembers(long number) {
		this.numMembers = number;
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
		if (!(obj instanceof Link))
			return false;
		Link other = (Link) obj;
		if (id == null) {
			if (other.getId() != null)
				return false;
		} else if (!id.equals(other.getId()))
			return false;
		return true;
	}

	
}
