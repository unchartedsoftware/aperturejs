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

import oculus.aperture.spi.common.Properties;

/**
 * @author djonker
 *
 */
public class EmptyProperties implements Properties {

	/**
	 * Singleton implementation safe to use across threads.
	 */
	public static final EmptyProperties EMPTY_PROPERTIES = new EmptyProperties();
	
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#get(java.lang.String)
	 */
	@Override
	public Object getObject(String key) {
		return null;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getString(java.lang.String, java.lang.String)
	 */
	@Override
	public String getString(String key, String defaultValue) {
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getBoolean(java.lang.String, java.lang.Boolean)
	 */
	@Override
	public Boolean getBoolean(String key, Boolean defaultValue) {
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getInteger(java.lang.String, java.lang.Integer)
	 */
	@Override
	public Integer getInteger(String key, Integer defaultValue) {
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getLong(java.lang.String, java.lang.Long)
	 */
	@Override
	public Long getLong(String key, Long defaultValue) {
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getFloat(java.lang.String, java.lang.Float)
	 */
	@Override
	public Float getFloat(String key, Float defaultValue) {
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getDouble(java.lang.String, java.lang.Double)
	 */
	@Override
	public Double getDouble(String key, Double defaultValue) {
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getProperties(java.lang.String, oculus.aperture.spi.Properties)
	 */
	@Override
	public Properties getPropertiesSet(String key, Properties defaultValue) {
		return defaultValue;
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getSet(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Object> getObjects(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getStrings(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<String> getStrings(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getBooleans(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Boolean> getBooleans(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getIntegers(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Integer> getIntegers(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getLongs(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Long> getLongs(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getFloats(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Float> getFloats(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getDoubles(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Double> getDoubles(String key) {
		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getPropertiesSets(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Properties> getPropertiesSets(String key) {
		return EmptyIterable.instance();
	}
}
