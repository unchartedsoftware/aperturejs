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

import oculus.aperture.cms.ContentServiceTest;

import org.junit.After;
import org.junit.Before;
import org.junit.Ignore;
import org.lightcouch.CouchDbClient;

/**
 * Concrete test for couchdb implementation.
 *
 * Marked as "ignore" so that the test doesn't run on machines without a couchdb
 * install
 *
 * @author rharper
 *
 */

@Ignore("requires a couchdb installation running locally")
public class CouchDbCacheCmsServiceTest extends ContentServiceTest {

	@Before
	public void setup() {
		service = new CouchDbCmsService();
	}

	@After
	public void tearDown() {
		service = null;

		// Remove db now that test is done
		CouchDbClient db = new CouchDbClient("mystore", true, "http", "localhost", 5984, null, null);
		db.context().deleteDB("mystore", "delete database");
	}


	// TODO Any additional couch-specific tests

}
