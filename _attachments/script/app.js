// Apache 2.0 J Chris Anderson 2011
$(function() {   
    // TODO: Is this still needed?
    // friendly helper http://tinyurl.com/6aow6yn
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var path = unescape(document.location.pathname).split('/'),
        design = path[3],
        db = $.couch.db(path[1]);
    // TODO: Use couchdb-login-jquery instead of Evently login widget:
    //  https://github.com/couchapp/couchdb-login-jquery
    $("#account").couchLogin({});
   
    // TODO: Put custom evently code here
    
    // Evently version
    // TODO: Migrate this to Backbone to get auto-persisting model objects
    $.couch.app(function(app) {
    	$("#mainmenu").evently("mainmenu", app);
        $("#map").evently("map", app);
        $("#search_container").evently("search", app);
	});

    // ------------------------------------------------------------------
    // Backbone version
    // ------------------------------------------------------------------
    
    // Fill this with your database information.
    
    var mode = 'backbone-couchdb' // Jan Monschke's original backbone-couch.js
    //var mode = 'backbone.couch' // backbone.couch.js. Andrzej Sliwa's old rewrite of JM's backbone-couch.
    //var mode = 'backbone.couchdb' // Thomas Rampelberg's backbone.couchdb.js
    if (mode == 'backbone-couchdb'){
        // `ddoc_name` is the name of your couchapp project.
        Backbone.couch_connector.config.db_name = "rcl";
        Backbone.couch_connector.config.ddoc_name = "rcl";
        
        // If set to true, the connector will listen to the changes feed
        // and will provide your models with real time remote updates.
        // But in this case we enable the changes feed for each Collection on our own.
        // TODO: Get this to work
        Backbone.couch_connector.config.global_changes = true;
        // TODO: Replicate ddocChange() window.location.reload() functionality available 
        //  in backbone.couch.js for use here in backbone-couchdb.js
    }else if (mode=='backbone.couch'){
       Backbone.couch.databaseName = "rcl";
       Backbone.couch.ddocName = "rcl";
       Backbone.couch.ddocChange(function(ddocName){
         if (console && console.log) {
           console.log("current ddoc: '" + ddocName + "' changed");
           console.log("restarting...");
         }
         window.location.reload();
      });
       // TODO: Does this auto-update models in browser with changes on server?
      Backbone.couch.enableChangesFeed = true;
    }
    // Enables Mustache.js-like templating.
    _.templateSettings = {
      interpolate : /\{\{(.+?)\}\}/g
    };

     // set your models here
      
    // A link object between 'CGroup' and 'Cong', to achieve many-to-many relations.
    var CGroup_Cong = Backbone.RelationalModel.extend({});
    
    var CGroup = Backbone.RelationalModel.extend({
        collection:'cgroup',
        urlRoot:'/cgroup',
        defaults:{
            name: '',
            abbreviaton: '',
            website: ''
        },
        relations:[
                   {
                       type:'HasMany',
                       key: 'congregations',
                       relatedModel: 'CGroup_Cong',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'cgroup',
                           // TODO: Is this needed?
                           includeInJSON:'_id'
                       }
                   },
                   {
                       type:'HasMany',
                       key: 'people',
                       relatedModel: 'CGroup_Person',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'cgroup',
                           includeInJSON:'_id'
                       }
                   },
                   {
                	   type:'HasMany',
                       key: 'roles',
                       relatedModel: 'CGroup_Role',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'cgroup',
                           includeInJSON:'_id'
                       }
                   },
                   {
                	   type:'HasMany',
                       key: 'directories',
                       relatedModel: 'Directory',
                       includeInJSON:'_id',
                       // TODO: Should we include this collectionType attribute in the other relations?
                       collectionType:'DirectoryList', 
                       reverseRelation: {
                           key: 'cgroup',
                           includeInJSON:'_id'
                       }
                   }
                   ]
      });

    var Cong = Backbone.RelationalModel.extend({
      urlRoot:'/cong',
      collection:'cong',
      defaults:{
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
          date_founded:'', // date
          number_of_members:'', // integer
          range_of_number_of_members:'', // textual range, like '20-30' members, where estimates are 
                                         //   permitted/preferred or the only available data
          organized:'', // boolean, defines whether this is a mission work or an organized congregation
          source:'', // Foreign key:  Which source this cong's data came from
          source_cong_id:'', // The ID of this cong in the source's database
      },
      relations:[
                 {
                     type:'HasMany',
                     key: 'people',
                     relatedModel: 'Cong_Person',
                     includeInJSON:'_id',
                     reverseRelation: {
                         key: 'congregation',
                         includeInJSON:'_id'
                     }
                 },
                 // TODO: create link object
                 {
                     type:'HasMany',
                     key: 'cgroups',
                     relatedModel: 'CGroup_Cong',
                     includeInJSON:'_id',
                     reverseRelation: {
                         key: 'congregation',
                         includeInJSON:'_id'
                     }
                 }
                 ]
    });
    
    // A link object between 'Cong' and 'Person', to achieve many-to-many relations.
    var Cong_Person = Backbone.RelationalModel.extend({
    })
    
    var Person = Backbone.RelationalModel.extend({
        urlRoot:'/person',
        collection:'person',
        defaults: {
                    prefix:'',
                    firstname:'',
                    lastname:'',
                    suffix:'',
                    phone:'',
                    email:''
        },
        relations:[
                   {
                       type:'HasMany',
                       key: 'congregations',
                       relatedModel: 'Cong_Person',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany',
                       key: 'groups',
                       relatedModel: 'CGroup_Person',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany',
                       key: 'roles',
                       relatedModel: 'Person_Role',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany',
                       key: 'offices',
                       relatedModel: 'Office_Person',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   }
                   ]
    })
    
    // TODO: Figure out the syntax for saving many-to-many relations to the database 
    //  and restoring them from the database.
    // Instantiate congregation model
    // TODO: Should this be global or not?
    cong1 = new Cong({
        name:'Caney OPC',
        mailing_state:'KS'
    })
    // Save congregation model
    cong1.save({}, {success:function(){
        // Instantiate second congregation model
        cong2 = new Cong({
            name:'Bartlesville OPC',
            mailing_state:'OK'
        })
        // Save second congregation model
        cong2.save({},{success:function(){
            // Create CGroup model and add congregations to it
            // TODO: make an 'OPC' CGroup and associate cong1 with it
            OPC = new CGroup({
                name:'Orthodox Presbyterian Church',
                abbreviation:'OPC'
                //congregations:[cong1.get('_id'), cong2.get('_id')]
            })
            // TODO: Start here. Why doesn't OPC have a congregations attribute?  Is this due 
            //  to some conflict with backbone-couchdb?
            console.log(OPC.get('congregations'))
            OPC.get('congregations').add({congregation:cong1})
            // Save CGroup model to the database
            OPC.save({}, {success:function(){
                // TODO: Get the OPC group to get its related congregations' full data 
                //  from the database.
                // Try following this:  http://stackoverflow.com/questions/10871369/how-to-handle-relations-in-backbone-js
                OPC.fetchRelated()
                console.log(OPC.get('congregations')) // -> ["a319a63adde1a4ef2a16aca9392cba51", "a319a63adde1a4ef2a16aca9392cd53b"]
                // This returns correct cong objects
                // TODO: How can I get backbone-relational to do this for me?
                // This seems to be about the same problem as http://stackoverflow.com/questions/11669356/how-to-auto-create-many-to-many-relations-from-initial-json-with-backbone-relati
                $.each(OPC.get('congregations'), function(key, val){ console.log(Cong.findOrCreate(val)); })
                
            }});
        }})
    }})
    // TODO: Figure out the syntax for querying via relations in the database.

//    cong1.save({}, {success:function(){
//        cong1.set({name:'Caney OPC, second version'}).save({}, {success:function(){
//            cong2.save({}, {success:function(){
//            }})
//        }})        
//    }})

    // TODO: Create views here
    
    // Main application
    var App = Backbone.Router.extend({
      initialize : function(){
      
      }
    });
    // TODO: Call App() and other views if necessary
 });