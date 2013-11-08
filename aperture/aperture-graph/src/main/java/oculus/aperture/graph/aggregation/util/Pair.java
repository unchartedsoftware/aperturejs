/**
 * Copyright (c) 2013 Oculus Info Inc. All rights reserved.
 *
 * This software is the confidential and proprietary information of
 * Oculus Info Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Oculus Info Inc.
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
