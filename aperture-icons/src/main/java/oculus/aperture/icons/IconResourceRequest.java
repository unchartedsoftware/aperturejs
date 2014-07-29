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

import java.util.Map;

import oculus.aperture.spi.palette.ImageService.ImageType;

import org.restlet.data.Status;
import org.restlet.resource.Resource;
import org.restlet.resource.ResourceException;

import com.google.common.collect.Maps;

/**
 * @author djonker
 *
 */
public class IconResourceRequest {

	private Map<String, String> attributes;
	private String type;
	private String code;
	private int codeHeight = 0;
	private int width = -1;
	private int height = -1;
	private ImageType format = ImageType.PNG;
	
	/**
	 * Parses icon request parameters from the specified resource
	 */
	public IconResourceRequest(Resource resource) {
		final Map<String, Object> typePath = resource.getRequest().getAttributes();
		
		// now get the type specifier
		type = (String)typePath.get("type");

		if (type == null) {
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST,
				"Must specify an icon type");
		}

		
		// start with a copy of attributes.
		attributes = Maps.newLinkedHashMap(resource.getQuery().getValuesMap());

		// then remove the code attribute.
		code = attributes.remove("code");
		
		// different default if code to show.
		if (code != null && !code.isEmpty()) {
			codeHeight = 9;
		}
		
		// then remove the raster attributes.
		final String scode  = attributes.remove("codeHeight");
		final String swidth  = attributes.remove("iconWidth");
		final String sheight = attributes.remove("iconHeight");
		final String sformat = attributes.remove("iconFormat");

		// parse any attributes which were supplied.
		if (scode != null) {
			try {
				codeHeight = Integer.parseInt(scode);
			} catch (Exception e) {}
		}
		if (swidth != null) {
			try {
				width = Integer.parseInt(swidth);
			} catch (Exception e) {}
		}
		if (sheight != null) {
			try {
				height = Integer.parseInt(sheight) - codeHeight;
			} catch (Exception e) {}
		}
		if (sformat != null) {
			try {
				format = ImageType.valueOf(sformat.toUpperCase());
			} catch (Exception e) {}
		}
	}

	/**
	 * @return
	 */
	public Map<String, String> getAttributes() {
		return attributes;
	}

	/**
	 * @return
	 */
	public String getType() {
		return type;
	}

	/**
	 * @return
	 */
	public int getWidth() {
		return width;
	}

	/**
	 * @return
	 */
	public int getHeight() {
		return height;
	}

	/**
	 * @return
	 */
	public ImageType getFormat() {
		return format;
	}
	
	/**
	 * @return
	 */
	public String getCode() {
		return code;
	}

	/**
	 * @return
	 */
	public int getCodeHeight() {
		return codeHeight;
	}
	
	
}
