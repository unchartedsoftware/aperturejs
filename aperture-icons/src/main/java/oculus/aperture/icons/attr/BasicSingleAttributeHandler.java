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
import java.util.Map;
import java.util.Map.Entry;

import oculus.aperture.icons.util.ResourceUtils;

/**
 * Simple attributed icon handler which handles only one attribute by
 * loading it from a subdirectory.
 * 
 * @author djonker
 */
public class BasicSingleAttributeHandler implements TypeHandler {

	final String basePath;
	final BasicTypeHandler baseHandler;
	
	public BasicSingleAttributeHandler(String basePath) {
		this.basePath = basePath;
		this.baseHandler = new BasicTypeHandler(basePath);
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.icons.attr.IconSource#getStream(java.lang.String, java.util.Map)
	 */
	@Override
	public InputStream getStream(String type, Map<String, String> attributes) {
		for (Entry<String, String> attr : attributes.entrySet()) {
			final String attrKey = attr.getKey().toLowerCase().trim();
			final String attrValue = attr.getValue().toLowerCase().trim();

			// sanity check.
			if (attrKey.isEmpty() || attrValue.isEmpty())
				continue;

			// check for it.
			InputStream stream = ResourceUtils.get(basePath, "attr/" + attrKey + "/" + attrValue + ".svg");
			
			if (stream != null) {
				return stream;
			}
		}
		
		return baseHandler.getStream(type, attributes);
	}

}
