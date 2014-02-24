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
module('Mapping');

/* ----------------------------------------------------------------------------
 * Mapping Tests
 */
test('field mappings (non-indexed)', function() {

	expect(4);

	var data = {
			a : 1,
			b : {
				c : 2,
				d : {
					e: 3,
					f: [1,2,3,4]
				}
			}
		};

	var layer = new aperture.Layer();

	layer.map('a').from('a');
	equal(layer.valueFor( 'a', data, -1 ), 1, 'field one deep');

	layer.map('c').from('b.c');
	equal(layer.valueFor( 'c', data, -1 ), 2, 'field two deep');

	layer.map('e').from('b.d.e');
	equal(layer.valueFor( 'e', data, -1 ), 3, 'field three deep');

	layer.map('f').from('b.d.f.length');
	equal(layer.valueFor( 'f', data, -1 ), 4, 'length of array field');
});

test('simple indexed field mapping', function() {

	expect(1);

	var data = {
			series: [5,4,3,2,1],
		};

	var layer = new aperture.Layer();

	layer.map('a').from('series[]');
	equal(layer.valueFor( 'a', data, -1, 3 ), 2, 'getting an indexed field');
});


test('complex single index-mapping', function() {

	expect(2);

	var layer = new aperture.Layer();

	// One array
	var data = {
		d: [ {x:1,y:{a:2}}, {x:3,y:{a:4}} ]
	};
	layer.map('x').from('d[].x');
	equal(layer.valueFor( 'x', data, -1, 0 ), 1, 'getting a field within an indexed object');

	layer.map('y').from('d[].y.a');
	equal(layer.valueFor( 'y', data, -1, 1 ), 4, 'getting a field within an object within an indexed object');

});


test('complex multi index-mapping', function() {

	expect(2);

	var layer = new aperture.Layer();

	// Two arrays composed of objects
	var data = {
			d: [ {
				data : [1,2],
				another: {
					value: [5,6]
				}
			}, {
				data:[3,4],
				another: {
					value: [7,8]
				}
			} ]
		};
	layer.map('data').from('d[].data[]');
	equal(layer.valueFor( 'data', data, -1, 0, 1 ), 2, 'value in a double-indexed array');

	layer.map('value').from('d[].another.value[]');
	equal(layer.valueFor( 'value', data, -1, 1, 0 ), 7, 'nested value in a double-indexed array');
});


test('arrays within arrays mapping', function() {

	expect(2);

	var layer = new aperture.Layer();

	// Array within array within array
	var data = {
		d : [
          [[1,2],[3,4]],
          [[4,5],[6,7],[8]],
          [[9,10,11]]
		]
	};
	layer.map('one').from('d[][]');
	deepEqual(layer.valueFor( 'one', data, -1, 0, 1 ), [3,4], 'two arrays deep');

	layer.map('two').from('d[][][]');
	equal(layer.valueFor( 'two', data, -1, 1, 1, 0 ), 6, 'three arrays deep');
});


test('constant mappings simple and array', function() {

	expect(2);

	var layer = new aperture.Layer();

	layer.map('a').asValue('hello');
	equal(layer.valueFor( 'a', null, -1 ), 'hello', 'simple constant mapping');

	layer.map('b').asValue([1,2,3]);
	deepEqual(layer.valueFor( 'b', null, -1 ), [1,2,3], 'array constant mapping');
});


test('bad mappings throw exceptions', function() {

	expect(2);

	var layer = new aperture.Layer();

	try {
		layer.map('a').from('bad*(identifier+function)');
	} catch (e) {
		ok(true,'Invalid characters in field identifier throws exception');
	}

	try {
		layer.map('a').from(7);
	} catch (e) {
		ok(true,'Non-string/function mapping from throws an exception');
	}
});


test('child layer mapping inherits parent layer mapping properties', function() {

	expect(6);

	var parent = new aperture.Plot('body');

	var aParent = parent.map('a');
	ok( aParent, 'Parent gets a valid mapping object');

	var parentMapping = new aperture.Scalar().mapKey([0,10]);
	aParent.using(parentMapping);

	var child = parent.addLayer( aperture.Layer );
	var aChild = child.map('a');
	ok( aChild, 'Child mapping is a valid object');
	notEqual( aChild, aParent, 'Child mapping should not be the same object as the parent mapping');

	equal( aChild.transformation, parentMapping, 'Child transformation inherited form parent');

	var mapping = new aperture.Scalar().mapKey([0,1]);
	aChild.using(mapping);
	equal( aChild.transformation, mapping, 'Child transformation is now specific to the child');

	equal( aParent.transformation, parentMapping, 'Parent transformation is untouched');

});



test('parent layer gets base mapping instance when child adds a mapping', function() {

	expect(3);

	var parent = new aperture.Plot('body');

	var child = parent.addLayer( aperture.Layer );

	var childMapping = child.map('a');
	ok( childMapping, 'Child mapping is a valid object');

	var parentMapping = parent.map('a');
	ok( parentMapping, 'Parent mapping is a valid object');

	var mapping = new aperture.Scalar().mapKey([0,1]);
	parentMapping.using(mapping);

	equal( childMapping.transformation, mapping, 'Child mapping inherits parent\'s value');
});




/* ----------------------------------------------------------------------------
 * Data Tests
 */
module('Layer');

test('child layer with same data as parent first render gets correct "add"', function() {

	expect(8);

	var a = {name:'a'},
		b = {name:'b'};

	// Setup parent
	var parent = new aperture.Plot('body');
	parent.all([a,b]);

	// Child under test
	var child = parent.addLayer( aperture.Layer );
	sinon.spy(child, "render");

	parent.all().redraw();

	ok(child.render.calledOnce, 'child render call must be called');

	equal(child.render.getCall(0).args[0].added.length, 2, 'must have two added contexts');
	// XXX Assumes order maintained
	equal(child.render.getCall(0).args[0].added[0].data, a, 'context must exist for data item a');
	equal(child.render.getCall(0).args[0].added[0].parent.data, a, 'context must have parent which is also a');

	equal(child.render.getCall(0).args[0].added[1].data, b, 'context must exist for data item b');
	equal(child.render.getCall(0).args[0].added[1].parent.data, b, 'context must have parent which is also b');

	equal(child.render.getCall(0).args[0].changed.length, 0, 'must have zero changed contexts');
	equal(child.render.getCall(0).args[0].removed.length, 0, 'must have zero removed contexts');

});


test('child layer with subselection of parent data first render gets correct "add"', function() {

	expect(6);

	var a = {values:['a','b']},
		b = {values:['c','d']};

	// Setup parent
	var parent = new aperture.Plot('body');
	parent.all([a,b]);

	// Child under test
	var child = parent.addLayer( aperture.Layer );
	// Subselect data
	child.all(function(parent) { return parent.values; });
	sinon.spy(child, "render");

	parent.all().redraw();

	ok(child.render.calledOnce, 'child render call must be called');

	equal(child.render.getCall(0).args[0].added.length, 4, 'must have four added contexts');
	// XXX Assumes order maintained
	equal(child.render.getCall(0).args[0].added[0].data, 'a', 'context must exist for data item "a"');
	deepEqual(child.render.getCall(0).args[0].added[0].parent.data, {values:['a','b']}, 'context must have parent which is [a,b]');

	equal(child.render.getCall(0).args[0].changed.length, 0, 'must have zero changed contexts');
	equal(child.render.getCall(0).args[0].removed.length, 0, 'must have zero removed contexts');

});



test('child layer with render after a data change', function() {

	expect(4);

	var a = {values:['a','b']},
		b = {values:['c','d']},
		data = [a,b];

	// Setup parent
	var parent = new aperture.Plot('body');
	parent.all(data);

	// Child under test
	var child = parent.addLayer( aperture.Layer );
	// Subselect data
	child.all(function(parent) { return parent.values; });
	sinon.spy(child, "render");

	parent.all().redraw();

	// Now, change the data and set it in again
	a.values[0] = 'x';
	parent.join(data);

	// Render again - owning vizlet doesn't know change occurred, just render
	parent.all().redraw();

	ok(child.render.calledTwice, 'child doRender call must be called twice');

	equal(child.render.getCall(0).args[0].added.length, 4, 'first call: must have four added contexts');

	equal(child.render.getCall(1).args[0].added.length, 1, 'second call: must have one added context (the changed data item)');
	equal(child.render.getCall(1).args[0].changed.length, 3, 'second call: must have three changed (the three untouched items)');

});



test('partial update: a child layer call to update only updates child layer', function() {

	expect(4);

	var a = {values:[{value:'a'},{value:'b'}]},
		b = {values:[{value:'c'},{value:'d'}]},
		data = [a,b];

	// Setup parent
	var parent = new aperture.Plot('body');
	parent.all(data);

	// Child under test
	var child = parent.addLayer( aperture.Layer );
	// Subselect data
	child.all(function(parent) { return parent.values; });

	// Get the first update out of the way
	parent.all().redraw();

	// --- end setup

	// Now make some partial updates
	sinon.spy(parent, "render");
	sinon.spy(child, "render");

	child.all().redraw();

	ok(parent.render.calledOnce, 'parent render called once');
	ok(child.render.calledOnce, 'child render called once');

	equal(parent.render.getCall(0).args[0].changed.length, 0, 'parent should not have changed data');
	equal(child.render.getCall(0).args[0].changed.length, 4, 'child data should have changed');
});


test('partial update: call to update one data item only updates that one', function() {

	expect(5);

	var a = {values:[{value:'a'},{value:'b'}]},
		b = {values:[{value:'c'},{value:'d'}]},
		data = [a,b];

	// Setup parent
	var parent = new aperture.Plot('body');
	parent.all(data);

	// Child under test
	var child = parent.addLayer( aperture.Layer );
	// Subselect data
	child.all(function(parent) { return parent.values; });

	// Get the first update out of the way
	parent.all().redraw();

	// --- end setup

	// Now make some partial updates
	sinon.spy(parent, "render");
	sinon.spy(child, "render");

	// Update a, and a part of b
	parent.all().where(a).and(child.all().where(b.values[0])).redraw();

	ok(parent.render.calledOnce, 'parent render called once');
	ok(child.render.calledOnce, 'child render called once');

	equal(parent.render.getCall(0).args[0].changed.length, 1, 'parent should only have one changed item');
	equal(parent.render.getCall(0).args[0].changed[0].data, a, 'parent\'s one changed item is a, as requested');

	equal(child.render.getCall(0).args[0].changed.length, 3, 'child should have three changed items (the two that are derived from "a" and one specific child of "b")');
});


