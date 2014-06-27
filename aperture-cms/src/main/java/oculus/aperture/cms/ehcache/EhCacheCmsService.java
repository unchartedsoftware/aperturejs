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
package oculus.aperture.cms.ehcache;

import java.rmi.server.UID;
import java.util.SortedMap;
import java.util.TreeMap;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;
import net.sf.ehcache.config.CacheConfiguration;
import net.sf.ehcache.config.Configuration;
import oculus.aperture.cms.DocumentImpl;
import oculus.aperture.common.EmptyProperties;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.DocumentNotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;
import com.google.inject.Singleton;
import com.google.inject.name.Named;

/**
 * A quick and dirty in-memory CMS service implementation.  This implementation correctly
 * supports adding new documents as well as updating existing ones.  On update it checks that
 * the rev being supplied is equal to the latest revision of the document.  If it is not it
 * throws a conflict exception.
 *
 * Gets support getting the latest (no rev supplied) or getting a particular revision of the
 * resource (rev supplied).  If the id or revision supplied cannot be found this service impl
 * will throw a not found exception.
 *
 * @author rharper
 *
 */
@Singleton
public class EhCacheCmsService implements ContentService {

	final Logger logger = LoggerFactory.getLogger(getClass());

	private CacheManager cms;

	/**
	 * Max size config parameter.
	 */
	public static final String MAX_SIZE = "aperture.cms.ehcache.maxSize";

	
	// default config is empty.
	private Properties config= EmptyProperties.EMPTY_PROPERTIES;
	
	@Inject(optional=true)
	public void setConfig(@Named("aperture.server.config") Properties config) {
		this.config = config;
	}
	
	private CacheManager getCMS() {
		if (cms == null) {
			Configuration config = new Configuration()
				.name("ehcache.cms")
				.defaultCache(new CacheConfiguration("default", 
						this.config.getInteger(MAX_SIZE, 1000)));

			cms = CacheManager.newInstance(config);
		}
		return cms;
	}
	
	public Document createDocument() {
		return new DocumentImpl();
	}



	@SuppressWarnings("unchecked")
	public DocumentDescriptor storeDocument(Document doc, String storeName, String id, String rev)
		throws ConflictException {

		Cache store = getCMS().getCache(storeName);
		if( store == null ) {
			cms.addCache(storeName);
			store = cms.getCache(storeName);
		}

		if( id == null ) {
			// Create an id with the - and :s stripped out
			id = (new UID()).toString().replace("-", "").replace(":", "");
		}

		// Convert revision value to integer (what we use internally)
		Integer revNumber = null;
		if( rev != null ) {
			try {
				revNumber = Integer.parseInt(rev);
			} catch (NumberFormatException e) {
				// Revision not a number?  Must be a bad revision
				throw new ConflictException();
			}
		}

		// Determine if the document already exists
		SortedMap<Integer,DocumentImpl> existingDocs;
		Element existingElement = store.get(id);
		if( existingElement != null ) {
			existingDocs = (SortedMap<Integer,DocumentImpl>)existingElement.getObjectValue();
			// Ensure
			Integer recentRev = existingDocs.lastKey();
			if( recentRev.equals(revNumber) == false ) {
				// Trying to write to an existing id with an out-of-date or missing revision - fail
				throw new ConflictException();
			} else {
				// Generate new rev by incrementing revision number
				revNumber = revNumber + 1;
			}
			// Else ok to store
		} else {
			if( revNumber != null ) {
				// Trying to update a document that doesn't exist
				throw new ConflictException();
			}
			// Nothing stored with this id yet
			existingDocs = new TreeMap<Integer,DocumentImpl>();
			store.put(new Element(id,existingDocs));

			// New document, start with rev 0
			revNumber = 0;
		}

		// Create the document to store
		DocumentImpl docToStore = new DocumentImpl(id, revNumber.toString(), storeName,
				doc.getEncoding(), doc.getContentType(), doc.getDocument());

		// Store the document
		existingDocs.put(revNumber, docToStore);

		// Return the stored doc since it implements descriptor
		return docToStore;
	}


	public StoredDocument removeDocument(String storeName, String id, String rev) {
		try {
			return getDocument(storeName, id, rev, true);
		} catch (DocumentNotFoundException e) {
			return null;
		}
	}

	public StoredDocument getDocument(String storeName, String id, String rev) throws DocumentNotFoundException {
		return getDocument(storeName, id, rev, false);
	}

	private StoredDocument getDocument(String storeName, String id, String rev, boolean remove) throws DocumentNotFoundException {
		Cache store = getCMS().getCache(storeName);
		if( store != null ) {
			// Get only using id, ignore rev for now
			Element e = remove? store.removeAndReturnElement(id) : store.get(id);
			if( e != null ) {
				// Get the revision from the map or the most recent if no revision
				@SuppressWarnings("unchecked")
				SortedMap<Integer,DocumentImpl> existingDocs = (SortedMap<Integer,DocumentImpl>)e.getObjectValue();
				Integer revNumber;
				if( rev == null ) {
					revNumber = existingDocs.lastKey();
				} else {
					try {
						revNumber = Integer.parseInt(rev);
					} catch (NumberFormatException e1) {
						// Bad revision number
						throw new DocumentNotFoundException();
					}
				}
				return existingDocs.get( revNumber );
			}
		}
		throw new DocumentNotFoundException();
	}
}
