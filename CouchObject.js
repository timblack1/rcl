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

// TODO: Make CouchAppObject an npm-installable module, host on Github
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
	var require = $$(this).app.require
}
//Define database access variable
var db = require('db').db,
	config = require('config')

//Base object
var Base = {
    sub: function(){
        // Return a sub-instance of this object, like a subclass (technically, return an object
        // which has this object as its prototype.) We're using prototypal inheritance to save on
    	// memory usage.
        return Object.create(this)
    }
}
// Base object
var Type = Base.sub()
$.extend(true, Type, {
    // TODO: Is init actually called automatically when a new instance is created via 
	//	Object.create() or extend?
    // Initialize the object
    init : function(params) {
        // Create views if they are not yet defined
        this.create_views()

        // Get this object's data if an instance with this id exists in the database
        if (params._id !== undefined) {
            db.view(this._default_view, {
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
    // identical to the ones defined in the CouchAppObject:  https://github.com/bcoe/endtable
    create_views:function(){
        // TODO: Write code here!
    	// TODO: Will db writes initiated here overwrite or be overwritten by the design doc?
        // TODO: How can I keep this code from running every time a new object is created?  What if 
        //          the view already exists in the database?  It seems create_views needs to run 
        //          only at the time when the model is first loaded into the application (Or 
        //          maybe only at deployment.)  Does it make sense to run it when the browser first
        //          loads the application?  That seems like overkill.
        // TODO: Create the default view if it doesn't exist yet
        // Default view
        this._default_view = function(parent) {
        	// TODO: Maybe make this string different based on whether we're in cradle or 
        	//	jquery.couch.js
        	parent._default_view_name = 'db/' + parent.type
            if (doc.type == this.type) {
                emit(doc._id, null)
            }
        }
        // TODO: How do I create this view in the database?  It should not be written to execute here,
        //			but simply be declared here.  So does it need to be a string?  Can I get the string
        //			programmatically?  Yes, with function.toString()
    	// TODO: Create relation views

        // TODO: Isn't it easier to simply get cgroup.congs.length() from the client side?
		//	Maybe I could create a many_to_many.length() method which would get the value 
		//	from CouchDB without getting all the CouchAppObject objects.

        this.relations = []
        var num_relations = '' // TODO: Count how many attributes contain a .many_to_many or .one_to_many sub-attribute, and register them in a list
        
        for (var i=0;i<num_relations;i++){
            this.relations.push(function(){
            	// TODO: Dynamically create the type below for the join type
            	if (doc.type == 'congregation_cgroup') {
                    emit(doc._id, null)
                }
            })
        }
        // TODO: Create user-defined views
        
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
var Model = Base.sub()
$.extend(true, Model, {
	// TODO: Set db changes listener somewhere that listens for db changes, and calls run_changes_handlers(doc)
	//	Probably in this.init, which will need to be called after creating var model.
	run_migrations:function(doc, mode){
        // See example in Python at http://stackoverflow.com/questions/130092/couchdb-document-model-changes/410840#410840
        // TODO: Decide whether to store migration_version in every object and run this code on 
        //          every document access, or store migration_version in just one document, and
        //          run all migrations on application load (or at some other time--deployment?)
        //          It seems deployment time is not sufficient, because the design doc will 
        //          replicate to other RCL instances without redeploying those instances.  Maybe this
        //          code could be run from the changes_listener file, then.  If the code will be run
        //          only once on all docs, it shouldn't be run from a CouchAppObject.Type instance, but 
    	//			should be moved elsewhere (CouchAppObject.Model).  It seems that running it on 
		//			document read would make some views fail, because they wouldn't expect the right 
		//			schema.
        // TODO: Filter this.migrations by doc.migrations_version using
        //          array.filter(callback[, thisObject]);
    	// TODO: Save doc named _migration_version
		// TODO: Get changed doc
		// TODO: Get var db_version = _migration_version from db
    	// Iterate through migration versions, running them in order
		for (var version=0;version<this.migrations.length;version++){
			if (version>db_version){
				this.migrations[version][mode](doc)
			}
		}
    },
    run_changes_handlers:function(doc){
    	// TODO: Is this the right method of iteration?
    	for (handler in this.changes_handlers[config.env]){
    		handler(doc)
    	}
    }
})

exports.CouchAppObject = {
	Base:Base,
	Type:Type,
	Model:Model
}