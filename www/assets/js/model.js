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
        'backbone_hoodie'
        ], function(config, Backbone){
    // Fill this with your database information.

    Backbone.connect() // creates a new hoodie at Backbone.hoodie
    var hoodie = Backbone.hoodie
    // Reload the page when the design doc changes
    // TODO: This doesn't work with Hoodie, since there isn't a design doc in the database.
//     hoodie.store.on('change', function(eventName, data){
//         for (var i=0; i<data.results.length; i++){
//             if (data.results[i].id == '_design/rcl'){
//                 window.location.reload()
//             }
//         }
//     })
    // Provide a model scope for backbone-relational to use to relate models
    modelStore = {}
    Backbone.Relational.store.addModelScope(modelStore)
    
    // Define base classes
    
    var CollectionBase = Backbone.Collection.extend({}, {
        get_local_models:function(attrs){
            // TODO: First use modeltype.findOrCreate() to return the model if it already exists in the local store
            //  Problem:  Sometimes I don't know the existing model's id at this point.
            //  Solution: Maybe I can test for an _id, then use findOrCreate() if there is an _id
            // See if the attrs exist in a model in the local store already, so as not to duplicate it.
            //debugger;
            if (typeof attrs._id !== 'undefined'){
                var coll = new this;
                return [coll.model.findOrCreate(attrs)]
            }
            return _.chain(Backbone.Relational.store._collections)
                .map(function(scoll){ return scoll.findWhere(attrs) })
                // Get rid of undefined items in the array.
                .reject(function(item){return typeof item == 'undefined'})
                .value();
        },
        get_one:function(keys, attrs, options) {
            var local_models = this.get_local_models(attrs)
            // Prevent creating the model in the database if it already exists in the local store.
            if (typeof local_models !== 'undefined' && local_models.length > 0){
                var mod = local_models[0]
                options.success(mod)
            }else{
                // The model was not in the local store, so search for it in the database
                var coll = new this
                coll.db.keys = keys
                coll.fetch({
                    success:function(col, res){
                        var model = col.at(0)
                        if (typeof(options.success) !== 'undefined'){
                            options.success(model)
                        }
                    },
                    error:function(){
                        console.error('Could not get_one')
                        if (typeof options.error !== 'undefined'){
                            options.error()
                        }
                    }
                })
            }
        },
        create_one:function(attrs_obj, options){
            var local_models = this.get_local_models(attrs_obj)
            // Prevent creating the model in the database if it already exists in the local store.
            if (typeof local_models !== 'undefined' && local_models.length > 0){
                var mod = local_models[0]
                options.success(mod)
            }else{
                var coll = new this
                // TODO: Is Backbone updating the client model twice, once before saving to
                //  the server, and once after saving to the server?  But if so, why would
                //  this cause backbone-relational to say we are trying to instantiate two
                //  models with the same ID?
                // Only use findModel on directories
                // TODO: Start here
                if (coll.url == '/directory' && attrs_obj.url){
                    var attributes = attrs_obj;
                    coll.model.findModel = function(attributes){
                        // Try to find an instance of 'this' model type in the store
                        var model = Backbone.Relational.store.find( this, attributes );
                        if ( !model && _.isObject( attributes ) ) {
                            model = coll.find( function( m ) {
                                return m.url === attributes.url;
                            });
                        }
                        return model;
                    }
                }
                var model = coll.create(attrs_obj, {
                    wait:true,
                    success:function(model){
                        // TODO: It seems the error occurs before this point, because the
                        //  breakpoint below never gets hit.
                        // TODO: Could the race condition be here?  Steps:
                        //  The collection creates a new local model.
                        //  If (wait:false){ The new model is added to the collection.}
                        //  The collection saves the new model to the server
                        //  If (wait:true){ The new model is added to the collection.}
                        //debugger;
                        if (typeof(options.success) !== 'undefined'){
                            options.success(model)
                        }
                    },
                    error:function(){
                        console.error('Could not create_one')
                        if (typeof options.error !== 'undefined'){
                            options.error()
                        }
                    }
                })
            }
        },
        get_or_create_one:function(search_keys, attrs, options){
            var thiz = this
            this.get_one(search_keys, attrs, {success:function(doc){
                // TODO: The duplicate id occurs after this, without being prevented by the conditional block above.
                //  When I pause the debugger here, I don't get the error.
                //  So I should try putting the debugger later in the options.success callbacks to see at which
                //  stage the error is thrown.
                //debugger;
                if (typeof(doc) === 'undefined'){
                    // The doc didn't exist in the db, so create and return it
                    thiz.create_one(attrs, {
                        success:function(doc){
                            // TODO: The error appears before this line.
                            console.warn('Start here 2014')
                            // debugger;
                            if (typeof(options.success) !== 'undefined'){
                                options.success(doc)
                            }
                        }
                    })
                }else{
                    // The doc did exist in the db, so return it
                    if (typeof(options.success) !== 'undefined'){
                        options.success(doc)
                    }
                }
            }})
        }
    })
    
    // Define model objects & collections for querying the database
    
    // Define link objects for many-to-many relations
    modelStore.CGroup_Cong = Backbone.RelationalModel.extend({})
    modelStore.CGroup_Person = Backbone.RelationalModel.extend({})
    modelStore.CGroup_Role = Backbone.RelationalModel.extend({})
    modelStore.Cong_Person = Backbone.RelationalModel.extend({})
    modelStore.Office_Person = Backbone.RelationalModel.extend({})
    modelStore.Person_Role = Backbone.RelationalModel.extend({})

    modelStore.CGroup = Backbone.RelationalModel.extend({
        collection:'CGroups',
        urlRoot:'/cgroup',
        type:'cgroup',
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
    modelStore.CGroups = CollectionBase.extend({
        model:modelStore.CGroup,
        url:'/cgroups'
    })
    modelStore.Cong = Backbone.RelationalModel.extend({
        urlRoot:'/cong',
        collection:'Congs',
        type:'cong',
        default_attributes:{
            name : '',
            meeting_address1 : '',
            meeting_address2:'',
            meeting_city:'',
            meeting_region:'',
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
            contact_email:'',
            website:'',
            sermons_url:'',
            service_info:'',
            other_info:'',
            presbytery_name:'',
            pastor_name:'',
            contact_type:'',
            contact_name:'',
            date_founded:'', // date
            number_of_members:'', // integer
            range_of_number_of_members:'', // textual range, like '20-30' members, where estimates are 
                                        //   permitted/preferred or the only available data
            organized:'', // boolean, defines whether this is a mission work or an organized congregation
            source:'', // Foreign key:  Which source this cong's data came from
            source_cong_id:'', // The ID of this cong in the source's database
            page_url:'', // The URL in the source's site
            import_io_guid:'' // The GUID of the import.io source dataset
        },
        initialize: function(){
            // Make congs save themselves immediately when their attributes change
            //    to make Backgrid more useful
            Backbone.RelationalModel.prototype.initialize.apply(this, arguments);
            this.on("change", function (model, options) {
                if (options && options.save === false) return;
                model.save();
            });
        },
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
    modelStore.Congs = CollectionBase.extend({
        model:modelStore.Cong,
        url:'/congs'
    })
    modelStore.Directory = Backbone.RelationalModel.extend({
        collection:'Directories',
        urlRoot:'/directory',
        type:'directory',
//          defaults:{
//          url:'', // url of directory's main page
//          url_data:'', // data returned by directory's main URL
//          pagetype:'', // html or rss
//          state_page_urls:'', // template URL of state pages
//          state_url_html:'', // HTML of state page
//          state_url_method:'', // 'get' or 'post', tells Node script which to use
//          state_page_values:[], // list of select box options for this directory's states
//          select_element_xpath:'' // xpath of the select element containing state IDs
//        },
        relations:[
            {
               type:'HasOne', // many-to-one
               key: 'cgroup',
               // TODO: the directory's 'cgroup' is null in the db
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
    modelStore.Directory.setup()
    modelStore.Directories = CollectionBase.extend({
        model:modelStore.Directory,
        url:'/directory'
    })
    modelStore.Person = Backbone.RelationalModel.extend({
        urlRoot:'/person',
        collection:'People',
        type:'person',
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
    modelStore.People = CollectionBase.extend({
        model:modelStore.Person,
        url:'/people'
    })
    modelStore.Office = Backbone.RelationalModel.extend({
        collection:'Offices',
        urlRoot:'/office',
        type:'office',
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
    modelStore.Offices = CollectionBase.extend({
        model:modelStore.Office,
        url:'/offices'
    })
    modelStore.Role = Backbone.RelationalModel.extend({
        collection:'Roles',
        urlRoot:'/role',
        type:'role',
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
    modelStore.Roles = CollectionBase.extend({
        model:modelStore.Role,
        url:'/roles'
    })
    
    return modelStore
})
