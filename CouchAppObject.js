// CouchAppObject is a simple ORM patterned after EndTable (a CouchDB ORM that runs in Node.js; see
//	https://github.com/bcoe/endtable), but is intended to run in the browser in a CouchApp environment,
//	which means it does not depend on Node.js core modules, and uses jquery.couch.js for access to
//	CouchDB.

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

// So the document's 'type' attribute functions like a (reference to / name of the document's 
//  containing) table in a relational database.

// I want to be able to define model objects that 
//  1) have the CouchAppObject base object as their prototype [DONE]
//  2) allow you to document your schema [DONE]
//	3) provide easy (attribute) access to related objects (via one-to-many and many-to-many relations,
//      dependent on default & relationship views)
//	4) allow you to add convenience methods to your model objects [DONE]
//  5) allow you to define custom views in one place
//  6) auto-create (and auto-load on attribute access) default views and relationship views
//  7) auto-persist data to CouchDB when the object changes, and auto-load data from the database 
//		when the object's underlying documents change in CouchDB [IN PROGRESS]

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
// ---------------
// var path = unescape(document.location.pathname).split('/'),
//     db = $.couch.db(path[1]);
// 
// exports.db = db
// ---------------
// TODO: Fix db.js to run on server too, getting db name from config.js?

//Define database access variable
var config = require('config'),
	db = config.db;

// TODO: Make it so the values returned by the object are returned synchronously, or the object
//	takes a callback function on success.  Initially, I prefer making the object return 
//	synchronously, and hiding its asynchronous nature inside the object, but perhaps this is 
//	unwise, since it might block the UI.

// Base object
var Base = {
    sub: function(){
        // Return a sub-instance of this object, like a subclass (technically, return an object
        // which has this object as its prototype.) We're using prototypal inheritance to save on
    	// memory usage, following 
    	// http://www.adobe.com/devnet/html5/articles/javascript-object-creation.html
        return Object.create(this);
    },
    bind_scope:function(){
        // Bind this object's functions to this object's scope so the 'this' variable consistently refers
        //  to this object.
        if (typeof Function.prototype.bind === 'undefined') {
            // Taken from http://www.robertsosinski.com/2009/04/28/binding-scope-in-javascript/
            Function.prototype.bind = function(scope) {
                var _function = this;

                return function() {
                    return _function.apply(scope, arguments);
                }
            }
        }
        for (item in this){
            if (typeof this[item] === 'function' && item != 'init'){
                this[item] = this[item].bind(this)
            }
        }
    }
}
// Base Type object
var Type = Base.sub()
$.extend(true, Type, {
    db: db,
    // Initialize the object
    init: function(params) {
        // Bind this object's scope to this object's functions
        this.bind_scope()
        // Create views for this type (not instance) if they are not yet defined
        this.create_views()
       
        //console.log(params)
        merge_from_db_callback = this.merge_from_db_callback
        // Get this type instance's data if an instance with this id exists in the database
        if (params._id !== undefined) {
            console.log('We have an _id!')
            db.openDoc(params._id, {
                success : function(doc) {
                    // TODO: Does this overwrite existing fields, as it should?
                    // TODO: Run migrations here if we are running on read
                    //console.log(this)
                    var doc = this.run_migrations(doc);
                    // It appears we have to extend and return a copy rather than the current object, 
                    //	otherwise we get an error.
                    // Note that this.copy_to_return must be removed from the object before saving, so
                    //	we don't create a recursive object.
                    //this.copy_to_return = $.extend(true, this, doc)
                    merge_from_db_callback(doc)
                },
                async:false
            })
        }
        // Else, populate this object
        else{
        	this.copy_to_return = $.extend(true, this, params)
        }
        // TODO: Automate the save, like is done in
        //          https://github.com/bcoe/endtable/blob/master/lib/endtable-object.js and
        //          https://github.com/bcoe/endtable/blob/master/lib/monitored-object.js
        // TODO: Set up self-monitoring object code here
        

        // TODO: Set up a filtered changes listener that updates the local cache 
        //          of the object in memory if it changes in the database.  But will this cause
        //          conflicts in a problematic way?
        // TODO: This should be changed, because I shouldn't return a value here synchronously 
        //  that is gotten asynchronously above.  Should I force the openDoc call above to use 
        //  async:false?  That's bad because it will lock up the browser.  So how to use a callback here? 
        return this.copy_to_return
    },
    save_success:function(data){
        this.dirty = false
        delete this.copy_to_return
        // Handle the response here.
        this._rev = data.rev;
        // Set up changes listener to repopulate object in browser if object changes in
        //  database.
        this.monitor_db_changes()
    },
    save:function(options){
    	// Save the doc to the database
        // TODO: Make sure to use the previous _rev when needed to guarantee that this 
        //  saves a new revision of an existing document.  Instead it is saving a new document every time
        //  save() is called.
    	// Remove the following attributes before saving:
    	var attrs_to_remove = ['views', 'relations', 'dirty', 'default_view', 'copy_to_return']
    	var copy_to_save = this
    	for (var i=0; i<attrs_to_remove.length; i++){
    		delete copy_to_save[attrs_to_remove[i]]
    	}
    	// Import the function into the current scope so it can be used below
    	var save_success = this.save_success
    	console.log(copy_to_save._rev)
        db.saveDoc(copy_to_save, {
    		success:function(data){
    		    save_success(data)
    		    // TODO: Figure out how to handle the callback options object.  Is this the right way?
    		    try {options.success()}
    		    catch(err) {}
    		},
    		error:function(status){
    			console.log(status)
                try {options.error(); } 
    			catch(err){}
    		}
    	});
    },
    merge_from_db_callback:function(doc){
        // TODO: Merge values from db doc into this object
        // This function has the "this" variable in its scope, so should be able to work here.
        // TODO: (Error from before this code was put into CouchAppObject:)
        //  This should set doc._rev to the rev in the db, but doesn't,
        //  so it causes a doc update conflict in the browser
        // start here
        // TODO: Do I need to use some other method (like making a copy of this object)
        //  to get the db object into memory, replacing this object with that copy?
        // TODO: Do I need the deep copy?
        $.extend(true, this, doc)
        console.log(doc)
    },
    monitor_db_changes:function(){
        this.changes = this.db.changes();
        merge_from_db_callback = this.merge_from_db_callback
        this.changes.onChange(function(change){
			// Determine if the db document which changed is the one this object represents 
			var change_id = change.results[0].id
			if (change_id == this._id){
				// TODO: After I create this object's self-monitoring code, stop this object from 
			    //   monitoring changes to itself until after the changes from the db are merged into 
			    //   memory.  Maybe it would be better to queue new this.save() events until after 
			    //   merging in from the db, too.
				// Get document by id
				db.openDoc(change_id, {
					success:function(doc){
						// Put new doc from db into memory
						merge_from_db_callback(doc);
					}
				});
			}
		})
    },
    delete_:function(){
        // TODO: Delete this object from the database
    },
    // TODO: Consider mimicking EndTable's dynamic creation of views if they aren't 
    // identical to the ones defined in the CouchAppObject:  https://github.com/bcoe/endtable
    create_views:function(){
        // TODO: How can I keep this code from running every time a new object is created?  What if 
        //  the view already exists in the database?  It seems create_views needs to run 
        //  only at the time when the model is first loaded into the application (or 
        //  maybe only at deployment, or both.)  Does it make sense to run it when the 
        //  browser first loads the application?  That seems like overkill.

    	// Declare default views, but only if they don't exist yet
    	// TODO: It should not be written to execute here, but simply be declared here.  So does it need 
    	//	to be a string?  Can I get the string programmatically?  Yes, with function.toString()
        var views = {}
        if (typeof this.default_view_on !== 'undefined'){
        	views[this.type + '_' + this.default_view_on] = {
    			'map':(
					function(){
						if (doc.type == this.type) {
							emit(doc[this.default_view_on], null)
						}
					}).toString()
        	}
        }
        if (typeof this.all !== 'undefined'){
            views[this.type + '_all'] = {
                'map':(
                     function(){
                         if (doc.type == this.type) {
                             emit(doc[this._id], null)
                         }
                     }).toString()
            }
        }
    	console.log(views)
    	// TODO: Create relation views

        // TODO: Isn't it easier to simply get cgroup.congs.length() from the client side?
		//	Maybe I could create a many_to_many.length() method which would get the value 
		//	from CouchDB without getting all the CouchAppObject objects.

        this.relations = []
        var num_relations = '' // TODO: Count how many attributes contain a .many_to_many or .one_to_many sub-attribute, and register them in a list
        
//        for (var i=0;i<num_relations;i++){
//            this.relations.push(function(){
//            	// TODO: Dynamically create the type below for the join type
//            	if (doc.type == 'congregation_cgroup') {
//                    emit(doc._id, null)
//                }
//            })
//        }
        // TODO: Create user-defined views
        
    	for (view in views){
            // Code here
            // TODO: Check to see if the view is a function, or is truly a view, avoiding functions
            //          that are default parts of JavaScript objects
            // TODO: Create relationship views in objType-relatedObjType syntax, with optional _by_attr
            //  suffixes for keys
            // TODO: Populate relationship arrays with data from those views, on access (getters)
            // TODO: Save new items in relationship arrays to database using setters
        }
        // TODO: Create default views in database
        // TODO: How do I create this view in the database?
        // TODO: Will db writes initiated here overwrite or be overwritten by the design doc?
        //  Maybe I should have this put views into a separate CouchAppObject-specific design doc.
        views._id = 'rcl/_design/CouchAppObject_views'
        db.saveDoc(views, {
            success:function(data){
                // TODO: Should I do anything here?
            }
        })
    }
})

// Base Model object
var Model = Base.sub()
$.extend(true, Model, {
	// TODO: Set db changes listener somewhere that listens for db changes, and calls run_changes_handlers(doc)
	//	Probably in this.init, which will need to be called after creating var model.
	// Note that migrations are not absolutely necessary, because schema changes can be handled
	//	almost completely by doing duck-typing schema detection in views and other code.  But if you
	//	prefer not to have to worry about schema detection in the "other code," then you can write
	//	migrations to be run here.
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