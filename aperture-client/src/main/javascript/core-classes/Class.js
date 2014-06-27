/**
 * Source: Class.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Simple JavaScript Inheritance
 */

/*
 * Portions of this implementation of a classical inheritance pattern are written
 * by John Resig http://ejohn.org/
 * MIT Licensed.
 *
 * The Resig approach has been extended here to support 'views' of
 * class object instances using the JavaScript prototype model, as
 * well as basic type reflection. A bug fix was added to handled the
 * overrides of toString.
 *
 * Resig ack: Inspired by base2 and Prototype.
 */

/**
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {
	var initializing = false,
		nativeToString = Object.prototype.toString,

		// used in check below at root level
		rootTypeOf,

		// get property names.
		getOwnPropertyNames = function ( properties ) {
			var name, names = [];

			for (name in properties) {
				if (properties.hasOwnProperty(name)) {
					names[names.length] = name;
				}
			}

			// need to make a special case for toString b/c of IE bug
			if (properties.toString !== nativeToString) {
				names[names.length] = 'toString';
			}

			return names;
		},

		// create a new typeof method that checks against the properties of a type
		createTypeOfMethod = function ( name, constructor, superTypeOf ) {
			return function( type ) {
				return !type? name: (type === name || type === constructor
					|| (type.test && type.test(name)))?
							true : (superTypeOf || rootTypeOf)( type );
			};
		};

	// create the root level type checker.
	rootTypeOf = createTypeOfMethod( 'aperture.Class', namespace.Class, function() {return false;} );

	/**
	 * @class
	 * Class is the root of all extended Aperture classes, providing simple, robust patterns
	 * for classical extensibility. An example is provided below showing how to
	 * {@link aperture.Class.extend extend} a new class.
	 *
	 * @description
	 * This constructor is abstract and not intended to be invoked. The examples below demonstrate
	 * how to extend a new class from a base class, and how to add a view constructor to
	 * a base class.
	 *
	 * @name aperture.Class
	 */
	namespace.Class = function() {
	};

	/**
	 * Provides a method of checking class and view type inheritance, or
	 * simply returning the type name. A fully scoped name may be provided,
	 * or a regular expression for matching. Alternatively the class or
	 * view constructor may be passed in.
	 *
	 * @example
	 * var range = new aperture.Scalar('Percent Change GDP').symmetric();
	 *
	 * // check using regular expressions
	 * console.log( range.typeOf(/scalar/i) );         // 'true'
	 * console.log( range.typeOf(/symmetric/) );       // 'true'
	 *
	 * // check using names
	 * console.log( range.typeOf('aperture.Scalar') );  // 'true'
	 * console.log( range.typeOf('aperture.Range') );   // 'true'
	 * console.log( range.typeOf('aperture.Ordinal') ); // 'false'
	 *
	 * // check using prototypes. also 'true':
	 * console.log( range.typeOf( aperture.Scalar ) );
	 * console.log( range.typeOf( aperture.Scalar.prototype.symmetric ) );
	 *
	 * @param {String|RegExp|Constructor} [name]
	 *      the name, regular expression, or constructor of the view or class type to
	 *      check against, if checking inheritance.
	 *
	 * @returns {Boolean|String} if a name argument is provided for checking inheritance,
	 *      true or false indicating whether the object is an instance of the type specified,
	 *      else the name of this type.
	 *
	 *
	 * @name aperture.Class.prototype.typeOf
	 * @function
	 */

	/**
	 * Declares a class method which, when called on a runtime instance
	 * of this class, instantiates a 'view' of the object using
	 * JavaScript's prototype based inheritance, extending its methods
	 * and properties with those provided in the properties parameter.
	 * View methods may access a reference to the base object using the
	 * _base member variable. Views use powerful and efficient features
	 * of JavaScript, however however unlike in the case of Class
	 * extension, some allowances must be made in the design of base
	 * classes to support the derivation of views for correct behavior.
	 * The following provides an example:
	 *
	 * @example
	 *
	 * var ValueClass = aperture.Class.extend( 'ValueClass', {
	 *
	 *     // constructor
	 *     init : function( value ) {
	 *
	 *         // create a common object for all shared variables.
	 *         this.common = { value : value };
	 *     },
	 *
	 *     // sets the value in the object, even if called from a view.
	 *     setValue : function( value ) {
	 *
	 *         // use the common object to set the value for all,
	 *         // as opposed to overriding it locally.
	 *         this.common.value = value;
	 *     },
	 *
	 *     // returns the value.
	 *     getValue : function( value ) {
	 *         return this.common.value;
	 *     }
	 *
	 * });
	 *
	 * // declare a new view constructor
	 * ValueClass.addView( 'absolute', {
	 *
	 *    // optional view constructor, invoked by a call to absolute().
	 *    init : function( ) {
	 *
	 *        // Because of JavaScript prototype inheritance, note that
	 *        // any this.* property value we set will be an override
	 *        // in this view until deleted.
	 *    },
	 *
	 *    // overrides a parent class method.
	 *    getValue : function( ) {
	 *
	 *        // call same getValue method defined in base object.
	 *        // we can choose (but here do not) what this.* should resolve
	 *        // to in the base method call by using function apply() or call().
	 *        return Math.abs( this._base.getValue() );
	 *    }
	 *
	 * });
	 *
	 *
	 * // derive a view of an existing object
	 * var myObj = new MyClass( -2 ),
	 *     myAbsView = myObj.absolute();
	 *
	 * // value now depends on whether you call the base or view
	 * console.log( myObj.getValue() );     // '-2'
	 * console.log( myAbsView.getValue() ); //  '2'
	 *
	 *
	 * @param {String} viewName
	 *      the name of the view method to create, reflective of the type being declared
	 * @param {Object} properties
	 *      a hash of functions to add to (or replace on) the base object when the
	 *      view is created.
	 *
	 * @returns this (allows chaining)
	 *
	 * @name aperture.Class.addView
	 * @function
	 */
	var addView = function(viewName, properties) {
		var viewProto,
			fullName = this.prototype.typeOf() + '.prototype.' + viewName;

		// Create a function on the class's prototype that creates this view
		this.prototype[viewName] = viewProto = function( params ) {
			// First create a derived object
			// generic constructor function
			var ApertureView = function () {};
			// inherit from given instance
			ApertureView.prototype = this;
			// new
			var view = new ApertureView();

			// Provide access to the base object via "_base" member
			// We could check for access to this object and set in a wrapped method
			// like in the class extension below.
			view._base = this;

			aperture.util.forEach( getOwnPropertyNames(properties), function(name) {
				if (name !== 'init') {
					view[name] = properties[name];
				}
			});

			// override the typeOf function to evaluate against this type first, then fall to super.
			view.typeOf = createTypeOfMethod( fullName, viewProto, this.typeOf );

			// Call init (if given)
			if( properties.init ) {
				properties.init.apply( view, arguments );
			}

			return view;
		};

		return this;
	};


	/**
	 * Extends a new class from this class, with any new or overridden properties
	 * and an optional init constructor defined in the properties parameter.
	 * Any methods which are
	 * overridden may call this._super() from within the context of the overridden function
	 * to invoke the parent classes implementation.
	 * A className is supplied as the first parameter for typeOf() evaluation, which
	 * may be omitted for anonymous classes.
	 * Extend may be called on
	 * any previously extended Class object.
	 *
	 * For example:
	 *
	 * @example
	 * var MyClass = MyBaseClass.extend( 'MyClass', {
	 *
	 *    // optionally define constructor
	 *    init : function( exampleArg ) {
	 *
	 *        // optionally call super class constructor
	 *        this._super( exampleArg );
	 *    },
	 *
	 *    // example method override
	 *    exampleMethod : function() {
	 *
	 *        // optionally call same method in parent.
	 *        this._super();
	 *    },
	 *
	 *    ...
	 * });
	 *
	 * // example instantiation
	 * var myObj = new MyClass( exampleArg );
	 *
	 * @param {String} [className]
	 *      an optional type specifier which may be omitted for anonymous classes.
	 *
	 * @param {Object} properties
	 *      a hash of methods and members to extend the class with.
	 *
	 * @returns
	 *      a new class constructor.
	 *
	 * @name aperture.Class.extend
	 * @function
	 */
	namespace.Class.extend = function(className, properties) {

		// className is an optional arg,  but first.
		if (!properties) {
			properties = className;
			className = null;
		}

		var _super = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		aperture.util.forEach( getOwnPropertyNames(properties), function ( name ) {
			prototype[name] = properties[name];
		});

		// The dummy class constructor
		function ApertureClass() {
			// All construction is actually done in the init method
			if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
		}

		// add the type of now that we have the constructor.
		prototype.typeOf = createTypeOfMethod( className, ApertureClass, _super.typeOf );

		// Populate our constructed prototype object
		ApertureClass.prototype = prototype;

		// Enforce the constructor to be what we expect
		ApertureClass.constructor = ApertureClass;

		// And make this class extendable
		ApertureClass.extend = namespace.Class.extend;

		// And make this class able to create views of itself
		ApertureClass.addView = addView;

		return ApertureClass;
	};

	return namespace;

}(aperture || {}));
