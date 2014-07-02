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

import static org.junit.Assert.*;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.DocumentNotFoundException;
import oculus.aperture.spi.store.ContentService.Document;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;
import oculus.aperture.spi.store.ContentService.StoredDocument;

import org.junit.Test;

/**
 * Abstract test cases for the ContentService interface.  Must be subclassed and a instance
 * of ContentService provided before each test.
 *
 * TODO Suffers from distinct lack of DRY
 *
 * TODO Add tests for different stores
 *
 *
 * @author rharper
 *
 */
public abstract class ContentServiceTest {

	protected ContentService service;


	@Test
	public void testCreateDocumentReturnsGoodObject() {
		// Check we get a non-null document
		Document doc1 = service.createDocument();
		assertNotNull(doc1);

		// Check we get unique documents on each call
		Document doc2 = service.createDocument();
		assertNotSame(doc1, doc2);
	}



	@Test
	public void testStoreAndRetreiveNewDocumentAutoId() {
		// Create a document
		Document docIn = service.createDocument();
		docIn.setDocument("Hello!".getBytes());
		docIn.setContentType("text/plain");
		docIn.setEncoding("UTF-8");

		// Store it
		DocumentDescriptor desc;
		try {
			desc = service.storeDocument(docIn, "mystore", null, null);
		} catch (ConflictException e) {
			fail("Received a conflict exception when storing a document without an id");
			return;
		}

		// Check that a valid descriptor is returned
		assertNotNull(desc.getId());
		assertNotNull(desc.getRevision());
		assertEquals("mystore", desc.getStore());

		// Try to get the document
		// Get the newest version
		StoredDocument docOut;
		try {
			docOut = service.getDocument("mystore", desc.getId(), null);
		} catch (DocumentNotFoundException e) {
			fail("Should have been able to find the document.");
			return;
		}

		// Ensure information is the same
		assertArrayEquals(docOut.getDocument(), docIn.getDocument());
		assertEquals(docOut.getContentType(), docIn.getContentType());

		// Get a specific version
		try {
			docOut = service.getDocument("mystore", desc.getId(), desc.getRevision());
		} catch (DocumentNotFoundException e) {
			fail("Should have been able to find the document.");
			return;
		}

		// Ensure information is the same
		assertArrayEquals(docOut.getDocument(), docIn.getDocument());
		assertEquals(docOut.getContentType(), docIn.getContentType());
	}



	@Test
	public void testStoreAndRetreiveNewDocumentGivenId() {
		// Create a document
		Document docIn = service.createDocument();
		docIn.setDocument("Hello Again!".getBytes());
		docIn.setContentType("text/plain");
		docIn.setEncoding("UTF-8");

		// Store it
		DocumentDescriptor desc;
		try {
			desc = service.storeDocument(docIn, "mystore", "id1", null);
		} catch (ConflictException e) {
			fail("Received a conflict exception when storing a document that shouldn't already exist");
			return;
		}

		// Check that a valid descriptor is returned
		assertEquals("id1", desc.getId());
		assertNotNull(desc.getRevision());
		assertEquals("mystore", desc.getStore());
	}


	@Test
	public void testStoreSecondVersionOfDocument() {
		// Create a document
		Document docIn = service.createDocument();
		docIn.setDocument("Version 1".getBytes());
		docIn.setContentType("text/plain");
		docIn.setEncoding("UTF-8");

		// Store it
		DocumentDescriptor desc;
		try {
			desc = service.storeDocument(docIn, "mystore", null, null);
		} catch (ConflictException e) {
			fail("Received a conflict exception when storing a document without an id");
			return;
		}

		// Create a document
		Document doc2 = service.createDocument();
		doc2.setDocument("Version 2".getBytes());
		doc2.setContentType("text/plain");
		doc2.setEncoding("UTF-8");

		// Store it
		DocumentDescriptor desc2;
		try {
			desc2 = service.storeDocument(doc2, "mystore", desc.getId(), desc.getRevision());
		} catch (ConflictException e) {
			fail("Received a conflict exception when storing a document given the correct revision + id");
			return;
		}

		// Should have the same id
		assertEquals(desc.getId(), desc2.getId());

		// Should not have the same revision
		assertFalse( desc.getRevision().equals(desc2.getRevision()) );

		// Make sure we get back the latest version when not passed the revision
		StoredDocument docOut;
		try {
			docOut = service.getDocument("mystore", desc2.getId(), null);
		} catch (DocumentNotFoundException e) {
			fail("Should have been able to find the document.");
			return;
		}

		// Ensure we got the latest revision
		assertArrayEquals( doc2.getDocument(), docOut.getDocument() );
		// Ensure this doc has the expected revision
		assertEquals( desc2.getRevision(), docOut.getRevision() );


		// Make sure we get back the first version
		try {
			docOut = service.getDocument("mystore", desc.getId(), desc.getRevision());
		} catch (DocumentNotFoundException e) {
			fail("Should have been able to find the document.");
			return;
		}

		// Ensure we got the first revision
		assertArrayEquals( docIn.getDocument(), docOut.getDocument() );
		// Ensure this doc has the expected revision (the first one)
		assertEquals( desc.getRevision(), docOut.getRevision() );

	}



	@Test(expected=ConflictException.class)
	public void testGetConflictIfWrongRevision() throws ConflictException {
		// Create a document
		Document docIn = service.createDocument();
		docIn.setDocument("Version 1".getBytes());
		docIn.setContentType("text/plain");
		docIn.setEncoding("UTF-8");

		// Wrap in try catch because we DON'T expect a conflict here
		DocumentDescriptor desc;
		try {
			desc = service.storeDocument(docIn, "mystore", "id2", null);

			// Store a second time, use the rev from the first store
			service.storeDocument(docIn, "mystore", "id2", desc.getRevision());
		} catch (ConflictException e) {
			fail("Received a conflict exception when storing a document for the first time");
			return;
		}

		// Expect an exception here
		service.storeDocument(docIn, "mystore", "id2", desc.getRevision());
	}


	@Test
	public void testUpdateMissingIdAndGiveRevGivesConflict() throws ConflictException {
		// Create a document
		Document docIn = service.createDocument();
		docIn.setDocument("Version 1".getBytes());
		docIn.setContentType("text/plain");
		docIn.setEncoding("UTF-8");

		// Wrap in try catch because we DON'T expect a conflict here
		try {
			DocumentDescriptor desc = service.storeDocument(docIn, "mystore", "missingId", "1-c44fb12a2676d481d235523092e0cec4");
			assertNull("A descriptor must not be returned, the document with this revision doesn't exist", desc );
		} catch (Exception e) {
			// An exception about a missing doc is ok here
		}
	}


	@Test(expected=DocumentNotFoundException.class)
	public void testNoDocumentShouldBeFound() throws DocumentNotFoundException {
		// Get a document that shouldn't exist
		service.getDocument("mystore", "missingId", null);
	}



	@Test(expected=DocumentNotFoundException.class)
	public void testNoDocumentShouldBeFoundWithRevision() throws DocumentNotFoundException {
		// Get a document that shouldn't exist
		service.getDocument("mystore", "missingId", "someRevision");
	}
}
