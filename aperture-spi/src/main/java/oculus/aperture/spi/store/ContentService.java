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
package oculus.aperture.spi.store;



/**
 * Service Provider Interface for the content store service
 *
 * @author rharper
 *
 */
public interface ContentService {

	/**
	 * An object that uniquely describes a document in the CMS
	 */
	public interface DocumentDescriptor {
		/**
		 * Returns the document unique id
		 */
		String getId();

		/**
		 * Returns the document revision/version code
		 */
		String getRevision();

		/**
		 * Returns the document store that contains this document
		 */
		String getStore();
	}

	/**
	 * A document object representing document data
	 */
	public interface Document {
		/**
		 * Returns the mime content type of the document
		 */
		String getContentType();
		void setContentType(String contentType);

		/**
		 * Returns the character encoding of the content.  Null if the content type
		 * does not require character encoding.
		 */
		String getEncoding();
		void setEncoding(String encoding);

		/**
		 * Returns the raw bytes of the document
		 */
		byte[] getDocument();
		void setDocument( byte[] data );
	}

	/**
	 * A representation of a stored document complete with id, revision, and accompanying
	 * document data.
	 */
	public interface StoredDocument extends DocumentDescriptor, Document {
	};



	/**
	 * Factory method for creating a document object with the intent on storing
	 * it in the content store.
	 * @return A newly created empty document that may be populated with data and
	 * stored.
	 */
	public Document createDocument();



	/**
	 * Stores or updates the given document and returns a descriptor, if successful.
	 * The descriptor will contain id, revision, and store id.
	 *
	 * @param doc The document object to store
	 * @param store The name of the store, required.
	 * @param id The unique identifier to use for the document.  If null an id will be generated
	 * automatically.  If specified and the id does not exist in the given store, the document
	 * will be added to the store with this id.  If specified and a document does exist, the document
	 * will be updated but only if the revision string matches the most recent revision in the store,
	 * otherwise and exception will be thrown.
	 * @param rev The revision of the document to store.  This must be set to the current document
	 * revision if updating an existing document.  Otherwise, for a new document, this parameter must
	 * be null.  If given for a new document a ConflictException will be thrown.
	 *
	 * @return If successful, a document descriptor object containing the id, revision, and other
	 * information about the document.
	 *
	 * @throws ConflictException when a document cannot be written/updated due to a conflict on the
	 * provided revision string.  This usually happens when an update is attempted using an outdated
	 * (or missing) revision.  May also receive this exception if this call is given an id and a revision but a document with
	 * the given id doesn't exist.
	 */
	public DocumentDescriptor storeDocument( Document doc, String store, String id, String rev )
		throws ConflictException;



	/**
	 * Retrieves the given document from the store.
	 *
	 * @param store the document store to access
	 * @param id the document id to get
	 * @param rev the document revision to get.  If null, the most recent revision of the document
	 * with the given id will be returned.
	 *
	 * @return A stored document object containing all the available information about the document
	 * including the stored data itself.
	 *
	 * @throws DocumentNotFoundException when the requested store, id, revision combination does
	 * not point to a stored document.
	 */
	public StoredDocument getDocument( String store, String id, String rev )
		throws DocumentNotFoundException;

	
	
	/**
	 * Removes and returns the given document from the store.
	 *
	 * @param store the document store to access
	 * @param id the document id to get
	 * @param rev the document revision to get.  If null, the most recent revision of the document
	 * with the given id will be returned.
	 *
	 * @return A stored document object containing all the available information about the document
	 * including the stored data itself, or null if not found
	 */
	public StoredDocument removeDocument(String storeName, String id, String rev);
	
}
