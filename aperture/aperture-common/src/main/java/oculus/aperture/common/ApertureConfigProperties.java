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

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package oculus.aperture.common;

import com.google.inject.Inject;
import com.google.inject.name.Named;

import oculus.aperture.spi.common.Properties;

/**
 * Wraps injected aperture config properties to make them optional.
 * 
 * @author djonker
 *
 */
public class ApertureConfigProperties implements Properties {

	// default config is empty.
	private Properties config= EmptyProperties.EMPTY_PROPERTIES;
	
	@Inject(optional=true)
	public void setConfig(@Named("aperture.server.config") Properties config) {
		this.config = config;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getObject(java.lang.String)
	 */
	@Override
	public Object getObject(String key) {
		return config.getObject(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getObjects(java.lang.String)
	 */
	@Override
	public Iterable<Object> getObjects(String key) {
		return config.getObjects(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getString(java.lang.String, java.lang.String)
	 */
	@Override
	public String getString(String key, String defaultValue) {
		return config.getString(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getStrings(java.lang.String)
	 */
	@Override
	public Iterable<String> getStrings(String key) {
		return config.getStrings(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getBoolean(java.lang.String, java.lang.Boolean)
	 */
	@Override
	public Boolean getBoolean(String key, Boolean defaultValue) {
		return config.getBoolean(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getBooleans(java.lang.String)
	 */
	@Override
	public Iterable<Boolean> getBooleans(String key) {
		return config.getBooleans(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getInteger(java.lang.String, java.lang.Integer)
	 */
	@Override
	public Integer getInteger(String key, Integer defaultValue) {
		return config.getInteger(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getIntegers(java.lang.String)
	 */
	@Override
	public Iterable<Integer> getIntegers(String key) {
		return config.getIntegers(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getLong(java.lang.String, java.lang.Long)
	 */
	@Override
	public Long getLong(String key, Long defaultValue) {
		return config.getLong(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getLongs(java.lang.String)
	 */
	@Override
	public Iterable<Long> getLongs(String key) {
		return config.getLongs(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getFloat(java.lang.String, java.lang.Float)
	 */
	@Override
	public Float getFloat(String key, Float defaultValue) {
		return config.getFloat(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getFloats(java.lang.String)
	 */
	@Override
	public Iterable<Float> getFloats(String key) {
		return config.getFloats(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getDouble(java.lang.String, java.lang.Double)
	 */
	@Override
	public Double getDouble(String key, Double defaultValue) {
		return config.getDouble(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getDoubles(java.lang.String)
	 */
	@Override
	public Iterable<Double> getDoubles(String key) {
		return config.getDoubles(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getPropertiesSet(java.lang.String, oculus.aperture.spi.common.Properties)
	 */
	@Override
	public Properties getPropertiesSet(String key, Properties defaultValue) {
		return config.getPropertiesSet(key, defaultValue);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getPropertiesSets(java.lang.String)
	 */
	@Override
	public Iterable<Properties> getPropertiesSets(String key) {
		return config.getPropertiesSets(key);
	}

}
