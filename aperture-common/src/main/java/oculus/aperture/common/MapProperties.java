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

import java.util.Iterator;
import java.util.Map;

import oculus.aperture.spi.common.Properties;

/**
 * @author djonker
 *
 */
public class MapProperties extends EmptyProperties {

	private Map<String, Object> map;
	
	/**
	 * Constructs a properties implementation that wraps a java properties object.
	 */
	public MapProperties(Map<String, Object> map) {
		this.map = map;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#get(java.lang.String)
	 */
	@Override
	public Object getObject(String key) {
		return map.get(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getString(java.lang.String, java.lang.String)
	 */
	@Override
	public String getString(String key, String defaultValue) {
		final Object s = map.get(key);
		
		return s != null? s.toString() : defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getBoolean(java.lang.String, java.lang.Boolean)
	 */
	@Override
	public Boolean getBoolean(String key, Boolean defaultValue) {
		final Boolean s = (Boolean) map.get(key);

		if (s != null) {
			return s;
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getInteger(java.lang.String, java.lang.Integer)
	 */
	@Override
	public Integer getInteger(String key, Integer defaultValue) {
		final Number s = (Number) map.get(key);

		if (s != null) {
			return s.intValue();
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getLong(java.lang.String, java.lang.Long)
	 */
	@Override
	public Long getLong(String key, Long defaultValue) {
		final Number s = (Number) map.get(key);

		if (s != null) {
			return s.longValue();
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getFloat(java.lang.String, java.lang.Float)
	 */
	@Override
	public Float getFloat(String key, Float defaultValue) {
		final Number s = (Number) map.get(key);

		if (s != null) {
			return s.floatValue();
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getDouble(java.lang.String, java.lang.Double)
	 */
	@Override
	public Double getDouble(String key, Double defaultValue) {
		final Number s = (Number) map.get(key);

		if (s != null) {
			return s.doubleValue();
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getProperties(java.lang.String, oculus.aperture.spi.Properties)
	 */
	@Override
	public Properties getPropertiesSet(String key, Properties defaultValue) {
		@SuppressWarnings("unchecked")
		final Map<String, Object> s = (Map<String, Object>) map.get(key);

		if (s != null) {
			return new MapProperties(s);
		}

		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getObjects(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Object> getObjects(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Object> s = (Iterable<Object>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getStrings(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<String> getStrings(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<String> s = (Iterable<String>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getBooleans(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Boolean> getBooleans(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Boolean> s = (Iterable<Boolean>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getIntegers(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Integer> getIntegers(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Integer> s = (Iterable<Integer>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getLongs(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Long> getLongs(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Long> s = (Iterable<Long>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getFloats(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Float> getFloats(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Float> s = (Iterable<Float>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getDoubles(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Double> getDoubles(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Double> s = (Iterable<Double>) map.get(key);

		if (s != null) {
			return s;
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getPropertiesSets(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Properties> getPropertiesSets(String key) {
		@SuppressWarnings("unchecked")
		final Iterable<Map<String, Object>> s = (Iterable<Map<String, Object>>) map.get(key);

		if (s != null) {
			return new Iterable<Properties>() {
				@Override
				public Iterator<Properties> iterator() {
					return new Iterator<Properties>() {
						final Iterator<Map<String, Object>> i = s.iterator();
						
						@Override
						public boolean hasNext() {
							return i.hasNext();
						}

						@Override
						public Properties next() {
							return new MapProperties(i.next());
						}

						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
		}

		return EmptyIterable.instance();
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((map == null) ? 0 : map.hashCode());
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
		MapProperties other = (MapProperties) obj;
		if (map == null) {
			if (other.map != null)
				return false;
		} else if (!map.equals(other.map))
			return false;
		return true;
	}
}
