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
package oculus.aperture.icons.attr;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import oculus.aperture.geo.BasicGeospatialData;
import oculus.aperture.spi.geo.GeocodingService;
import oculus.aperture.spi.geo.GeopoliticalData;
import oculus.aperture.spi.geo.GeospatialData;

/**
 * @author djonker
 */
public class BasicPlaceTypeHandler implements TypeHandler {

	private static final Map<String, String> NA_ATTRS = Collections.singletonMap("continent", "NA");
	private static final Map<String, String> SA_ATTRS = Collections.singletonMap("continent", "SA");
	private static final Map<String, String> EU_ATTRS = Collections.singletonMap("continent", "EU");
	private static final Map<String, String> AF_ATTRS = Collections.singletonMap("continent", "AF");
	private static final Map<String, String> AN_ATTRS = Collections.singletonMap("continent", "AN");
	private static final Map<String, String> AS_ATTRS = Collections.singletonMap("continent", "AS");
	private static final Map<String, String> OC_ATTRS = Collections.singletonMap("continent", "OC");

	
	// backup
	private final BasicSingleAttributeHandler baseHandler;

	// geocoding
	private final GeocodingService geocoder;

	
	/**
	 * Construct a basic place type handler.
	 */
	public BasicPlaceTypeHandler(String basePath, GeocodingService geocoder) {
		this.baseHandler = new BasicSingleAttributeHandler(basePath);
		this.geocoder = geocoder;
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.icons.IconSource#getStream(java.lang.String)
	 */
	@Override
	public InputStream getStream(String type, Map<String, String> attributes) {
		for (Entry<String, String> attr: attributes.entrySet()) {
			if (attr.getKey() != null && attr.getKey().toLowerCase().equals("country") 
					&& attr.getValue() != null && !attr.getValue().isEmpty()) {
				
				final GeospatialData country = new BasicGeospatialData(null,null,null,attr.getValue().toUpperCase());
				
				// enhance
				final List<GeospatialData> coded = geocoder.geocode(Collections.singletonList(country));
				
				// if ok, get more
				if (coded != null && !coded.isEmpty()) {
					final GeopoliticalData gd = 
						geocoder.getGeopoliticalData(Collections.singletonList(coded.get(0))).get(0);
					
					if (gd != null) {
						switch (gd.getContinent()) {
						case AF:
							return baseHandler.getStream(type, AF_ATTRS);
						case AN:
							return baseHandler.getStream(type, AN_ATTRS);
						case AS:
							return baseHandler.getStream(type, AS_ATTRS);
						case EU:
							return baseHandler.getStream(type, EU_ATTRS);
						case NA:
							return baseHandler.getStream(type, NA_ATTRS);
						case OC:
							return baseHandler.getStream(type, OC_ATTRS);
						case SA:
							return baseHandler.getStream(type, SA_ATTRS);
						}
					}
				}
			}
		}
		
		return baseHandler.getStream(type, attributes);
	}

}
