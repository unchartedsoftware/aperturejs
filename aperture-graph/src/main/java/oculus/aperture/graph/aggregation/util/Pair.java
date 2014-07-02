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
package oculus.aperture.graph.aggregation.util;


public class Pair<T, U> {

	/**
	 * The object in the first position
	 */
	private T first;
	
	
	
	
	/**
	 * The object in the second position
	 */
	private U second;
	
	
	
	
	/**
	 * 
	 */
	public Pair(T first, U second) {
		setFirst(first);
		setSecond(second);
	}
	
	
	
	
	/**
	 * Set both members of the pair together
	 * 
	 * @param first can be null
	 * @param second can be null
	 */
	public void set(T first, U second) {
		setFirst(first);
		setSecond(second);
	}

	


	/**
	 * @param first the first to set
	 */
	public void setFirst(T first) {

		this.first = first;
	}




	/**
	 * @param second the second to set
	 */
	public void setSecond(U second) {

		this.second = second;
	}




	/**
	 * @return the first
	 */
	public T getFirst() {

		return first;
	}




	/**
	 * @return the second
	 */
	public U getSecond() {

		return second;
	}

	
	
	
	/**
	 * @return a meaningful hash code if the two objects
	 * return meaningful hash codes.  The hash code is the same
	 * regardless of which position each of the paired objects
	 * is stored in.  Very important for reciprocal association!
	 */
	@Override
	public int hashCode() {
		
		return(first.hashCode() ^ second.hashCode());
	}
}
