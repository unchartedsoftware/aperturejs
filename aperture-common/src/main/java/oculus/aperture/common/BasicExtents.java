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

import oculus.aperture.spi.common.Extents;

/**
 * @author djonker
 *
 */
public class BasicExtents implements Extents {

	private int left, right, top, bottom;
	private boolean empty;
	
	/**
	 * Constructs an empty extents.
	 */
	public BasicExtents() {
		left   =  Integer.MAX_VALUE;
		right  = -Integer.MAX_VALUE; 
		top    =  Integer.MAX_VALUE; 
		bottom = -Integer.MAX_VALUE;
		
		empty = true;
	}

	/**
	 * Constructs a copy of the given extents.
	 */
	public BasicExtents(Extents src) {
		empty = src.isEmpty();
		
		if (empty) {
			left   =  Integer.MAX_VALUE;
			right  = -Integer.MAX_VALUE; 
			top    =  Integer.MAX_VALUE; 
			bottom = -Integer.MAX_VALUE;
		} else {
			left   = src.getLeft();
			right  = left + src.getWidth();
			top    = src.getTop();
			bottom = top + src.getHeight();
		}
	}
	
	/**
	 * Constructs an extents representation of specific area.
	 */
	public BasicExtents(int x, int y, int width, int height) {
		left = x;
		top = y;
		right = x + width;
		bottom = y + height;
		
		empty = false;
	}

	/**
	 * Extends to incorporate the point given, if necessary.
	 */
	public void extend(int x, int y) {
		if (this.left > x)
			this.left = x;
		if (this.right < x)
			this.right = x;
		if (this.top > y)
			this.top = y;
		if (this.bottom < y)
			this.bottom = y;
		
		empty = false;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutExtents#getLeft()
	 */
	@Override
	public int getLeft() {
		return left;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutExtents#getTop()
	 */
	@Override
	public int getTop() {
		return top;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutExtents#isEmpty()
	 */
	public boolean isEmpty() {
		return empty;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutExtents#getWidth()
	 */
	public int getWidth() {
		return empty? -1 : right - left;
	}

	/**
	 * Returns the right side of the extents
	 */
	public int getRight() {
		return right;
	}

	/**
	 * Returns the bottom of the extents
	 */
	public int getBottom() {
		return bottom;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.LayoutExtents#getHeight()
	 */
	public int getHeight() {
		return empty? -1 : bottom - top;
	}

	/**
	 * Returns true if this extents contains the specified extents.
	 * If either extents are empty this method will return false.
	 */
	public boolean contains(Extents extents) {
		return isEmpty() || extents.isEmpty()? false: 
			(extents.getLeft() >= getLeft() &&
			(extents.getLeft() + extents.getWidth()) <= getRight() &&
			 extents.getTop() >= getTop() &&
			(extents.getTop() + extents.getHeight()) <= getBottom());
	}

	/**
	 * Creates an inset extents
	 */
	public BasicExtents inset(int margin) {
		return new BasicExtents(
				this.left + margin,
				this.top + margin,
				this.getWidth() - 2*margin,
				this.getHeight() - 2*margin
			);
	}

	/**
	 * Creates an inset extents
	 */
	public BasicExtents inset(int top, int right, int bottom, int left) {
		return new BasicExtents(
				this.left + left,
				this.top + top,
				this.getWidth() - left - right,
				this.getHeight() - top - bottom
			);
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + bottom;
		result = prime * result + (empty ? 1231 : 1237);
		result = prime * result + left;
		result = prime * result + right;
		result = prime * result + top;
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
		if (getClass() != obj.getClass())
			return false;
		BasicExtents other = (BasicExtents) obj;
		if (bottom != other.bottom)
			return false;
		if (empty != other.empty)
			return false;
		if (left != other.left)
			return false;
		if (right != other.right)
			return false;
		if (top != other.top)
			return false;
		return true;
	}
	
	
}
