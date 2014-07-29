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
package oculus.aperture.icons;
import java.io.InputStream;
import java.util.Map;

import oculus.aperture.geo.BasicCountryLevelGeocodingService;
import oculus.aperture.icons.attr.BasicPlaceTypeHandler;
import oculus.aperture.icons.attr.BasicTypeHandler;
import oculus.aperture.icons.attr.BasicSingleAttributeHandler;
import oculus.aperture.icons.attr.TypeHandler;
import oculus.aperture.icons.util.TypeUtils;
import oculus.aperture.spi.geo.GeocodingService;

import com.google.common.collect.Maps;

/**
 * A small icon ontology focused on human social cultural behavior analysis,
 * and artifacts (sources and products) of that analysis.
 * 
 * @author djonker
 */
class SocioCulturalIconIndex {
	
	private static final String LOGO_PATH = "/oculus/aperture/icons/logo.svg";
	private static final String RESOURCE_DIR = "/oculus/aperture/icons/hscb/";
	private static final String NOTFOUND_PATH = "/oculus/aperture/icons/hscb/notfound.svg";


	/**
	 * Resource paths to types
	 */
	private final Map<String, TypeHandler> typePaths= Maps.newHashMap();

	/**
	 * On construction, generate shortform aliases for types at class loading time.
	 * 
	 * This could be generated programmatically at build time,
	 * however to keep things simple we build it manually here.
	 */
	public SocioCulturalIconIndex() {
		
		// could bind this abstractly but we know this one is fast for our uncomplicated needs
		GeocodingService geoCoding = new BasicCountryLevelGeocodingService();
		
		// one non-standard fixed lookup for the logo
		typePaths.put("logo", new TypeHandler() {
			public InputStream getStream(String type, Map<String, String> attributes) {
				return SocioCulturalIconIndex.class.getResourceAsStream(LOGO_PATH);
			}
		});
		
		addBasic("concept");
		addBasic("concept/belief");
		
		addBasic("entity");
		addBasic("entity/actor");
		addATTRd("entity/actor/organization");
		addATTRd("entity/actor/person");
		addPlace("entity/place", geoCoding);
		
		addBasic("entity/facility");
		addBasic("entity/facility/factory");
		addBasic("entity/facility/store");
		addBasic("entity/facility/warehouse");
		addBasic("entity/facility/materials");
		
		addBasic("event");
		
		addBasic("artifact");
		addBasic("artifact/account");
		addATTRd("artifact/account/ledger");
		addBasic("artifact/annotation");
		addATTRd("artifact/annotation/stamp");
		addATTRd("artifact/annotation/warning");
		addATTRd("artifact/document");
		addBasic("artifact/document/map");
		addATTRd("artifact/document/snippet");
		addBasic("artifact/image");
		addBasic("artifact/video");
		// future additions: more events
		// future additions: relationships
	}

	private String pathFromType(String type) {
		return RESOURCE_DIR + type + "/";
	}
	
	/**
	 * Add the short form type and the full path as valid keys.
	 */
	private void addBasic(String type) {
		final TypeHandler h = new BasicTypeHandler(pathFromType(type));
		
		typePaths.put(type, h);
		typePaths.put(TypeUtils.shortform(type), h);
	}
	
	/**
	 * Add the short form type and the full path as valid keys.
	 */
	private void addATTRd(String type) {
		final TypeHandler h = new BasicSingleAttributeHandler(pathFromType(type));
		
		typePaths.put(type, h);
		typePaths.put(TypeUtils.shortform(type), h);
	}
	
	/**
	 * Add the short form type and the full path as valid keys.
	 */
	private void addPlace(String type, GeocodingService geoCoding) {
		final TypeHandler h = new BasicPlaceTypeHandler(pathFromType(type), geoCoding);
		
		typePaths.put(type, h);
		typePaths.put(TypeUtils.shortform(type), h);
	}
	
	/**
	 * 
	 * @param type
	 * @param attributes
	 * @return
	 */
	public InputStream getStream(String type, Map<String, String> attributes) {
		TypeHandler path = null;
		
		// case insensitive
		type = type.toLowerCase();
		
		// find the type that we have icons for - falling back to super types if necessary.
		while ((path = typePaths.get(type)) == null) {
			final int i = type.lastIndexOf('/');
			
			if (i < 0) break;

			type = type.substring(0, i);
		}
		
		if (path == null) {
			// if no valid type path, return the default icon.
			return SocioCulturalIconIndex.class.getResourceAsStream(NOTFOUND_PATH);
		}

		// delegate
		return path.getStream(type, attributes);
	}
	
}
