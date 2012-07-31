// I want to use objects to model my data and get related items;
// basically I want a very simple ORM.  I've got documents like this:
//	{
//		_id:'123',
//		type:'congregation'
//	}
//	{
//		_id:'124',
//		type:'congregation_group'
//	}
//	{
//		_id:'125',
//		type:'congregation_group_relation',
//		congregation_id:'123',
//		group_id:'124'
//	}

// So the document's 'type' attribute functions like a table in a relational database.

// I want a set of objects that do two things:  1) document what attributes each type
// of document contains, and 2) gives me easy access to the list of congregations in
// one group, or the list of groups to which one congregation belongs ("easy" means
// I don't have to write that access code in more than one place.)  Is there any
// standard or recommended way to do this?

// TODO: Is this problem still present?
// TODO: There is a problem here:  I would expect to be able to write
// new attributes to this function's return value like this:
// cong.new_attribute_name, AND call cong.save().  But I don't want
// to save the save() function itself to the database!
// Maybe I need some getter/setter magic like
// http://ejohn.org/blog/javascript-getters-and-setters or
// http://stackoverflow.com/a/813332 or http://stackoverflow.com/a/1749537
// Can JavaScript notice a new (previously undefined) attribute's creation
// and handle it with a setter method?  Maybe by setting up a timeout that watches 
//	the this[] array for new items.

// db.js contains:
// var path = unescape(document.location.pathname).split('/'),
//     db = $.couch.db(path[1]);
// 
// exports.db = db
// TODO: Fix db.js to run on server too, getting db name from config.js?

// Use Node's require() function if we are running this in Node
if (require=='undefined'){
	// We're running in the browser (under Evently) rather than on the server in Node
	var env = 'browser',
		require = $$(this).app.require
}else{
	var env = 'server'
}
//Define database access variable
var db = require('db').db

//Base object
var CouchObjectBase = {
    sub: function(){
        // Return a sub-instance of this object, like a subclass (technically, return an object
        // which has this object as its prototype.) We're using prototypal inheritance to save on
    	// memory usage.
        return Object.create(this)
    }
}
// Base object
var CouchObjectType = CouchObjectBase.sub()
$.extend(true, CouchObjectType, {
    // TODO: Is init actually called automatically when a new instance is created via 
	//	Object.create() or extend?
    // Initialize the object
    init : function(params) {
        // Get this object's data if an instance with this id exists in the database
        if (params._id !== undefined) {
            db.view(this._view_get, {
                keys : [params._id],
                include_docs : true,
                success : function(data) {
                    // TODO: Does this overwrite existing fields, as it should?
                    // TODO: Do I need the deep copy?
                    // TODO: Run migrations here if we are running on read
                    var doc = this.run_migrations(data.rows[0])
                    $.extend(true, this, doc)
                }
            })
        }
        // Else, populate this object
        else{
            $.extend(true, this, params)
        }
        // TODO: Automate the save, like is done in
        //          https://github.com/bcoe/endtable/blob/master/lib/endtable-object.js and
        //          https://github.com/bcoe/endtable/blob/master/lib/monitored-object.js
        // TODO: Set up self-monitoring object code here

        // Create views if they are not yet defined
        this.create_views()
        // TODO: Consider setting up a filtered changes listener that updates the local cache 
        //          of the object in memory if it changes in the database.  But will this cause
        //          conflicts in a problematic way? 
    },
    save:function(options){
        // Save the doc to the database
        // TODO: Test to make sure this doesn't save this object's functions
        // TODO: Figure out how to handle the callback options object
        // TODO: Make sure to use the previous _rev when needed to guarantee that this 
        //  saves a new revision.
        db.saveDoc(this, options);
    },
    // TODO: Consider mimicking EndTable's dynamic creation of views if they aren't 
    // identical to the ones defined in the CouchObject:  https://github.com/bcoe/endtable
    create_views:function(){
        // TODO: Write code here!
        // TODO: Will db writes initiated here overwrite or be overwritten by the design doc?
        // TODO: How can I keep this code from running every time a new object is created?  What if 
        //          the view already exists in the database?  It seems create_views needs to run 
        //          only at the time when the model is first loaded into the application (Or 
        //          maybe only at deployment.)  Does it make sense to run it when the browser first
        //          loads the application?  That seems like overkill.
        for (view in this.views){
            // Code here
            // TODO: Check to see if the view is a function, or is truly a view, avoiding functions
            //          that are default parts of JavaScript objects
            // TODO: Create relationship views in objType-relatedObjType syntax, with optional _by_attr
            //  suffixes for keys
            // TODO: Populate relationship arrays with data from those views, on access (getters)
            // TODO: Save new items in relationship arrays to database using setters
        }
    }
})

// Base object
var CouchObjectModel = CouchObjectBase.sub()
$.extend(true, CouchObjectModel, {
	run_migrations:function(doc){
        // See example in Python at http://stackoverflow.com/questions/130092/couchdb-document-model-changes/410840#410840
        // TODO: Decide whether to store migration_version in every object and run this code on 
        //          every document access, or store migration_version in just one document, and
        //          run all migrations on application load (or at some other time--deployment?)
        //          It seems deployment time is not sufficient, because the design doc will 
        //          replicate to other RCL instances without redeploying those instances.  Maybe this
        //          code could be run from the changes_listener file, then.  If the code will be run
        //          only once on all docs, it shouldn't be run from a CouchObjectType instance, but 
    	//			should be moved elsewhere.  It seems that running it on document read would make 
    	//			some views fail, because they wouldn't expect the right schema.
        // TODO: Filter this.migrations by doc.migrations_version using
        //          array.filter(callback[, thisObject]);
    	// TODO: Save doc named _migration_version
    	// TODO: Rewrite this to iterate through migration versions
        if (doc.migration_version == 1){
            // Put first migrations here
        }
    }
})
exports.CouchObject = {
	Base:Base,
	Type:Type,
	Model:Model
}
// TODO: Split the above into CouchObject.js

// var CouchObject = require('CouchObject').CouchObject

// Define model's sub-objects that 
//  1) have the CouchObject base object as their prototype
//  2) allow you to document your schema
//  3) allow you to define views in one place
//  4) auto-create (and auto-load on attribute access) default views and relationship views
//  5) auto-persist data to CouchDB when the object changes, and auto-load data from the database when the object's underlying documents change in CouchDB
//	6) allow you to add convenience methods to your model objects

var Cong = CouchObject.Type.sub()
$.extend(true, Cong, {
    // Cong object using the prototype method of inheritance
    _view_get : 'db/cong', // Name the default view here
    _id : '', // Simply document the fact there will be an _id
    type : 'congregation', // Required. Name the document type (else you won't have any relations!)
    groups : [], // TODO: How should we distinguish one-to-many from many-to-many relations here in
                 //     order to automate view generation?
    other_field_1 : '',
    other_field_2 : '',
    // Relations and other views
    views : {
        // TODO: Can a default view be created by default?
        // Default view
        cong : function() {
            if (doc.type == 'congregation') {
                emit(doc._id, null)
            }
            // TODO: Should I add something like this?
            if (doc.type == 'congregation_group') {
                emit(doc._id, null)
            }
        },
        // Relationship view
        groups: function(){}
    }
    // Optionally write other useful functions here
})

// TODO: Consider making this model object have a prototype that has a function which feeds changes 
//  into its changes handlers.  Divide the changes handlers into two sections:  client and server-side
//  code.
var model = CouchObject.Model.sub()
$.extend(true, model, {
	// Declare model's types
	types:{
	    Cong:Cong
	},
	//Define model's migrations
	migration_version : 1,
    migrations : {
        1 : {
            upgrade : function() {

            },
            downgrade : function() {

            }
        }
    },
    // Define model's changes handlers
    changes_handlers:{
        client:{
            
        },
        server:{
            
        }
    }
})
exports.model = model
// TODO: Split the above into model.js
// var model = require('model.js').model

// Create a cong
var cong = model.types.Cong.init({
    name:'Caney OPC',
    mailing_state:'KS'
})
// Or create first, then populate second
var cong = model.types.Cong.init()
// Retrieve a cong from the database
var cong = model.types.Cong.init(id)
groups = cong.groups