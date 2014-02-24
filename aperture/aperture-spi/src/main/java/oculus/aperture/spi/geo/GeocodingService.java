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
package oculus.aperture.spi.geo;

import java.util.List;

import oculus.aperture.spi.palette.ImageService;

/**
 * Geocoding services.
 * 
 * @author djonker
 */
public interface GeocodingService extends ImageService {

  /** 
   * Geocodes the specified locations, enhancing with missing properties and returning the result. 
   * 
   * @param locations
   * 	the locations to geocode. 
   * 
   * @return
   * 	a list of enhanced objects, in the same order as requested.
   */
	public List<GeospatialData> geocode(List<GeospatialData> locations);
    
    /** 
     * Returns a list of geopolitical objects for the previously geolocated 
     * locations specified, based on country code.
     * 
     * @param locations	
     * 		the locations to lookup, which must contain a country code.
     * 
     * @return 
     * 		a list of geocoded objects, in the same order as requested. 
     */
    public List<GeopoliticalData> getGeopoliticalData(List<GeospatialData> locations);
    
}
