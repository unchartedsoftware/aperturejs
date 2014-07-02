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
module('class');

test('views can be created on class', function() {

	expect(4);

	var Base = aperture.Class.extend( {
		init : function() {
			this.a = 1;
		},

		getA : function() {
			return this.a;
		}
	});


	Base.addView( 'aPlusOne', {
		getA : function() {
			return this._base.getA() + 1;
		}
	});

	var base = new Base();
	equal(base.getA(), 1, 'getter begins by getting the right value');

	ok( base.aPlusOne, 'view creation method exists');

	var view = base.aPlusOne();
	equal(base.getA(), 1, 'base still gets the right value');
	equal(view.getA(), 2, 'view gets modified value');
});


test('views have an init function that runs', function() {

	expect(3);

	var Base = aperture.Class.extend( {
		init : function() {
			this.a = 1;
		},

		getA : function() {
			return this.a;
		}
	});


	Base.addView( 'aPlusOne', {
		init : function( value ) {
			this.b = value;
		},

		getA : function() {
			return this._base.getA() + 1;
		}
	});

	var base = new Base();
	var view = base.aPlusOne(10);
	equal(view.b, 10, 'views init function called and new field assigned');
	ok(!base.b, 'base does not get view\'s field');
	equal(view.getA(), 2, 'view gets modified value');
});


test('views also carry down to subclasses', function() {

	expect(7);

	var Base = aperture.Class.extend( {
		init : function() {
			this.a = 1;
			this.b = 2;
		},

		getA : function() {
			return this.a;
		}
	});

	Base.addView( 'aPlusOne', {
		getA : function() {
			return this._base.getA() + 1;
		}
	});

	var Sub = Base.extend( {
		getA : function() {
			// Returns base
			return Base.prototype.getA.call(this) + 10;
		}
	});

	Sub.addView( 'aTimesTwo', {
		getA : function() {
			return this._base.getA() * 2;
		}
	});


	var base = new Base();
	ok( base.aPlusOne, 'view creation method exists');
	ok( !base.aTimesTwo, 'view creation method from subclass does not exist');

	var sub = new Sub();
	ok( sub.aPlusOne, 'base class\'s view creation method exists on the subclass');
	ok( sub.aTimesTwo, 'view creation method exists on the subclass');
	equal(sub.getA(), 11, 'Subclass calls subbed getA which calls base');

	var view1 = sub.aPlusOne();
	equal(view1.getA(), 12, 'Base.view of sub first calls view, then sub then base');

	var view2 = sub.aTimesTwo();
	equal(view2.getA(), 22, 'Sub.view of sub first calls view, then sub, then base');
});

test('view type checking works correctly', function() {

	expect(11);

	var Base = aperture.Class.extend( 'Base', {
		init : function() {
			this.a = 1;
		},

		getA : function() {
			return this.a;
		}
	});
	
	var Extended = Base.extend( 'Extended', {
	});


	Extended.addView( 'aPlusOne', {
		getA : function() {
			return this._base.getA() + 1;
		}
	});

	var viewOfExtended = new Extended().aPlusOne();
	
	equal(viewOfExtended.typeOf('Extended'), true, 'check for extended type works');
	equal(viewOfExtended.typeOf(/extended/i), true, 'check for extended type works using a regular expression');
	equal(viewOfExtended.typeOf('Base'), true, 'check for base type works');
	equal(viewOfExtended.typeOf(/class/i), true, 'check for root class type works using a regular expression');
	equal(viewOfExtended.typeOf('Extended.prototype.aPlusOne'), true, 'check for view type works');
	equal(viewOfExtended.typeOf(/aPlusOne/), true, 'check for view type works using a regular expression');
	equal(viewOfExtended.typeOf(Extended), true, 'check for extended type works using prototype');
	equal(viewOfExtended.typeOf(Base), true, 'check for base type works using prototype');
	equal(viewOfExtended.typeOf(Extended.prototype.aPlusOne), true, 'check for view type works using prototype');
	equal(viewOfExtended.typeOf('Other'), false, 'check for other type fails as expected');
	equal(viewOfExtended.typeOf(aperture.Scalar), false, 'check for other type fails as expected using prototype');
	
});


