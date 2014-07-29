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
module('core.config');

test('registered object gets provided config', function() {

	var spy = sinon.spy();

	aperture.config.register('test', spy);

	aperture.config.provide({ notTest:{cantSeeMe:true} });
	ok( spy.called == false, 'registered object not called because requested config block not provided');

	var config = { test:{seeMe:true} };
	aperture.config.provide(config);
	ok( spy.calledWithExactly({ test:{seeMe:true} }), 'registered object called with config containing indentified config block');

	// Reset
	aperture.config.provide(null);
});


test('callback called when config already exists', function() {
	var config = { test:{seeMe:true} };
	aperture.config.provide(config);

	var spy = sinon.spy();
	aperture.config.register('test', spy);

	ok( spy.calledWithExactly(config), 'registered object called with config containing indentified config block');

	// Reset
	aperture.config.provide(null);
});


test('multiple objects registered for same block all get called', function() {

	var spy1 = sinon.spy();
	aperture.config.register('test', spy1);

	var spy2 = sinon.spy();
	aperture.config.register('test', spy2);

	var config = { test:{seeMe:true} };
	aperture.config.provide(config);

	ok( spy1.calledWithExactly(config), 'first listener provided config');
	ok( spy2.calledWithExactly(config), 'second listener provided config');

	// Reset
	aperture.config.provide(null);
});


test('config get returns current config', function() {
	var config = { test:{seeMe:true} };
	aperture.config.provide(config);

	equal( aperture.config.get(), config, 'current config is provided');

	// Reset
	aperture.config.provide(null);
});
