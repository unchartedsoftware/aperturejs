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
module('Scalar');

test('undefined scalar ranges behave without exception', function() {

	expect(6);

	var range = new aperture.Scalar('my range');

	equal(range.get(), undefined, 'getting an undefined range returns undefined');

	// check all views
	equal(range.symmetric().get(), undefined, 'getting a symmetric view of an undefined range returns undefined')
	equal(range.absolute().get(), undefined, 'getting an abs view of an undefined range returns undefined')

	// reset and run again
	range.expand([3, 2]).reset();
	equal(range.get(), undefined, 'getting a reset range returns undefined');

	// check all views
	equal(range.symmetric().get(), undefined, 'getting a symmetric view of a reset range returns undefined')
	equal(range.absolute().get(), undefined, 'getting an abs view of a reset range returns undefined')
});


test('expanding the scalar leads to expected range extents', function() {
	expect(6);

	var range = new aperture.Scalar( 'my range', [4, 9, -3, 20, 16] );
	deepEqual( range.get(), [-3,20], 'the range is properly calculated on construction');

	// Extend the max
	range.expand(60);
	deepEqual( range.get(), [-3,60], 'max is expanded, min is untouched');

	// expand by values that shouldn't expand it
	range.expand([5, 1, 0, 45, 13]);
	deepEqual( range.get(), [-3,60], 'neither min nor max should be changed');

	range.expand([-10, 100]);
	deepEqual( range.get(), [-10,100], 'extension via an array expands as expected');

	// Start over, this time don't initialize with anything
	var range = new aperture.Scalar( 'my range' );
	equal(range.get(), undefined, 'getting an undefined range returns undefined');

	range.expand([1.5, 1.1, 0.9, 4.5, 13.4]);
	deepEqual( range.get(), [0.9,13.4], 'extension of empty range expands as expected');
});


test('scalar range can handle numbers represented as strings', function() {
	expect(2);

	var range = new aperture.Scalar( 'my range', [4, '9', -3, '20', 16] );
	deepEqual( range.get(), [-3,20], 'the range is properly calculated using strings');

	range.expand('89');
	deepEqual( range.get(), [-3,89], 'only the max is affected');
});


test('symmetric makes the range span zero', function() {
	expect(3);

	var base = new aperture.Scalar( 'my range', [-5, 10] )
	var range = base.symmetric();
	deepEqual( range.get(), [-10,10], 'symmetric properly used maximum value');

	// Now make the minimum abs bigger
	range.expand(-45);
	deepEqual( range.get(), [-45,45], 'symmetric properly used minimum value');

	deepEqual( base.get(), [-45,10], 'symmetric did not modify the underlying range');
});

test('abs makes the range values absolute magnitude from zero', function() {
	expect(3);

	var base = new aperture.Scalar( 'my range', [-5, 10] )
	var range = base.absolute();
	deepEqual( range.get(), [0,10], 'abs properly handled a positive maximum value');

	// Now make the minimum abs bigger
	range.expand(-45);
	deepEqual( range.get(), [0,45], 'abs properly handled a negative maximum value');

	deepEqual( base.get(), [-45,10], 'abs did not modify the underlying range');
});

test('log produces a range view that can also handle zero or near zero as well as negatives', function() {
	expect(10);

	// note that log creates slight precision problems that gives qunit trouble.
	// use integer orders for tests.

	// a typical positive log range
	var range = new aperture.Scalar( 'my range', [10, 100000] ).logarithmic(1);
	equal( range.map(100), 0.25, 'a positive log range maps correctly');
	equal( range.map(0.01), 0, 'a positive log range maps near zeros correctly');
	equal( range.map(0), 0, 'a positive log range maps zeros correctly');

	// a log range that dips below the absolute minimum configured (which was 1 configured in view above).
	range.reset([0, 100000]);
	equal( range.map(0), 0, 'a positive log range clamps to the minimum correctly');
	equal( range.map(10), 0.2, 'a positive log range maps correctly when a minimum is in effect');

	// a symmetric log range
	range.reset([-100000, 100000]);
	equal( range.map(10), 0.6, 'a spanning log range maps positives correctly');
	equal( range.map(-10), 0.4, 'a spanning log range maps negatives correctly');
	equal( range.map(0.1), 0.5, 'a spanning log range maps near zero values correctly');

	// a negative log range
	range.reset([-100000, -10]);
	equal( range.map(-100), 0.75, 'a negative log range maps correctly');
	equal( range.map(-0.1), 1, 'a negative log range maps near zero correctly');
});

test('complex view derivations work properly', function() {
	expect(9);

	var base = new aperture.Scalar( 'my range', [-5, 9.7] )
	var abs = base.absolute();

	var absRound = abs.banded();
	var test = absRound.get();
	equal( test[0].min, 0, 'abs and banded formed a view chain properly');
	equal( test[0].limit, 10, 'abs and banded formed a view chain properly');

	var absSymmetric = abs.symmetric();
	deepEqual( absSymmetric.get(), [-9.7,9.7], 'abs and symmetric formed a view chain properly');

	test = absRound.get();
	equal( test[0].min, 0, 'deriving a second view of the abs view left the base view intact');
	equal( test[0].limit, 10, 'deriving a second view of the abs view left the base view intact');

	var absSymmetricRound = absSymmetric.banded();
	test = absSymmetricRound.get()
	equal( test[0].min, -10, 'abs, symmetric, and round formed a view chain properly');
	equal( test[1].limit, 10, 'abs, symmetric, and round formed a view chain properly');

	// Now make the minimum abs bigger
	absSymmetric.expand(-45);
	test = absSymmetricRound.get()
	equal( test[0].min, -50, 'a change in base range properly carried through multiple views');
	equal( test[1].limit, 50, 'a change in base range properly carried through multiple views');
});

test('auto banding creates rounded bands of appropriate number', function() {

	expect(12);

	var scalar, banded, bands;

	// these are based on the results we're seeing and are designed to look for
	// change, not necessarily errors.

	scalar = new aperture.Scalar('mittens', [-3.4, 7.2]);
	banded = scalar.banded(5);
	bands = banded.get();

	equal( bands.length,  3, 'the approximate number of bands was as expected' );
	equal( bands[0].min, -5, 'the bands begin at the approximate right round number' );
	equal( bands[2].limit, 10, 'the bands end at the approximate right round number' );

	bands = banded.reset([3.4, 7.2]).get();
	equal( bands.length,  5, 'again, the approximate number of bands was as expected' );
	equal( bands[0].min, 3, 'again, the bands begin at the approximate right round number' );
	equal( bands[4].limit, 8, 'again, the bands end at the approximate right round number' );

	banded = scalar.banded(5, false);
	bands = banded.get();

	equal( bands.length,  5, 'when not rounded, the approximate number of bands was as expected' );
	equal( bands[0].min, -Number.MAX_VALUE, 'when not rounded, the min of the bottom band is -max' );
	equal( bands[4].limit, Number.MAX_VALUE, 'when not rounded, the limit of the top band is max' );

	banded = scalar.banded({ span: .5 });
	bands = banded.get();

	equal( bands.length,  9, 'when specifying band span, the approximate number of bands was as expected' );
	equal( bands[0].min, 3, 'when specifying band span, the bands begin at the approximate right round number' );
	equal( bands[8].limit, 7.5, 'when specifying band span, the bands end at the approximate right round number' );
});

test('bands map correctly', function() {

	expect(8);

	var scalar, banded, bands;

	// these are based on the results we're seeing and are designed to look for
	// change, not necessarily errors.

	scalar = new aperture.Scalar('mittens', [-2.5, 7.5]);
	banded = scalar.banded(5, false);

	equal( banded.map(2.5), .5, 'an unrounded auto range mapped to the right number' );

	banded = scalar.banded(3); // creates -5 to 10.
	equal( banded.map(2.5), .5, 'a rounded auto range mapped to the right number' );

	// negative, zero, positive.
	banded = scalar.banded([{limit: 0},{min:0},{min: Number.MIN_VALUE}]);
	equal( banded.map(2.5), .5, 'an unbounded rounded set range mapped to the right number' );

	banded = scalar.banded([{min: -5},{min:0},{min: 5, limit: 10}]);
	equal( banded.map(2.5), .5, 'a bounded rounded set range mapped to the right number' );

	banded = scalar.banded([{min: -5},{min:0},{min: 5, limit: 10}], false);
	equal( banded.map(2.5), .5, 'a bounded unrounded set range mapped to the right number' );

	scalar.reset([1, 5]);
	equal( banded.map(3), .5, 'a reduced unrounded set range mapped to the right number' );

	banded = scalar.banded([{min: -5},{min:0},{min: 5, limit: 10}]);
	equal( banded.map(2.5), .5, 'a reduced rounded set range mapped to the right number' );

	banded = new aperture.Ordinal('snakes', ['milk', 'corn', 'boa', 'python']).banded();
	equal( banded.map('boa'), .5, 'a banded ordinal mapped to the right number' );

	// debug - inspect contents
//	deepEqual( banded.get(), {}, 'the invalid test failed as expected');

});

test('banded views can be derived correctly from other banded views', function() {

	expect(6);

	var scalar, banded, bands;

	// these are based on the results we're seeing and are designed to look for
	// change, not necessarily errors.

	scalar = new aperture.Scalar('mittens', [-3.4, 7.2]);
	banded = scalar.banded(5);
	var banded2 = banded.banded(25);

	bands = banded.get();

	equal( bands.length,  3, 'the approximate number of 1st order bands was as expected' );
	equal( bands[0].min, -5, 'the 1st order bands begin at the approximate right round number' );
	equal( bands[2].limit, 10, 'the 1st order bands end at the approximate right round number' );

	bands = banded2.get();

	equal( bands.length,  15, 'the approximate number of 2nd order bands was as expected' );
	equal( bands[0].min, -5, 'the 2nd order bands begin at the approximate right round number' );
	equal( bands[1].min, -4, 'the 2nd order bands end at the approximate right round number' );

});

test('mapping from scalar range to numbers yields expected', function() {
	expect(11);

	var range = new aperture.Scalar( 'my range', [0, 10] );
	var mapping = range.mapKey([0,100]);
	equal( mapping.map(5), 50, 'mapping yields expected value');
	equal( mapping.map(0), 0, 'mapping yields expected value');
	equal( mapping.map(10), 100, 'mapping yields expected value');

	// Check beyond from range extents
	equal( mapping.map(-60), 0, 'mapping from less than minimum yields "to" minimum');
	equal( mapping.map(99), 100, 'mapping from more than maximum yields "to" maximum');

	// type stuff.
	equal( mapping.type(), 'linear', 'default ordinal mapping type is linear' );
	equal( mapping.type('area').map(2.5), 50, 'mapping to area yields expected value.' );

	// symmetric tests
	range.reset([-10,10]);
	mapping = range.mapKey([-100,0,100]);
	equal( mapping.map(-5), -50, 'mapping symmetric value yields expected value');

	// no span test
	range.reset([1,1]);
	equal( mapping.map(1), -100, 'when the range span is zero, we map to the bottom of the visual range without a divide by zero issue');

	// numeric conversion tests.
	range.reset(['-10', '10']);
	equal( mapping.map('-5'), -50, 'normal scalars can map strings');

	range.reset([new Date('October 6, 2000'), new Date('October 10, 2000')]);
	equal( mapping.map(new Date('October 7, 2000')), -50, 'normal scalars can map dates');

});

test('scalar with number format formats precision correctly', function() {
	expect(2);

	var range = new aperture.Scalar( 'test' );

	range.formatter( aperture.Format.getNumberFormat(0.01) );
	equal( range.format(3.678), '3.68', 'number format rounds decimals correctly');

	range.formatter( aperture.Format.getNumberFormat(10) );
	equal( range.format(3678), '3,680', 'number format rounds bigger numbers correctly');

});


//TODO Add mapping test for colors

/**
 * TimeScalar Tests
 */

module('TimeScalar');

test('time scalars correctly map dates and times', function() {
	expect(2);

	var range = new aperture.TimeScalar( 'my range', [new Date('October 6, 2000'), new Date('October 10, 2000')] );
	var mapping = range.mapKey([0, 100]);
	var date = new Date('October 7, 2000');

	equal( mapping.map(date), 25, 'time scalars can map dates');
	equal( mapping.map(date.getTime()), 25, 'time scalars can map times');

});

test('time scalars band as expected', function() {
	expect(8);

	var range = new aperture.TimeScalar( 'my range',
			[new Date('October 6, 2000 7:20:00 UTC'), new Date('October 9, 2000 18:15:15 UTC')] );

	var view = range.banded(4);
	var date = new Date('October 7, 2000 UTC');

	equal( view.get()[0].min, new Date('October 6, 2000 UTC').getTime(), 'time scalars round left side nicely for days');
	equal( view.get()[view.get().length-1].limit, new Date('October 10, 2000 UTC').getTime(), 'time scalars round right side nicely for days');
	equal( view.map(date), 0.25, 'time scalars band and map to days as expected');

	range.reset([new Date('Jan 1, 2006 7:20:00 UTC'), new Date('Jan 1, 2010 UTC')]);
	equal( view.get()[0].min, new Date('Jan 1, 2006 UTC').getTime(), 'time scalars round left side nicely for years');

	range.reset([new Date('Jan 1, 1971 UTC'), new Date('Jan 1, 2010 UTC')]);
	equal( view.get()[0].min, new Date('Jan 1, 1970 UTC').getTime(), 'time scalars round left side nicely for decades');

	range.reset([new Date('Jan 1, 2006 7:22:00 UTC'), new Date('Jan 1, 2006 7:40:00 UTC')]);
	equal( view.get()[0].min, new Date('Jan 1, 2006 7:20:00 UTC').getTime(), 'time scalars round left side nicely for minutes');

	view = range.banded({units: 'Minutes', span: 5});
	equal( view.get().length, (40-20)/5, 'when using specific span, the expected number of bands are created');

	view = range.banded({units: 'Minutes', span: 1});
	equal( view.get().length, 40-22, 'when using specific span without units, the expected number of bands are created');

});

test('time scalars format dates and times correctly', function() {
	expect(4);

	var range = new aperture.TimeScalar( 'my range', [new Date('October 6, 2000 UTC'), new Date('October 10, 2000 UTC')] );
	var date = new Date('October 7, 2000 UTC');

	equal( range.format(date).match(/Oct/).length, 1, 'Default formatter formats dates in default manner.');
	equal( range.format(date.getTime()).match(/Oct/).length, 1, 'Default formatter formats times in default manner.');

	var view = range.banded(4);

	equal( view.format(view.get()[0].min), 'Oct 6', 'Band date labels are formatted as expected.');

	range.reset([new Date('Jan 1, 2006 7:22:00 UTC'), new Date('Jan 1, 2006 7:40:00 UTC')]);
	equal( view.format(view.get()[0].min), '7:20am', 'Band time labels are formatted as expected.');

});

/**
 * Ordinal Tests
 */

module('Ordinal');

test('undefined ordinal range behaves without exception', function() {

	expect(2);

	var range = new aperture.Ordinal('my range');

	deepEqual(range.get(), [], 'getting an uninitialized range returns empty array');

	// fill and reset
	range.expand('test').reset();

	// then test again.
	deepEqual(range.get(), [], 'getting a reset range returns empty array');
});


test('expanding an ordinal range properly handles duplicates and expand order', function() {

	expect(5);

	var range = new aperture.Ordinal('my range', ['A', 'B']);

	deepEqual(range.get(), ['A','B'], 'ordinal is as initialized');

	// Test array expand
	range.expand(['B','A']);
	deepEqual(range.get(), ['A','B'], 'ordinal does not have duplicates');

	range.expand(['B','C','D','D','C','A']);
	deepEqual(range.get(), ['A','B','C','D'], 'ordinal only adds new values and is in order');

	// Test single element expand
	range.expand('last');
	deepEqual(range.get(), ['A','B','C','D','last'], 'adding single value adds to end');

	range.expand('A');
	deepEqual(range.get(), ['A','B','C','D','last'], 'adding single duplicate value does nothing');
});


test('expanding an ordinal range properly handles duplicates and expand order', function() {

	expect(3);

	var range = new aperture.Ordinal('my range', ['A', 'B', 'C', 'D']);

	// Test array expand
	range.revoke('B');
	deepEqual(range.get(), ['A', 'C', 'D'], '"B" is properly revoked from the range');

	range.revoke(['C','A']);
	deepEqual(range.get(), ['D'], '"A" and "C" are properly revoked from the range');

	range.expand('A');
	deepEqual(range.get(), ['D','A'], '"A" is added back to the end of the range');
});


test('mapping from ordinal range to array of values yields expected mapping', function() {
	expect(8);

	var range = new aperture.Ordinal( 'my range', ['a','b','c','d','e'] );
	var mapping = range.mapKey(['x','y','z']);
	equal( mapping.map('a'), 'x', 'mapping yields expected value');
	equal( mapping.map('b'), 'y', 'mapping yields expected value');
	equal( mapping.map('c'), 'z', 'mapping yields expected value');
	equal( mapping.map('d'), 'x', 'mapping wraps around to domain and yields expected value');
	equal( mapping.map('e'), 'y', 'mapping wraps around to domain and mapping yields expected value');

	// Check values not in range
	equal( mapping.map('m'), 'z', 'mapping outside of range automatically adds it');

	equal( mapping.type(), 'ordinal', 'ordinal mapping type is ordinal' );
	equal( mapping.type( function( value ) { return value; } ).type(), 'ordinal', 'setting an ordinal mapping type has no effect.' );

});

