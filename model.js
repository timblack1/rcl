// Use Node's require() function if we are running this in Node
if (require=='undefined'){
	// We're running in the browser (under Evently) rather than on the server in Node
	var require = $$(this).app.require
}else{
	// TODO: Load jQuery
	var $ = require('jquery')
}
var CouchAppObject = require('CouchAppObject').CouchAppObject,
	config = require('config'),
	db = config.db

// ---------------------------------------------------------------------
// Define model's sub-objects that 
//  1) have the CouchObject base object as their prototype
//  2) allow you to document your schema
//  3) allow you to define views in one place
//  4) auto-create (and auto-load on attribute access) default views and relationship views
//  5) auto-persist data to CouchDB when the object changes, and auto-load data from the database when the object's underlying documents change in CouchDB
//	6) allow you to add convenience methods to your model objects

// Set migration_version for all new types created
CouchAppObject.Type.migration_version = 0

var Cong = CouchAppObject.Type.sub()
$.extend(true, Cong, {
    // Cong object using the prototype method of inheritance
    type : 'congregation', // Required. Name the document type (else you won't have any relations!)
    groups: {
    	many_to_many:['congregation','cgroup'] // Declare many_to_many relation by listing the two 
											   // doc types involved in the relation.  The backref on
											   // the other type must be explicitly created.  Note
											   // that the order of the type names is significant.
    },
    name : '',
    meeting_address1 : '',
    meeting_address2:'',
    meeting_city:'',
    meeting_state:'',
    meeting_zip:'',
    meeting_country:'',
    lat:'',
    lng:'',
    mailing_address1:'',
    mailing_address2:'',
    mailing_city:'',
    mailing_state:'',
    mailing_zip:'',
    mailing_country:'',
    phone:'',
    fax:'',
    email:'',
    website:'',
    service_info:'',
    people:{many_to_many:['congregation','person']},
    date_founded:'', // date
    number_of_members:'', // integer
    range_of_number_of_members:'', // textual range, like '20-30' members, where estimates are 
    							   // 	permitted/preferred or the only available data
    organized:'', // boolean, defines whether this is a mission work or an organized congregation
    source:'', // Foreign key:  Which source this cong's data came from
    source_cong_id:'', // The ID of this cong in the source's database
    
    // Relations and other views in this format:
    //	view_name: { map:function(doc){}, reduce:function(keys, values){} }, ...
    views : {
    }
    // Optionally write other convenience functions here
})

var CGroup = CouchAppObject.Type.sub()
$.extend(true, CGroup, {
	// CGroup object using the prototype method of inheritance
	type : 'cgroup', // Required. Name the document type (else you won't have any relations!)
	name:'',
	abbreviation:'',
	people:{many_to_many:['cgroup','person']},
	website:'',
	congs:{many_to_many:['congregation','cgroup']}
})
var Person = CouchAppObject.Type.sub()
$.extend(true, Person, {
    // Person object using the prototype method of inheritance
    type : 'person', // Required. Name the document type (else you won't have any relations!)
    prefix:'',
    firstname:'',
    lastname:'',
    suffix:'',
    phone:'',
    email:'',
    congs:{many_to_many:['person','congregation']},
    groups:{many_to_many:['person','cgroup']},
    roles:{many_to_many:['person','role']},
    office:{many_to_many:['person','office']}
})
var Office = CouchAppObject.Type.sub()
$.extend(true, Office, {
    // Office object using the prototype method of inheritance
    type : 'office', // Required. Name the document type (else you won't have any relations!)
    name:'',
    people:{many_to_many:['office','person']}
})
var Role = CouchAppObject.Type.sub()
$.extend(true, Role, {
    // Role object using the prototype method of inheritance
    type : 'role', // Required. Name the document type (else you won't have any relations!)
    name:'',
    people:{many_to_many:['role','person']}
})


//---------------------------------------------------------------------

// TODO: Consider making this model object have a prototype that has a function which feeds changes 
//  into its changes handlers.  Divide the changes handlers into two sections:  client and server-side
//  code.
var model = CouchAppObject.Model.sub()
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
        client:[
                
        ],
        server:[
                
        ]
    }
})

exports.model = model