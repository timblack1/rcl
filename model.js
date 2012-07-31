// Use Node's require() function if we are running this in Node
if (require=='undefined'){
	// We're running in the browser (under Evently) rather than on the server in Node
	var require = $$(this).app.require
}else{
	// TODO: Load jQuery
	var $ = require('jquery')
}
var CouchObject = require('CouchObject').CouchObject,
	config = require('config'),
	db = config.db

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