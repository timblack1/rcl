//  -------------------------------------------------------------------

//    // Example of how to save a many-to-many relation to the database
//    // Create CGroup model
//    cgroups = new model.CGroups
//    OPC = cgroups.create({
//        name:'Orthodox Presbyterian Church',
//        abbreviation:'OPC'
//    })
//    // Instantiate group of congs
//    congs = new model.Congs
//    // Instantiate first congregation model
//    // TODO: Should this be global or not?
//    cong1 = congs.create({
//        name:'Caney OPC',
//        mailing_state:'KS'
//    },{
//        success:function(){
//            // Instantiate second congregation model
//            cong2 = congs.create({
//                name:'Bartlesville OPC',
//                mailing_state:'OK'
//            },{success:function(){
//                // Add congregations to cgroup
//                OPC.get('congregations').add([{_id:cong1.get('_id')},{_id:cong2.get('_id')}])
//                // Save cgroup to db
//                OPC.save({_id:OPC.get('_id')},{success:function(){
//                    $.each([cong1,cong2], function(key, cong){
//                        cong.get('cgroups').add({_id:OPC.get('_id')})
//                        cong.save({},{success:function(){
//                            // Example of how to fetch many-to-many relations from the db
//                            // Fetch the cong so as to populate its relations in the browser
//                            cong.fetch({success:function(){
//                                // Example of how to query for related CGroups
//                                var cong_cgroups = cong.get('cgroups')
//                                for (var i=0; i<cong_cgroups.length; i++){
//                                    var cgroup_id = cong_cgroups.at(i).get('_id')
//                                    var cgroup = cgroups.get(cgroup_id)
//                                }
//                                // Example of how to query by one attribute
//                                congs_by_name = new model.CongsByName
//                                congs_by_name.db.keys = ['Caney OPC']
//                                congs_by_name.fetch({success:function(col, res){
//                                    var caney_opc = col.at(0)
//                                }})
//                            }})
//                        }})
//                    })
//                }})
//            }})
//        }
//    })

//  -------------------------------------------------------------------

// Standard AMD RequireJS define
define([
        'config',
        'lib/underscore',
        'lib/backbone',
        'lib/backbone-relational',
        'lib/backbone-couchdb'
        ], function(config){
    // Fill this with your database information.

    // `ddoc_name` is the name of your couchapp project.
    Backbone.couch_connector.config.db_name = "rcl";
    Backbone.couch_connector.config.ddoc_name = "rcl";
    // If set to true, the connector will listen to the changes feed
    //  and will provide your models with real time remote updates.
    Backbone.couch_connector.config.global_changes = true;
    // This setting enables the code/features in this pull request:
    //  https://github.com/janmonschke/backbone-couchdb/pull/25
    Backbone.couch_connector.config.single_feed = true;
    // Reload the page when the design doc changes
    var db = config.db
    changes = db.changes();
    changes.onChange(function(data){
        for (var i=0; i<data.results.length; i++){
            if (data.results[i].id == '_design/rcl'){
                window.location.reload()
            }
        }
    }) 
    
    // Define model objects & collections for querying the database
    
    // Define link objects for many-to-many relations
    CGroup_Cong = Backbone.RelationalModel.extend({})
    CGroup_Person = Backbone.RelationalModel.extend({})
    CGroup_Role = Backbone.RelationalModel.extend({})
    Cong_Person = Backbone.RelationalModel.extend({})
    Office_Person = Backbone.RelationalModel.extend({})
    Person_Role = Backbone.RelationalModel.extend({})

    CGroup = Backbone.RelationalModel.extend({
        collection:'CGroups',
        urlRoot:'/cgroup',
        // All defaults are commented out because they are here only for the purpose 
        //  of documenting the schema, and we don't need all these attributes to appear 
        //  on every actual instance of a model object.
//        defaults:{
//            name: '',
//            abbreviaton: '',
//            website: ''
//        },
        relations:[
                   {
                       type:'HasMany', // many-to-many
                       key: 'congregations',
                       relatedModel: 'CGroup_Cong',
                       collectionType:'Congs',
                       //includeInJSON:'_id',
                       includeInJSON:true,
                       reverseRelation: {
                           key: 'cgroup'
                       }
                   },
                   {
                       type:'HasMany', // many-to-many
                       key: 'people',
                       relatedModel: 'CGroup_Person',
                       collectionType:'People',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'cgroup',
                           includeInJSON:'_id'
                       }
                   },
                   {
                       type:'HasMany', // many-to-many
                       key: 'roles',
                       relatedModel: 'CGroup_Role',
                       collectionType:'Roles',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'cgroup',
                           includeInJSON:'_id'
                       }
                   },
                   {
                       type:'HasMany', // one-to-many
                       key: 'directories',
                       relatedModel: 'Directory',
                       collectionType:'Directories',
                       includeInJSON:'_id',
                       // reverseRelation: {
                       //     key: 'cgroup',
                       //     includeInJSON:'_id'
                       // }
                   }
                   ]
    })
    CGroups = Backbone.Collection.extend({
        model:CGroup,
        url:'/cgroups'
    })
    CGroupsByAbbrOrName = Backbone.Collection.extend({
        model:CGroup,
        url:'/cgroups',
        db:{
            view: 'cgroups_by_abbreviation_or_name'
        }
    })
    Cong = Backbone.RelationalModel.extend({
      urlRoot:'/cong',
      collection:'Congs',
//      defaults:{
//          name : '',
//          meeting_address1 : '',
//          meeting_address2:'',
//          meeting_city:'',
//          meeting_state:'',
//          meeting_zip:'',
//          meeting_country:'',
//          lat:'',
//          lng:'',
//          mailing_address1:'',
//          mailing_address2:'',
//          mailing_city:'',
//          mailing_state:'',
//          mailing_zip:'',
//          mailing_country:'',
//          phone:'',
//          fax:'',
//          email:'',
//          website:'',
//          service_info:'',
//          date_founded:'', // date
//          number_of_members:'', // integer
//          range_of_number_of_members:'', // textual range, like '20-30' members, where estimates are 
//                                         //   permitted/preferred or the only available data
//          organized:'', // boolean, defines whether this is a mission work or an organized congregation
//          source:'', // Foreign key:  Which source this cong's data came from
//          source_cong_id:'', // The ID of this cong in the source's database
//      },
      relations:[
                 {
                     type:'HasMany', // many-to-many
                     key: 'cgroups',
                     relatedModel: 'CGroup_Cong',
                     collectionType:'CGroups',
                     includeInJSON:true,
                     reverseRelation: {
                         key: 'congregation',
                         includeInJSON:'_id'
                     }
                 },
                 {
                     type:'HasMany', // many-to-many
                     key: 'people',
                     relatedModel: 'Cong_Person',
                     collectionType:'People',
                     includeInJSON:'_id',
                     reverseRelation: {
                         key: 'congregation',
                         includeInJSON:'_id'
                     }
                 }
                 ]
    })
    Congs = Backbone.Collection.extend({
        model:Cong,
        url:'/congs'
    })
    CongsByName = Backbone.Collection.extend({
        model:Cong,
        url:'/congs',
        db:{
            view: 'congs_by_name'
        }
    })
    Person = Backbone.RelationalModel.extend({
        urlRoot:'/person',
        collection:'People',
//        defaults: {
//                    prefix:'',
//                    firstname:'',
//                    lastname:'',
//                    suffix:'',
//                    phone:'',
//                    email:''
//        },
        relations:[
                   {
                       type:'HasMany', // many-to-many
                       key: 'congregations',
                       relatedModel: 'Cong_Person',
                       collectionType:'Congs',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany', // many-to-many
                       key: 'groups',
                       relatedModel: 'CGroup_Person',
                       collectionType:'CGroups',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany', // many-to-many
                       key: 'roles',
                       relatedModel: 'Person_Role',
                       collectionType:'Roles',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany', // many-to-many
                       key: 'offices',
                       relatedModel: 'Office_Person',
                       collectionType:'Offices',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'person',
                           includeInJSON:'_id'
                       }
                   }
                   ]
    })
    People = Backbone.Collection.extend({
        model:Person,
        url:'/people'
    })
    Directory = Backbone.RelationalModel.extend({
        collection:'Directories',
        urlRoot:'/directory',
//          defaults:{
//          url:'', // url of directory's main page
//          url_html:'', // HTML of directory's main page
//          get_url_html:'', // '', 'requested', 'getting', or 'gotten'
//          pagetype:'', // html or rss
//          state_page_urls:'', // template URL of state pages
//          state_url_html:'', // HTML of state page
//          state_url_method:'', // 'get' or 'post', tells Node script which to use
//          get_state_url_html:'', // '', 'requested', 'getting', or 'gotten'
//          state_page_values:[], // list of select box options for this directory's states
//          select_element_xpath:'' // xpath of the select element containing state IDs
//        },
        relations:[
                   {
                       type:'HasOne', // many-to-one
                       key: 'cgroup',
                       relatedModel: 'CGroup', // was 'CGroup_Directory'
                       collectionType:'CGroups',
                       includeInJSON:'_id',
                       // reverseRelation: {
                       //     key: 'directories',
                       //     // TODO: Is this needed?
                       //     includeInJSON:'_id'
                       // }
                   }
                   ]
    })
    Directories = Backbone.Collection.extend({
        model:Directory,
        url:'/directories'
    })
    DirectoriesByURL = Backbone.Collection.extend({
        model:Directory,
        url:'/directories',
        db:{
            view: 'directories_by_url'
        }
    })
    Office = Backbone.RelationalModel.extend({
        collection:'Offices',
        urlRoot:'/office',
//        defaults:{
//            name: ""
//        },
        relations:[
                   {
                       type:'HasMany', // many-to-many
                       key: 'people',
                       relatedModel: 'Office_Person',
                       collectionType:'People',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'office',
                           // TODO: Is this needed?
                           includeInJSON:'_id'
                       }
                   }
                   ]
    })
    Offices = Backbone.Collection.extend({
        model:Office,
        url:'/offices'
    })
    Role = Backbone.RelationalModel.extend({
        collection:'Roles',
        urlRoot:'/role',
//        defaults:{
//            name:''
//        },
        relations:[
                   {
                       type:'HasMany', // many-to-many
                       key: 'people',
                       relatedModel: 'Person_Role',
                       collectionType:'People',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'role',
                           // TODO: Is this needed?
                           includeInJSON:'_id'
                       }
                   },
                   {
                       type:'HasMany', // many-to-many
                       key: 'cgroups',
                       relatedModel: 'CGroup_Role',
                       collectionType:'CGroups',
                       includeInJSON:'_id',
                       reverseRelation: {
                           key: 'role',
                           // TODO: Is this needed?
                           includeInJSON:'_id'
                       }
                   }
                   ]
    })
    Roles = Backbone.Collection.extend({
        model:Role,
        url:'/roles'
    })
    
    // Define convenience functions
    // TODO: Put these convenience functions into a base class/object that can be used as a mixin
    //  in the objects above.
    function get_one(collection, keys, options) {
        var coll = new collection
        coll.db.keys = keys
        coll.fetch({success:function(col, res){
            var model = col.at(0)
            if (typeof(options.success) !== 'undefined'){
                options.success(model)
            }
        }
        })
    }
    function create_one(collection, attrs_obj, options){
        var coll = new collection
        var model = coll.create(attrs_obj, {success:function(model){
            if (typeof(options.success) !== 'undefined'){
                options.success(model)
            }
        }})
    }
    function get_or_create_one(coll, search_keys, attrs, options){
        get_one(coll, 
              search_keys,
              {success:function(doc){
                  if (typeof(doc) === 'undefined'){
                      // The doc didn't exist in the db, so create it
                      create_one(coll,
                               attrs,
                               {success:function(doc){
                                   if (typeof(options.success) !== 'undefined'){
                                       options.success(doc)
                                   }
                               }}
                      )
                  }else{
                      // The doc did exist in the db, so use it
                      if (typeof(options.success) !== 'undefined'){
                          options.success(doc)
                      }
                  }
              }}
        )
    }
    
    return {
        // link object models
        CGroup_Cong: CGroup_Cong,
        Cong_Person: Cong_Person,
        CGroup_Person: CGroup_Person,
        CGroup_Role: CGroup_Role,
        Office_Person: Office_Person,
        Person_Role: Person_Role,
        // regular object models
        CGroup: CGroup,
        Cong: Cong,
        Directory: Directory,
        Directories: Directories,
        Person: Person,
        Office: Office,
        Role: Role,
        // collections
        CGroups:CGroups,
        CGroupsByAbbrOrName:CGroupsByAbbrOrName,
        Congs:Congs,
        CongsByName: CongsByName,
        Directories:Directories,
        DirectoriesByURL:DirectoriesByURL,
        People:People,
        Offices:Offices,
        Roles:Roles,
        // Convenience functions
        get_one:get_one,
        create_one:create_one,
        get_or_create_one:get_or_create_one
    }
})