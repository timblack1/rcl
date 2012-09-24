// Standard AMD RequireJS define
define(function(){
    // Fill this with your database information.

    // Configure which version of backbone-couchdb we are using
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
        // TODO: Replicate ddocChange() window.location.reload() functionality (see below)
        //  available in backbone.couch.js for use here in backbone-couchdb.js
    }else if (mode=='backbone.couch'){
       Backbone.couch.databaseName = "rcl";
       Backbone.couch.ddocName = "rcl";
       // TODO: Replicate this functionality for backbone-couchdb above
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

    // set your models here

    // A link object between 'CGroup' and 'Cong', to achieve many-to-many relations.
    CGroup_Cong = Backbone.RelationalModel.extend({})
    CGroup = Backbone.RelationalModel.extend({
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
      })
    Cong = Backbone.RelationalModel.extend({
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
                     key: 'cgroups',
                     relatedModel: 'CGroup_Cong',
                     includeInJSON:'_id',
                     reverseRelation: {
                         key: 'congregation',
                         includeInJSON:'_id'
                     }
                 },
                 {
                     type:'HasMany',
                     key: 'people',
                     relatedModel: 'Cong_Person',
                     includeInJSON:'_id',
                     reverseRelation: {
                         key: 'congregation',
                         includeInJSON:'_id'
                     }
                 }
                 ]
    })
    // A link object between 'Cong' and 'Person', to achieve many-to-many relations.
    Cong_Person = Backbone.RelationalModel.extend({})
    Person = Backbone.RelationalModel.extend({
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

    return {
        CGroup_Cong: CGroup_Cong,
        CGroup: CGroup,
        Cong: Cong,
        Cong_Person: Cong_Person,
        Person: Person
    }
})
