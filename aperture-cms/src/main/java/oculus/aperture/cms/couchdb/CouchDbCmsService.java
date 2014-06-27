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
package oculus.aperture.cms.couchdb;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import oculus.aperture.cms.DocumentImpl;
import oculus.aperture.common.EmptyProperties;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.DocumentNotFoundException;

import org.lightcouch.CouchDbClient;
import org.lightcouch.CouchDbException;
import org.lightcouch.DocumentConflictException;
import org.lightcouch.NoDocumentException;
import org.lightcouch.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.Maps;
import com.google.common.io.ByteStreams;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.google.inject.name.Named;

/**
 * An implementation of the ContentService using CouchDB's REST API.
 *
 * This service implementation is a singleton and will be reused across the lifetime
 * of the application.  As such it caches database connectors (which are threadsafe),
 * one per database.  Retrieving a document uses the CouchDB REST API directly (as
 * opposed to using a Java API) so that the content type and encoding can be accessed.
 *
 * @author rharper
 *
 */
@Singleton
class CouchDbCmsService implements ContentService {

	/**
	 * URI protocol
	 */
	public static final String PROTOCOL = "aperture.cms.couchdb.protocol";

	/**
	 * URI host
	 */
	public static final String HOST = "aperture.cms.couchdb.host";
	
	/**
	 * URI port
	 */
	public static final String PORT = "aperture.cms.couchdb.port";

	/**
	 * URI username
	 */
	public static final String USERNAME = "aperture.cms.couchdb.username";

	/**
	 * URI password
	 */
	public static final String PASSWORD = "aperture.cms.couchdb.password";

	
	final Logger logger = LoggerFactory.getLogger(getClass());


	private URI fullUri;
	private String protocol;
	private String host;
	private int port;
	private String username;
	private String password;

	private final Map<String,CouchDbClient> dbClientsByDbName;

	// default config is empty.
	private Properties config= EmptyProperties.EMPTY_PROPERTIES;
	
	@Inject(optional=true)
	public void setConfig(@Named("aperture.server.config") Properties config) {
		this.config = config;
	}
	
	CouchDbCmsService() {
		dbClientsByDbName = Maps.newConcurrentMap();
	}

	// cache for speed
	private void init() {
		if (protocol == null) {
			protocol = config.getString(PROTOCOL, "http");
			host     = config.getString(HOST, "localhost");
			port     = config.getInteger(PORT, 5984);
			username = config.getString(USERNAME, null);
			password = config.getString(PASSWORD, null);

			try {
				this.fullUri = new URI(protocol, null, host, port, null, null, null);
			} catch (URISyntaxException e) {
				logger.error("Poorly formatted CouchDB URL provided in configuration", e);
				throw new IllegalArgumentException("Bad CouchDB URL property");
			}

			
		}
	}

	public ContentService.Document createDocument() {
		return new DocumentImpl();
	}


	public DocumentDescriptor storeDocument(Document doc, String store,
			String id, String rev) throws ConflictException {
		
		init();

		// First, get the DB
		CouchDbClient db = this.dbClientsByDbName.get(store);
		if( db == null ) {
			// Haven't created a connector for this db yet
			db = new CouchDbClient(store, true, protocol, host, port, username, password);
			this.dbClientsByDbName.put(store, db);
		}

		// Get a stream to our data
		InputStream in = new ByteArrayInputStream(doc.getDocument());

		try {
			Response resp;
			if( id == null ) {
				// No id provided, save using a new generated id
				resp = db.saveAttachment(in, "data", doc.getContentType());
			} else {
				// Provided id/rev - use it
				resp = db.saveAttachment(in, "data", doc.getContentType(), id, rev);
			}

			if( resp != null ) {
				return new DocumentImpl( resp.getId(), resp.getRev(), store );
			}
		} catch (NoDocumentException ex) {
			logger.error("Trying to write an attachment to a document that doesn't exist.", ex );
		} catch (DocumentConflictException ex) {
			logger.error("Revision conflict", ex );
			throw new ConflictException();
		} catch (CouchDbException ex) {
			logger.error("CouchDB error", ex );
		}

		// Failed
		// TODO Ever should return null or should always throw exception?
		return null;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.store.ContentService#removeDocument(java.lang.String, java.lang.String, java.lang.String)
	 */
	@Override
	public StoredDocument removeDocument(String storeName, String id, String rev) {
		try {
			StoredDocument doc = getDocument(storeName, id, rev, true);
			dbClientsByDbName.get(storeName).remove(id, rev);
			
			return doc;
		} catch (DocumentNotFoundException e) {
			return null;
		}		
	}
	

	public StoredDocument getDocument(String store, String id, String rev) throws DocumentNotFoundException {
		return getDocument(store, id, rev, false);		
	}
	
	public StoredDocument getDocument(String store, String id, String rev, boolean remove) throws DocumentNotFoundException {
		
		init();

		// Unfortunately cannot use the CouchDB API since we need the mime type and encoding
		// Use straight-up URLs

		// Create URL to attachment
		String path = "/"+store+"/"+id+"/data";
		// Add revision if given
		if( rev != null ) {
			path += "?rev="+rev;
		}

		InputStream in = null;
		try {
			URI uri = new URI(this.fullUri.toString() + path);

			HttpURLConnection connection = (HttpURLConnection)uri.toURL().openConnection();
			if( connection.getResponseCode() >= 400 ) {
				logger.error("Received status of {}", connection.getResponseCode());
				throw new DocumentNotFoundException();
			}

			String encoding = connection.getContentEncoding();
			String mime = connection.getContentType();
			rev = connection.getHeaderField("Etag").replace("\"", "");

			in = connection.getInputStream();

			byte[] data = ByteStreams.toByteArray(in);

			return new DocumentImpl( id, rev, store, encoding, mime, data );

		} catch (URISyntaxException e) {
			logger.error("Bad URI syntax, likely a bad document id", e);
			throw new DocumentNotFoundException();
		} catch (IOException e) {
			logger.error("Could not read data returned from CouchDB", e);
			throw new DocumentNotFoundException();
		} finally {
			if (in != null) {
				try {
					in.close();
				} catch (IOException e) {
					logger.warn("Unexpectedly failed to close input stream.", e);
				}
			}
		}
	}

}
