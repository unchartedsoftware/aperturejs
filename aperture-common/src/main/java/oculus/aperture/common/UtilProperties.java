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


/**
 * @author djonker
 *
 */
public class UtilProperties extends EmptyProperties {

	private java.util.Properties props;
	
	/**
	 * Constructs a properties implementation that wraps a java properties object.
	 */
	public UtilProperties(java.util.Properties props) {
		this.props = props;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#get(java.lang.String)
	 */
	@Override
	public Object getObject(String key) {
		return props.get(key);
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getString(java.lang.String, java.lang.String)
	 */
	@Override
	public String getString(String key, String defaultValue) {
		final String s = props.getProperty(key);
		
		return s != null? s : defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getBoolean(java.lang.String, java.lang.Boolean)
	 */
	@Override
	public Boolean getBoolean(String key, Boolean defaultValue) {
		final String s = props.getProperty(key);

		if (s != null) {
			return Boolean.valueOf(s);
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getInteger(java.lang.String, java.lang.Integer)
	 */
	@Override
	public Integer getInteger(String key, Integer defaultValue) {
		final String s = props.getProperty(key);

		if (s != null) {
			return Integer.valueOf(s);
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getLong(java.lang.String, java.lang.Long)
	 */
	@Override
	public Long getLong(String key, Long defaultValue) {
		final String s = props.getProperty(key);

		if (s != null) {
			return Long.valueOf(s);
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getFloat(java.lang.String, java.lang.Float)
	 */
	@Override
	public Float getFloat(String key, Float defaultValue) {
		final String s = props.getProperty(key);

		if (s != null) {
			return Float.valueOf(s);
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getDouble(java.lang.String, java.lang.Double)
	 */
	@Override
	public Double getDouble(String key, Double defaultValue) {
		final String s = props.getProperty(key);

		if (s != null) {
			return Double.valueOf(s);
		}
		
		return defaultValue;
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((props == null) ? 0 : props.hashCode());
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
		UtilProperties other = (UtilProperties) obj;
		if (props == null) {
			if (other.props != null)
				return false;
		} else if (!props.equals(other.props))
			return false;
		return true;
	}
}
