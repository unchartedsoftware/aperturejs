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
/**
 * Scalar Tests
 */
module('filter');

test('conditional filters only apply when they should', function() {

	expect(6);

	var makeBigBigger = aperture.filter.conditional(
		function(value) { return value >= 1000; },
		aperture.filter.scale( 2 )
	);

	equal(makeBigBigger(5), 5, 'value unchanged when filter does not meet condition');
	equal(makeBigBigger(999), 999, 'value unchanged when filter does not meet condition');
	equal(makeBigBigger(1000), 2000, 'value changed when filter meets condition');
	equal(makeBigBigger(4000), 8000, 'value changed when filter meets condition');


	var checkSecondParam = aperture.filter.conditional(
			function(value, test) { return test; },
			aperture.filter.scale( 10 )
		);

	equal(checkSecondParam(5, false), 5, 'value unchanged when filter does not meet condition');
	equal(checkSecondParam(5, true), 50, 'value changed when filter meets condition');
});
