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
module('core.log');

test('defaults are properly set', function() {

	equal( aperture.log.level(), aperture.log.LEVEL.INFO, 'default level is info' );

	equal( aperture.log.appenders().length, 0, 'no appenders by default' );
});


test('level api method gets and sets properly', function() {
	var original = aperture.log.level();
	ok( original, 'the original log level is something' );

	var oldLevel = aperture.log.level( aperture.log.LEVEL.ERROR );
	equal( oldLevel, original, 'upon set, the original level is returned' );

	var newLevel = aperture.log.level();
	equal( newLevel, aperture.log.LEVEL.ERROR, 'the new level was correctly set' );

	// Clean up
	aperture.log.level( original );
});


test('global log level is respected', function() {
	// Make a spy appender
	var spy = sinon.spy();
	aperture.log.addAppender(spy);

	var oldLevel = aperture.log.level( aperture.log.LEVEL.INFO );
	aperture.log.debug( 'should not be logged' );

	equal( spy.callCount, 0, 'zero log messages should be logged' );

	// Clean up
	aperture.log.removeAppender(spy);
	aperture.log.level(oldLevel);
});


test('log messages are properly formatted', function() {
	// Make a spy appender
	var dummyAppender = new aperture.log.Appender();

	var spy = sinon.spy(dummyAppender, 'logString');

	aperture.log.addAppender(dummyAppender);
	aperture.log.error( '{1} {0} {2}', 10, 'i like', ['a','b']);

	ok( spy.calledWithExactly(aperture.log.LEVEL.ERROR, 'i like 10 a,b'), 'message is formatted as expected' );

	// Clean up
	aperture.log.removeAppender(dummyAppender);
});


test('logged objects are all passed to the appender', function() {
	// Make a spy appender
	var dummyAppender = new (aperture.log.Appender.extend({
		logObjects : function() {}
	}));

	var spy = sinon.spy(dummyAppender, 'logObjects');

	aperture.log.addAppender(dummyAppender);
	aperture.log.error( 10, {message:true}, ['a','b']);

	ok( spy.calledWithExactly(aperture.log.LEVEL.ERROR,
			[10, {message:true}, ['a','b']]), 'all objects passed through as arguments' );

	// Clean up
	aperture.log.removeAppender(dummyAppender);
});
