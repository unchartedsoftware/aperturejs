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

module('Layer#add');

testSkip('adding data to existing set returns NodeSet with additions', function() {
	expect(2);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Add c, no change to a,b
	var result = layer.add(c);
	var dataArray = [];
	var iter = result.data();
	while(node = iter.next()) {
		dataArray.push(node);
	}

	equal(dataArray.length, 1, 'result nodeset should have single entry');
	equal(dataArray[0].data, c, 'single nodeset item should be newly added data');
});



test('adding data to existing set only adds, no updates', function() {
	expect(4);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");

	// Add c, no change to a,b
	layer.add(c).redraw();

	ok(layer.render.calledOnce, 'parent render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 0, 'layer should have no changed');

	equal(layer.render.getCall(0).args[0].added.length, 1, 'layer should have one add');
	equal(layer.render.getCall(0).args[0].added[0].data, c, 'layer \'s add should be our data item');
});

test('adding data to changed set should add and update', function() {
	expect(4);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");
	
	// Trigger pending update
	layer.all(data);
	layer.add(c).redraw();

	ok(layer.render.calledOnce, 'parent render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 2, 'layer should have two changes');

	equal(layer.render.getCall(0).args[0].added.length, 1, 'layer should have one add');
	equal(layer.render.getCall(0).args[0].added[0].data, c, 'layer \'s add should be our data item');
});

test('adding data to set with removals should add and remove', function() {
	expect(5);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();

	// Trigger pending removal (of 'a')
	layer.all([b]);
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");

	layer.add(c).redraw();

	ok(layer.render.calledOnce, 'parent render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 1, 'layer should have one change');
	equal(layer.render.getCall(0).args[0].removed.length, 1, 'layer should have one remove');

	equal(layer.render.getCall(0).args[0].added.length, 1, 'layer should have one add');
	equal(layer.render.getCall(0).args[0].added[0].data, c, 'layer \'s add should be our data item');
});

test('child with derived data adds if data added to parent', function() {

	expect(5);

	var a = {values:[{value:'a'},{value:'b'}]},
		b = {values:[{value:'c'},{value:'d'}]},
		c = {values:[{value:'e'},{value:'f'}]},
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
	sinon.spy(child, "render");

	// Update a, and a part of b
	parent.add(c).redraw();

	ok(child.render.calledOnce, 'child render called once');

	equal(child.render.getCall(0).args[0].added.length, 2, 'child should have two new data items');
	equal(child.render.getCall(0).args[0].added[0].data.value, 'e', 'new child data items should be correctly derived from parent');
	equal(child.render.getCall(0).args[0].changed.length, 0, 'child should no changes');
	equal(child.render.getCall(0).args[0].removed.length, 0, 'child should no removes');
});


module('NodeSet#remove');

test('removing data to existing set only triggers removes, no updates', function() {
	expect(5);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b,c];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");

	// Remove c
	layer.all().where(b).remove().redraw();

	ok(layer.render.calledOnce, 'parent render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 0, 'layer should have no changed');
	equal(layer.render.getCall(0).args[0].added.length, 0, 'layer should have no added');

	equal(layer.render.getCall(0).args[0].removed.length, 1, 'layer should have one remove');
	equal(layer.render.getCall(0).args[0].removed[0].data, b, 'layer \'s remove should be our data item');
});

test('removing data in conjunction with changes to existing set merges removes and updates', function() {
	expect(5);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b,c];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");

	// Remove c
	layer.all(data).where(b).remove().redraw();

	ok(layer.render.calledOnce, 'parent render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 2, 'layer should have two changes');
	equal(layer.render.getCall(0).args[0].added.length, 0, 'layer should have no added');

	equal(layer.render.getCall(0).args[0].removed.length, 1, 'layer should have one remove');
	equal(layer.render.getCall(0).args[0].removed[0].data, b, 'layer \'s remove should be our data item');
});

test('removes cascade cleanly to child with derived data', function() {

	expect(5);

	var a = {values:[{value:'a'},{value:'b'}]},
		b = {values:[{value:'c'},{value:'d'}]},
		c = {values:[{value:'e'},{value:'f'}]},
		data = [a,b,c];

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
	sinon.spy(child, "render");

	// Update a, and a part of b
	parent.all().where(b).remove().redraw();

	ok(child.render.calledOnce, 'child render called once');

	equal(child.render.getCall(0).args[0].removed.length, 2, 'child should have two removed data items');
	equal(child.render.getCall(0).args[0].removed[0].data.value, 'c', 'removed child data items should be correctly derived from parent');
	equal(child.render.getCall(0).args[0].changed.length, 0, 'child should no changes');
	equal(child.render.getCall(0).args[0].added.length, 0, 'child should no adds');
});

test('adding and removing data in a single update merges changes', function() {
	expect(6);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");

	// Remove c
	layer.add(c);
	layer.all().where(b).remove().redraw();

	ok(layer.render.calledOnce, 'layer render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 0, 'layer should have no changes');

	equal(layer.render.getCall(0).args[0].added.length, 1, 'layer should have one addition');
	equal(layer.render.getCall(0).args[0].added[0].data, c, 'layer \'s remove should be our data item');
	
	equal(layer.render.getCall(0).args[0].removed.length, 1, 'layer should have one remove');
	equal(layer.render.getCall(0).args[0].removed[0].data, b, 'layer \'s remove should be our data item');
});

testSkip('adding and removing the same data in a single has no changes', function() {
	expect(4);

	var a = {value:'a'},
		b = {value:'b'},
		c = {value:'c'},
		data = [a,b];

	// Setup test layer
	var layer = new aperture.Plot('body');
	layer.all(data).redraw();
	// --- end setup

	// Now make some partial updates
	sinon.spy(layer, "render");

	// Remove c
	layer.add(c).remove().redraw();

	ok(layer.render.calledOnce, 'layer render called once');

	equal(layer.render.getCall(0).args[0].changed.length, 0, 'layer should have no changes');
	equal(layer.render.getCall(0).args[0].added.length, 0, 'layer should have no additions');	
	equal(layer.render.getCall(0).args[0].removed.length, 0, 'layer should have no removes');
});
