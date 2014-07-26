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
package oculus.aperture.geo;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import oculus.aperture.spi.geo.GeocodingService;
import oculus.aperture.spi.geo.GeopoliticalData;
import oculus.aperture.spi.geo.GeopoliticalData.Continent;
import oculus.aperture.spi.geo.GeospatialData;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.io.CharStreams;
import com.google.inject.Singleton;

/**
 * @author djonker
 *
 */
@Singleton
public class BasicCountryLevelGeocodingService implements GeocodingService {

	private static final Logger s_logger = LoggerFactory.getLogger(BasicCountryLevelGeocodingService.class);

	// code to country lookup
	private final Map<String, GeopoliticalData> countryMap;

	// countries ordered by length of name.
	private final List<GeopoliticalData> nameList;
	
	
	/**
	 * Constructs a new geocoder and initialises it by loading local country data.
	 */
	public BasicCountryLevelGeocodingService() {
		nameList = new ArrayList<GeopoliticalData>();
		countryMap = new HashMap<String, GeopoliticalData>();
		
		final InputStream inp = BasicCountryLevelGeocodingService.class.getResourceAsStream("countries.json");
		
		if (inp != null) {
			try {
				final String json = CharStreams.toString(new BufferedReader(
						new InputStreamReader(inp, Charset.forName("UTF-8"))));
				
				final JSONArray array = new JSONArray(json);
				
				for (int i=0; i< array.length(); i++) {
					final JSONObject record = array.getJSONObject(i);
					
					final GeopoliticalData country = new BasicGeopoliticalData(
						new BasicGeospatialData(
							getString(record, "CountryName"),
							getDouble(record, "Latitude"),
							getDouble(record, "Longitude"),
							getString(record, "ISOCC3")),
							getString(record, "GlobalRegion"),
							Continent.valueOf(getString(record, "ContinentCode"))
						);
					

					final String isoCC2 = getString(record, "ISOCC2");
					final String fips = getString(record, "FIPS");
					final String ccTLD = getString(record, "InternetCCTLD");
					final Long isoNo = getLong(record, "ISONo");
					
					countryMap.put(isoCC2, country);
					countryMap.put(country.getGeoData().getCountryCode(), country);
					
					// add non-conflicting fips.
					if (fips != null && !countryMap.containsKey(fips)) {
						countryMap.put(fips, country);
					}
					if (isoNo != null) {
						countryMap.put(String.valueOf(isoNo), country);
					}
					
					// not necessary (same as iso 2), but...
					if (ccTLD != null && !countryMap.containsKey(ccTLD)) {
						countryMap.put(ccTLD, country);
					}
					
					nameList.add(country);
				}
				
				// sort countries
				Collections.sort(nameList, new Comparator<GeopoliticalData>() {
					public int compare(GeopoliticalData o1, GeopoliticalData o2) {
						return o2.getGeoData().getText().length() - o1.getGeoData().getText().length();
					}
				});
				
			} catch(IOException e) {
				s_logger.error("Failed to loan countries.json", e);
			} catch (JSONException e) {
				s_logger.error("Failed to parse countries.json", e);
			} finally {
				try {
					inp.close();
				} catch (IOException e) {
				}
			}
			
		}
	}
	
	private static String getString(JSONObject record, String fieldName) {
		try {
			return record.isNull(fieldName)? null: record.getString(fieldName);
		} catch (Exception e) {
			return null;
		}
	}
	
	private static Double getDouble(JSONObject record, String fieldName) {
		try {
			return record.getDouble(fieldName);
		} catch (Exception e) {
			return null;
		}
	}
	
	private static Long getLong(JSONObject record, String fieldName) {
		try {
			return record.getLong(fieldName);
		} catch (Exception e) {
			return null;
		}
	}
	

	@Override
	public List<GeospatialData> geocode(List<GeospatialData> locations) {
		final ArrayList<GeospatialData> enhanced = 
				new ArrayList<GeospatialData>(locations.size());

		// for every location to geocode
		for (GeospatialData location : locations) {

			Double lat = location.getLatitude();
			Double lon = location.getLongitude();		
			String icc = location.getCountryCode();
			String txt = location.getText();
			
			// if has a country code...
			if (icc != null && !icc.isEmpty()) {
				
				// if nothing to do, continue.
				if (lat != null && lon != null && txt != null && !txt.isEmpty() && icc.length() == 3) {
					enhanced.add(location);
					continue;
				}

				final GeopoliticalData country = countryMap.get(icc);
				
				if (country != null) {
					final GeospatialData countryGeo = country.getGeoData();
					if (lat == null) {
						lat = countryGeo.getLatitude();
						lon = countryGeo.getLongitude();
					}
					if (txt == null || txt.isEmpty()) {
						txt = countryGeo.getText();
					}
					
					icc = countryGeo.getCountryCode();
					
					// found, continue.
					enhanced.add(new BasicGeospatialData(txt, lat, lon, icc));
					continue;
				}
			}
			
			// if has text, simply look for country name
			if (txt != null && !txt.isEmpty()) {
				boolean matched = false;
				
				for (GeopoliticalData country : nameList) {
					if (txt.indexOf(country.getGeoData().getText()) != -1) {
						final GeospatialData countryGeo = country.getGeoData();
						
						icc = countryGeo.getCountryCode();
						
						if (lat == null) {
							lat = countryGeo.getLatitude();
							lon = countryGeo.getLongitude();
						}
						
						matched = true;
						break;
					}
				}
				
				if (matched) {
					enhanced.add(new BasicGeospatialData(txt, lat, lon, icc));
					continue;
				}
			}

			// if got this far nothing worked and cannot enhance.
			// (we do not have the ability to reverse geocode from lat / lon).
			enhanced.add(location);
		}
		
		return enhanced;
	}

	@Override
	public List<GeopoliticalData> getGeopoliticalData(
			List<GeospatialData> locations) {

		final List<GeopoliticalData> countries = new ArrayList<GeopoliticalData>(
				locations.size());
		
		for (GeospatialData location : locations) {
			countries.add(location.getCountryCode() == null? 
					null : countryMap.get(location.getCountryCode()));
		}

		return countries;
	}

}
