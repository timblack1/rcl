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
        'backbone_hoodie',
        'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
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
       default_attributes:{
           name: '',
           abbreviaton: '',
           website: ''
       },
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
            geocode: {
                lat:'',
                lng:''
            },
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
        },
        initialize: function(){
//             // Make congs save themselves immediately when their attributes change
//             //    to make Backgrid more useful
//             Backbone.RelationalModel.prototype.initialize.apply(this, arguments);
//             this.on("change", function (model, options) {
//                 if (options && options.save === false) return;
//                 model.save();
//             });
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
        url:'/congs',
        initialize:function(){
            _.bindAll(this, 'handle_changes', 'geocode', 'test_address_for_numbers', 'delay_next_geocode')
            // Listen to model change, add events
            this.on('add', this.handle_changes)
            this.event_str = [
                'change:meeting_address1 change:meeting_address2 change:meeting_city',
                'change:meeting_state change:meeting_zip change:mailing_address1',
                'change:mailing_address2 change:mailing_city change:mailing_state change:mailing_zip'
            ].join(' ')
            this.listenTo(this, this.event_str, this.handle_changes)
            // Create collection to serve as a queue of the congs which need to be geocoded
            this.geocoder = new google.maps.Geocoder()
            this.geocode_stats = modelStore.geocode_stats
            this.listenTo(this.geocode_stats.get('to_geocode'), 'add', this.geocode)
            // Set integer to report how many congs we are currently geocoding
            this.currently_geocoding = 0
            this.last_geocode_attempt = new Date()
        },
        test_address_for_numbers:function(addr){
            return typeof addr !== 'undefined' && addr.search(/\d/) !== -1;
        },
        handle_changes:function(model, value, options){
            // When this collection changes, geocode or re-geocode any congs that need it
            if (value instanceof Backbone.Collection){
                // This is an add event, and probably originated from a call to congs.fetch() to get all congs
                //  from the local hoodie store.
                // So add only those congs which haven't been geocoded yet.
                var collection = value
                if (typeof model.get('geocode') === 'undefined' ||
                    model.get('geocode').lat == '' ||
                    model.get('geocode').lng == '' ){
                    // Add new cong to this.to_geocode collection
                    this.geocode_stats.get('to_geocode').add(model, {merge: true})
                }
            }else{
                // This is a change event
                // So add changed cong to this.to_geocode collection, merging the changed attributes if
                //  the cong is already in the collection.
                this.geocode_stats.get('to_geocode').add(model, {merge:true})
            }
        },
        delay_next_geocode:function(){
            var thiz = this
            setTimeout(function(){
                thiz.geocode()
            },thiz.geocode_stats.get('usecs'))
        },
        geocode:function(){
            // This prevents two calls to this.geocode() from running at the same time.
            if (this.currently_geocoding > 0){
                return;
            }
            this.currently_geocoding++;
            var thiz = this
            // Pick one cong out of the to_geocode collection
            if (this.geocode_stats.get('to_geocode').length > 0){
                var cong = this.geocode_stats.get('to_geocode').at(0)
            }else{
                return;
            }
            // Format the address to geocode
            // Pick the meeting_address[1|2] which contains a number, else just use meeting_address1
            var address_line = ''
            if (this.test_address_for_numbers(cong.get('meeting_address1'))){
                address_line = cong.get('meeting_address1')
            } else if (this.test_address_for_numbers(cong.get('meeting_address2'))){
                address_line = cong.get('meeting_address2')
            }else{
                address_line = cong.get('meeting_address1')
            }
            // Do the same using mailing_adderss[1|2] if the meeting_address wasn't sufficient
            if (address_line == '' || typeof address_line === 'undefined'){
                if (this.test_address_for_numbers(cong.get('mailing_address1'))){
                    address_line = cong.get('mailing_address1')
                } else if (this.test_address_for_numbers(cong.get('mailing_address2'))){
                    address_line = cong.get('mailing_address2')
                }else{
                    address_line = cong.get('mailing_address1')
                }
            }
            var address =   address_line + ', ' + 
                            (cong.get('meeting_city') ? cong.get('meeting_city') : (cong.get('mailing_city') ? cong.get('mailing_city') : '')) + ', ' + 
                            (cong.get('meeting_state') ? cong.get('meeting_state') : (cong.get('mailing_state') ? cong.get('mailing_state') : '')) + ' ' + 
                            (cong.get('meeting_zip') ? cong.get('meeting_zip') : (cong.get('mailing_zip') ? cong.get('mailing_zip') : ''))
            if (typeof cong.get('address') !== 'undefined' && cong.get('address') != ''){
                address = cong.get('address')
            }
            
            var now = new Date()
            var time_difference = now.getTime() - this.last_geocode_attempt.getTime()
            // This prevents running successive calls to geocode() closer than Google's API allows.
            if (time_difference < this.geocode_stats.get('usecs')){
                return;
            }
            this.geocoder.geocode( { 'address': address }, function(results, status) {
                var now = new Date()
                thiz.last_geocode_attempt = now
                // TODO: Handle when Google returns multiple possible address matches (results.length > 1)
                if (status == google.maps.GeocoderStatus.OK) {
                    var loc = results[0].geometry.location
                    // Save the model
                    cong.save({
                        geocode:{
                            'lat': loc.lat(),
                            'lng': loc.lng()
                        }
                    })
                    thiz.geocode_stats.get('to_geocode').remove(cong)
                    thiz.geocode_stats.set('number_geocoded', thiz.geocode_stats.get('number_geocoded') + 1)
                    thiz.currently_geocoding--;
                    if (thiz.geocode_stats.get('to_geocode').length > 0){
                        // Continue geocoding the remaining congs.
                        // Wait a certain number of milliseconds, then geocode another cong.
                        // NOTE that this calls this function recursively until there are no more congs to geocode.
                        thiz.delay_next_geocode()
                    }
                }else{
                    if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
                        // We were sending the requests too fast, so increase the delay and try again.
                        // Wait to avoid Google throttling the geocode requests (for there being too many
                        //  per second, as indicated by the 'OVER_QUERY_LIMIT' error code)
                        thiz.geocode_stats.set('usecs', thiz.geocode_stats.get('usecs') + 50)
                        thiz.currently_geocoding--;
                        thiz.delay_next_geocode()
                    }else{
                        var reason  =   "Code "+status;
                        var msg     = 'address="' + address + '"; error="' +reason+ '"; (usecs='+thiz.geocode_stats.get('usecs') +'ms)';
                        console.log('Error: ' + msg)
                        if (status == google.maps.GeocoderStatus.ZERO_RESULTS){
                            if (cong.get('mailing_state') == 'PR'){
                                // We've got a Puerto Rico congregation, so need to put 'PR' after the zip
                                //  for Google to geocode it correctly
                                address = address.replace(' PR ', ' ') + ' Puerto Rico'
                                // And we need to correct one incorrectly written street number
                                address = address.replace('7NE', '7 NE')
                                thiz.currently_geocoding--;
                                cong.save({address:address}, {success:thiz.delay_next_geocode})
                            }else if (cong.get('mailing_city') == 'Airdrie'){
                                // TODO: Note this replacement is probably only correct for the OPC in Airdrie, AB,
                                //  so we should filter for that particular congregation
                                thiz.currently_geocoding--;
                                cong.save({address:address.replace('Airdrie', 'Calgary')}, {success:thiz.delay_next_geocode})
                            }else if (cong.get('mailing_city') == 'Sterling' && cong.get('mailing_state') == 'VA'){
                                // TODO: Note this replacement is probably only correct for the OPC in Sterling, VA,
                                //  so we should filter for that particular congregation
                                thiz.currently_geocoding--;
                                cong.save({address:address.replace('Algonkian Pkwy', 'State Route 1582')}, {success:thiz.delay_next_geocode})
                            }else if (cong.get('mailing_city') != ''){
                                // TODO: Try geocoding replacing the meeting_city with the mailing_city
                            }
                        }
                    }
                }
            })
        }
    })
    modelStore.Directory = Backbone.RelationalModel.extend({
        collection:'Directories',
        urlRoot:'/directory',
        type:'directory',
        default_attributes:{
            url:'', // url of directory's main page
            url_data:'', // data returned by directory's main URL
            pagetype:'', // html or rss
            state_page_urls:'', // template URL of state pages
            state_url_html:'', // HTML of state page
            state_url_method:'', // 'get' or 'post', tells Node script which to use
            state_page_values:[], // list of select box options for this directory's states
            select_element_xpath:'', // xpath of the select element containing state IDs
            importio_guid: ''   // found in json.data[0]._source[0]; should be the same 
                                //   for every cong from one import.io data source
        },
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
    modelStore.GeocodeStats = Backbone.RelationalModel.extend({
        urlRoot:'/geocodestats',
        type:'geocodestats',
        defaults: {
            usecs:100, // Google's rate limits are 10/s, 2500/day
            to_geocode: new Backbone.Collection,
            number_to_geocode: function(){ return this.to_geocode.length },
            number_geocoded:0
        }
    })
    modelStore.geocode_stats = new modelStore.GeocodeStats
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
