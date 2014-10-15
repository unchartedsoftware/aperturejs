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
package oculus.aperture.cms;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.common.rest.BlobRepresentation;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.DocumentNotFoundException;
import oculus.aperture.spi.store.ContentService.Document;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.data.CharacterSet;
import org.restlet.data.Disposition;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.Get;
import org.restlet.resource.Post;
import org.restlet.resource.ResourceException;

import com.google.common.collect.Maps;
import com.google.common.io.ByteStreams;
import com.google.inject.Inject;

/**
 * A resource that handles POSTs to add or update documents and GETs to
 * retrieve documents.  All calls may have id and revision specified.  All
 * calls must have store specified.
 *
 * @author rharper
 *
 */
public class ContentResource extends ApertureServerResource {

	private final ContentService contentService;

	private String store = null;
	private String id = null;
	private String rev = null;
	private String filename = null;
	private Action action = Action.GET;
	
	public enum Action {
		GET,
		REMOVE,
		POP
	}
	
	@Inject
	public ContentResource(ContentService contentService ) {
		this.contentService = contentService;
	}


	@Override
	protected void doInit() throws ResourceException {
		super.doInit();

		// CMS store
		this.store = Reference.decode((String)getRequestAttributes().get("store"));

		// Document id
		this.id = Reference.decode((String)getRequestAttributes().get("id"));

		// Document revision
		// Get parameters from query
		Form form = getRequest().getResourceRef().getQueryAsForm();
		this.rev = form.getFirstValue("rev");
		if (this.rev != null) {
			Pattern regex = Pattern.compile("[^\\d\\.]");
			Matcher regexMatcher = regex.matcher(this.rev);
			if (regexMatcher.find()) {
				throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Document revisions must only contain digits and periods.");
			}
		}
		
		// optional local filename to save to for gets
		this.filename = form.getFirstValue("downloadAs");

		// action (other than get)
		final String action = form.getFirstValue("action");
		
		if (action != null) {
			try {
				this.action = Action.valueOf(action.toUpperCase());
			} catch (Exception e) {
			}
		}
	}


	/**
	 * Stores a document in the CMS.  May come in from a URI with or without an id
	 * specified
	 *
	 * @return a JSON block indicating success or failure.  On success will also set
	 * the location ref header to the URL of the created/updated resource.
	 *
	 * @throws ResourceException
	 */
	@Post
	public Representation addOrUpdateDocument(Representation entity) throws ResourceException {

		if( this.store == null ) {
			throw new ResourceException(Status.CLIENT_ERROR_NOT_FOUND, "Request did not contain a valid store name");
		}

		// Create the document
		Document doc = contentService.createDocument();

		// Set the content
		try {
			doc.setDocument( ByteStreams.toByteArray(entity.getStream()) );
		} catch (IOException e) {
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Error reading posted data.", e);
		}

		// Set some metadata
		doc.setContentType( entity.getMediaType().getName() );
		if( entity.getCharacterSet() != null ) {
			doc.setEncoding( entity.getCharacterSet().getName() );
		}

		// Store
		DocumentDescriptor descriptor = null;
		try {
			descriptor = contentService.storeDocument(doc, store, id, rev);
		} catch (ConflictException e) {
			// Wrong rev used, cannot update
			throw new ResourceException(Status.CLIENT_ERROR_CONFLICT, "Version conflict, provided revision for document is out of date.", e);
		}

		if( descriptor != null ) {
			// Construct the URI to the created/updated resource
			String resourceUri = getRequest().getResourceRef().getIdentifier();
			// Trim off the query portion (because if it's there it's the old revision of the document)
			int queryIdx = resourceUri.indexOf('?');
			if( queryIdx > 0 ) {
				resourceUri = resourceUri.substring(0, queryIdx);
			}

			// If the request didn't specify the id, append the created one to the location now that it's stored
			if( id == null ) {
				resourceUri += "/" + Reference.encode(descriptor.getId());
			}

			// Append the revision for this version
			resourceUri += "?rev=" + Reference.encode(descriptor.getRevision());


			// Return a response containing a JSON block with the id/rev
			Map<Object,Object> response = Maps.newHashMap();
			response.put("ok", true);
			response.put("id", descriptor.getId());
			response.put("rev", descriptor.getRevision());
			response.put("store", descriptor.getStore());

			// Return a JSON response
			JsonRepresentation rep = new JsonRepresentation(response);
			// Set the location header to the resource's location
			setLocationRef(resourceUri);

			// Response 201 - Created
			setStatus(Status.SUCCESS_CREATED);

			return rep;
		}

		// Generic error when something just didn't work and we don't know why
		throw new ResourceException(Status.SERVER_ERROR_INTERNAL, "The document could not be added to the CMS for an unknown reason.");
	}


	/**
	 * Gets a document from the CMS.  Store and id are required.  If no revision supplied,
	 * the latest version of the document is returned.
	 *
	 * @return the document with the corresponding content-type on success, a JSON block with
	 * a failure message on fail.
	 */
	@Get
	public Representation getDocument() {
		// Store
		if( store == null ) {
			// Unlikely that we can get here because the resource template wouldn't match
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, 
					"Request did not contain a valid store name");
		}

		// Id
		if( id == null ) {
			// Unlikely that we can get here because the resource template wouldn't match
			throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, 
					"Request did not contain a valid document id");
		}


		// Get the document
		Document doc;
		try {
			doc = Action.GET.equals(this.action)? 
				contentService.getDocument(store, id, rev) 
					: contentService.removeDocument(store, id, rev);
		} catch (DocumentNotFoundException e) {
			doc = null;
		}
		
		// if a straight remove we just need to return a response
		if (Action.REMOVE.equals(this.action)) {
			JSONObject status = new JSONObject();
			try {
				status.append("removed", doc != null? "true":"false");
			} catch (JSONException e) {
			}
			return new JsonRepresentation(status);
		}
		
		if( doc == null ) {
			throw new ResourceException(Status.CLIENT_ERROR_NOT_FOUND, 
					"Document " + id + " revision "+ rev + " could not be found.");
		}

		BlobRepresentation resp;
		
		if( doc.getEncoding() != null ) {
			// Has character encoding set, use it
			resp = new BlobRepresentation(MediaType.valueOf(doc.getContentType()),
					CharacterSet.valueOf(doc.getEncoding()), doc.getDocument());
		} else {
			
			// No character encoding, don't set
			resp = new BlobRepresentation(MediaType.valueOf(doc.getContentType()), doc.getDocument());
			
		}
		
		// download prompt?
		if (filename != null && !filename.isEmpty()) {
			final Disposition disposition = new Disposition(Disposition.TYPE_ATTACHMENT);
			disposition.setFilename(filename);
			
			resp.setDisposition(disposition);
		}
		
		return resp;
	}
}
