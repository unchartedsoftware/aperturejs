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
 * Abstracts a set of typed name value pairs.
 * 
 * @author djonker
 */
public interface Properties {

	/**
	 * Returns the raw value of the key, or null if not found.
	 */
	public Object getObject(String key);
	
	/**
	 * Returns an untyped Iterable for iterating through the raw contents of an array. 
	 */
	public Iterable<Object> getObjects(String key);

	
	
	/**
	 * Returns the value of the key as a string, or default value if not found.
	 */
	public String getString(String key, String defaultValue);
	
	/**
	 * Returns a string Iterable for iterating through a list of values. 
	 */
	public Iterable<String> getStrings(String key);

	
	
	/**
	 * Returns the value of the key as a boolean, or default value if not found.
	 */
	public Boolean getBoolean(String key, Boolean defaultValue);
	
	/**
	 * Returns a boolean Iterable for iterating through a list of values. 
	 */
	public Iterable<Boolean> getBooleans(String key);

	
	
	/**
	 * Returns the value of the key as an integer, or default value if not found.
	 */
	public Integer getInteger(String key, Integer defaultValue);
	
	/**
	 * Returns an integer Iterable for iterating through a list of values. 
	 */
	public Iterable<Integer> getIntegers(String key);

	
	
	/**
	 * Returns the value of the key as a long, or default value if not found.
	 */
	public Long getLong(String key, Long defaultValue);

	/**
	 * Returns a long Iterable for iterating through a list of values. 
	 */
	public Iterable<Long> getLongs(String key);

	
	
	/**
	 * Returns the value of the key as an float, or default value if not found.
	 */
	public Float getFloat(String key, Float defaultValue);
	
	/**
	 * Returns a float Iterable for iterating through a list of values. 
	 */
	public Iterable<Float> getFloats(String key);

	
	
	/**
	 * Returns the value of the key as a double, or default value if not found.
	 */
	public Double getDouble(String key, Double defaultValue);

	
	/**
	 * Returns a double Iterable for iterating through a list of values. 
	 */
	public Iterable<Double> getDoubles(String key);
	

	
	/**
	 * Returns a nested set of properties for the specified key, or default value if not found.
	 */
	public Properties getPropertiesSet(String key, Properties defaultValue);

	/**
	 * Returns a Properties Iterable for iterating through a list of values. 
	 */
	public Iterable<Properties> getPropertiesSets(String key);
	
}
