/**
 * Copyright (c) 2013 Oculus Info Inc. 
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
import java.util.Map.Entry;

import com.google.common.collect.Maps;

/**
 * A small icon ontology focused on human social cultural behavior analysis,
 * and artifacts (sources and products) of that analysis.
 * 
 * @author djonker
 */
class SocioCulturalIconIndex {
	
	/**
	 * Where our resources lie.
	 */
	private static final String RESOURCE_DIR = "/oculus/aperture/icons/hscb/";
	
	/**
	 * Resource paths to types
	 */
	private static final Map<String, String> TYPE_PATHS= Maps.newHashMap();
	
	/**
	 * Generate shortform aliases for types at class loading time.
	 * 
	 * This could be generated programmatically at build time,
	 * however to keep things simple we build it manually here.
	 */
	static {
		TYPE_PATHS.put("logo", "/oculus/aperture/icons");
		
		add("concept");
		add("concept/belief");
		add("entity");
		add("entity/actor");
		add("entity/actor/organization");
		add("entity/actor/person");
		add("entity/place");
		add("event");
		add("artifact");
		add("artifact/account");
		add("artifact/account/ledger");
		add("artifact/annotation");
		add("artifact/annotation/stamp");
		add("artifact/annotation/warning");
		add("artifact/document");
		add("artifact/document/map");
		add("artifact/document/snippet");
		add("artifact/image");
		add("artifact/video");
		// future additions: more events
		// future additions: relationships
	}

	/**
	 * Extracts the right most term in a slash delimited path
	 */
	private static String shortform(String longform) {
		final int i = longform.lastIndexOf('/');
		
		return i < 0? longform : 
				i == longform.length() - 1? 
					longform.substring(0, i) : 
						longform.substring(i + 1);
	}
	
	/**
	 * Add the short form type and the full path as valid keys.
	 */
	private static void add(String type) {
		final String path = RESOURCE_DIR + type;
		
		TYPE_PATHS.put(type, path);
		TYPE_PATHS.put(shortform(type), path);
	}
	
	/**
	 * 
	 * @param type
	 * @param attributes
	 * @return
	 */
	public static InputStream getStream(String type, Map<String, String> attributes) {
		String path = null;
		
		// case insensitive
		type = type.toLowerCase();
		
		// find the type that we have icons for - falling back to super types if necessary.
		while ((path = TYPE_PATHS.get(type)) == null) {
			final int i = type.lastIndexOf('/');
			
			if (i < 0) break;

			type = type.substring(0, i);
		}
		
		if (path == null) {
			// if no valid type path, return the default icon.
			return SocioCulturalIconIndex.class.getResourceAsStream(RESOURCE_DIR + "notfound.svg");
		}
		
		// now look for the icon. right now our attribute treatment is 
		// simplistic in that we do not support more than one at once (and
		// take the first match here). in the future should we have multiple
		// attributes to support we may consider a layered approach...
		for (Entry<String, String> attr : attributes.entrySet()) {
			final String attrKey = attr.getKey().toLowerCase().trim();
			final String attrValue = attr.getValue().toLowerCase().trim();

			// sanity check.
			if (attrKey.isEmpty() || attrValue.isEmpty())
				continue;

			// form full path
			final String attrPath = path + "/attr/" + attrKey + "/" + attrValue + ".svg";

			// check for it.
			final InputStream stream = SocioCulturalIconIndex.class.getResourceAsStream(attrPath);
			
			// if valid, return it.
			if (stream != null)
				return stream;
		}
		
		// otherwise return the default icon for that type.
		return SocioCulturalIconIndex.class.getResourceAsStream(path + "/" + shortform(type) + ".svg");
	}
	
}
