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

import java.awt.Image;
import java.awt.image.RenderedImage;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;

import oculus.aperture.common.EmptyProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.common.rest.BlobRepresentation;
import oculus.aperture.icons.coded.CodeIconFactory;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.palette.IconService;
import oculus.aperture.spi.palette.ImageProcessingException;
import oculus.aperture.spi.palette.ImageService.ImageData;

import org.restlet.data.CacheDirective;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.resource.Get;
import org.restlet.resource.ResourceException;


import com.google.inject.Inject;
import com.google.inject.name.Named;

/**
 * @author djonker
 *
 */
public class IconResource extends ApertureServerResource {

	private Map<String, IconService> ontologies;
	private CodeIconFactory codeFactory;
	
	// default config is empty.
	private Properties config= EmptyProperties.EMPTY_PROPERTIES;
	
	@Inject(optional=true)
	public void setConfig(@Named("aperture.server.config") Properties config) {
		this.config = config;
	}
	
	
	/**
	 * 
	 */
	@Inject
	public IconResource(Map<String, IconService> iconOntologies, CodeIconFactory codeFactory) {
		this.ontologies = iconOntologies;
		this.codeFactory = codeFactory;
	}

	@Get
	public Representation getIcon() throws ImageProcessingException {
		// get the ontology specifier
		final String ontology = (String)getRequest().getAttributes().get("ontology");

		// validate
		if (ontology == null) {
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST,
					"Must specify the icon ontology");
		}

		final IconService icons = ontologies.get(ontology);
		
		// validate
		if (icons == null) {
			throw new ResourceException(Status.CLIENT_ERROR_NOT_FOUND,
				"The specified icon ontology was not found");
		}

		
		final IconResourceRequest rq = new IconResourceRequest(this);
		ImageData data = null;
		
		if (rq.getCodeHeight() <= 0) {
			// now build all the params we need for our request.
			data = icons.getIcon(
					rq.getType(), rq.getAttributes(), 
					rq.getWidth(), rq.getHeight(), rq.getFormat());
		} else {
			final Image img = icons.getIconImage(
					rq.getType(), rq.getAttributes(), 
					rq.getWidth(), rq.getHeight());
			
			if (img != null) {
				try {
					// create the icon
					RenderedImage icon = codeFactory.make(
							img, rq.getWidth(), rq.getHeight(), rq.getCodeHeight(), rq.getCode(), rq.getFormat());
					
					// encode and return it.
					data = new IconData(icon, rq.getFormat());
					
				} catch (IOException e) {
					throw new ImageProcessingException("Problem encoding icon for type "+ rq.getType());
				}
			}
		}
			
		// null check.
		if (data == null) {
			throw new ResourceException(Status.CLIENT_ERROR_NOT_FOUND, 
					"Requested icon for type "+ rq.getType()+ " was not found.");
		}
		
		final int maxAge = config.getInteger("aperture.icons.maxage", 604800);

		// cache directive
		getResponse().setCacheDirectives(Collections.singletonList(CacheDirective.maxAge(maxAge)));
		
		
		// return it.
		return new BlobRepresentation(MediaType.valueOf(data.getMediaType()),data.getData());
	}


}
