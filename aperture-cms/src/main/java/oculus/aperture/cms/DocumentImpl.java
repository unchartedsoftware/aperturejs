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

import oculus.aperture.spi.store.ContentService.Document;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;
import oculus.aperture.spi.store.ContentService.StoredDocument;

/**
 * Basic implementation of the Document, DocumentDescriptor,
 * and StoredDocument interfaces all in one.
 *
 * @author rharper
 *
 */
public class DocumentImpl implements StoredDocument, DocumentDescriptor, Document {

	private final String id;
	private final String rev;
	private final String store;
	private String encoding;
	private String contentType;
	private byte[] data;


	public DocumentImpl() {
		this(null,null,null,null,null,null);
	}

	public DocumentImpl(String id, String rev, String store) {
		this(id, rev, store, null, null, null);
	}

	public DocumentImpl(String id, String rev, String store, String encoding, String contentType, byte[] data) {
		this.id = id;
		this.rev = rev;
		this.store = store;
		this.encoding = encoding;
		this.contentType = contentType;
		this.data = data;
	}

	public String getId() {
		return id;
	}

	public String getRevision() {
		return rev;
	}

	public String getStore() {
		return store;
	}

	public String getContentType() {
		return contentType;
	}

	public void setContentType(String contentType) {
		this.contentType = contentType;
	}

	public String getEncoding() {
		return encoding;
	}

	public void setEncoding(String encoding) {
		this.encoding = encoding;
	}

	public byte[] getDocument() {
		return data;
	}

	public void setDocument(byte[] data) {
		this.data = data;
	}

}
