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
module('core.io');


// test('aperture server url is properly resolved', function() {
// });

test('get options are properly set', function() {

	var stub = sinon.stub($, 'ajax');
	stub.yieldsTo("success", [1, 2, 3]);

	aperture.io.rest( '/uri', 'GET', function(){}, {
		params: {a:1, b:'b'}
	});

	var ajaxParams = stub.args[0][0];
	ok( ajaxParams.url.indexOf( document.location.protocol ) > -1, 'correct protocol set' );
	ok( ajaxParams.url.indexOf( document.location.host ) > -1, 'correct host set' );
	ok( ajaxParams.url.indexOf( '/uri' ) > -1, 'correct uri included' );

	deepEqual( ajaxParams.data, {a:1, b:'b'}, 'params are passed into the query');

	stub.restore();
});


test('success status payload has success flag set', function() {
	var stub = sinon.stub($, 'ajax');
	stub.yieldsTo("success", [1, 2, 3]);

	var resultSpy = sinon.spy();

	aperture.io.rest( 'uri', 'GET', resultSpy );

	ok( resultSpy.calledOnce, 'callback must be called' );
	deepEqual( resultSpy.args[0][0], [1,2,3], 'data payload is returned properly' );
	ok( resultSpy.args[0][1].success, 'data payload is returned properly' );

	stub.restore();
});

test('fail status payload has success flag unset', function() {

	// Setup fake XHR
	var xhr = sinon.useFakeXMLHttpRequest();
    var requests = [];

    xhr.onCreate = function (xhr) {
        requests.push(xhr);
    };

    var resultSpy = sinon.spy();
    aperture.io.rest( 'uri', 'GET', resultSpy );

    equals(requests.length, 1, 'One request made');

    requests[0].respond(404, { "Content-Type": "application/json" },
                             '{"reason": "missing"}');

    ok( resultSpy.calledWith( {reason: "missing"} ), 'error response data provided' );
    equal( resultSpy.args[0][1].success, false, 'success should be false' );

    xhr.restore();
});
