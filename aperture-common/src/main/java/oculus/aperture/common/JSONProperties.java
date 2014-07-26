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

import oculus.aperture.spi.common.Properties;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Wraps a JSONObject to expose a Properties interface.
 * 
 * @author djonker
 */
public class JSONProperties extends EmptyProperties {

	private final JSONObject obj;
	
	/**
	 * Wraps a JSON object as the source of properties.
	 * @throws JSONException 
	 */
	public JSONProperties(String json) throws JSONException {
		this.obj = new JSONObject(json);
	}

	/**
	 * Wraps a JSON object as the source of properties.
	 */
	public JSONProperties(JSONObject obj) {
		this.obj = obj;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#get(java.lang.String)
	 */
	@Override
	public Object getObject(String key) {
		try {
			return obj.get(key);
		} catch (JSONException e) {
			return null;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getBoolean(java.lang.String, java.lang.Boolean)
	 */
	@Override
	public Boolean getBoolean(String key, Boolean defaultValue) {
		try {
			return obj.getBoolean(key);
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getDouble(java.lang.String, java.lang.Double)
	 */
	@Override
	public Double getDouble(String key, Double defaultValue) {
		try {
			return obj.getDouble(key);
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getFloat(java.lang.String, java.lang.Float)
	 */
	@Override
	public Float getFloat(String key, Float defaultValue) {
		try {
			return (float)obj.getDouble(key);
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getInteger(java.lang.String, java.lang.Integer)
	 */
	@Override
	public Integer getInteger(String key, Integer defaultValue) {
		try {
			return obj.getInt(key);
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getLong(java.lang.String, java.lang.Long)
	 */
	@Override
	public Long getLong(String key, Long defaultValue) {
		try {
			return obj.getLong(key);
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getString(java.lang.String, java.lang.String)
	 */
	@Override
	public String getString(String key, String defaultValue) {
		try {
			return obj.isNull(key)? defaultValue: obj.getString(key);
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.Properties#getProperties(java.lang.String, oculus.aperture.spi.Properties)
	 */
	@Override
	public Properties getPropertiesSet(String key, Properties defaultValue) {
		try {
			return new JSONProperties(obj.getJSONObject(key));
		} catch (JSONException e) {
			return defaultValue;
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getObjects(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Object> getObjects(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Object>() {
				@Override
				public Iterator<Object> iterator() {
					return new Iterator<Object>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Object next() {
							try {
								return (n > i)? array.get(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getStrings(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<String> getStrings(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<String>() {
				@Override
				public Iterator<String> iterator() {
					return new Iterator<String>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public String next() {
							try {
								return (n > i)? array.getString(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getBooleans(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Boolean> getBooleans(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Boolean>() {
				@Override
				public Iterator<Boolean> iterator() {
					return new Iterator<Boolean>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Boolean next() {
							try {
								return (n > i)? array.getBoolean(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getIntegers(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Integer> getIntegers(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Integer>() {
				@Override
				public Iterator<Integer> iterator() {
					return new Iterator<Integer>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Integer next() {
							try {
								return (n > i)? array.getInt(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getLongs(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Long> getLongs(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Long>() {
				@Override
				public Iterator<Long> iterator() {
					return new Iterator<Long>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Long next() {
							try {
								return (n > i)? array.getLong(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getFloats(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Float> getFloats(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Float>() {
				@Override
				public Iterator<Float> iterator() {
					return new Iterator<Float>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Float next() {
							try {
								return (n > i)? (float)array.getDouble(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getDoubles(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Double> getDoubles(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Double>() {
				@Override
				public Iterator<Double> iterator() {
					return new Iterator<Double>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Double next() {
							try {
								return (n > i)? array.getDouble(i++) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.common.Properties#getPropertiesSets(java.lang.String, java.util.Iterable)
	 */
	@Override
	public Iterable<Properties> getPropertiesSets(String key) {
		try {
			final JSONArray array = obj.getJSONArray(key);
			
			return new Iterable<Properties>() {
				@Override
				public Iterator<Properties> iterator() {
					return new Iterator<Properties>() {
						private final int n= array.length();
						private int i=0;
						
						@Override
						public boolean hasNext() {
							return n > i;
						}
		
						@Override
						public Properties next() {
							try {
								return (n > i)? new JSONProperties(array.getJSONObject(i++)) : null;
							} catch (JSONException e) {
								return null;
							}
						}
		
						@Override
						public void remove() {
							throw new UnsupportedOperationException();
						}
					};
				}
			};
			
		} catch (JSONException e) {
			return EmptyIterable.instance();
		}
	}

	/* (non-Javadoc)
	 * @see java.lang.Object#hashCode()
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((obj == null) ? 0 : obj.hashCode());
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
		JSONProperties other = (JSONProperties) obj;
		if (this.obj == null) {
			if (other.obj != null)
				return false;
		} else if (!this.obj.equals(other.obj))
			return false;
		return true;
	}

	
	
}
