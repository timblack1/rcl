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
      
    var Cong = Backbone.RelationalModel.extend({
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
      urlRoot:'/cong',
      relations:[
                 {
                     type:'HasMany',
                     key: 'people',
                     relatedModel: 'CongPerson',
                     reverseRelation: {
                         key: 'congregations'
                     }
                 },
                 // TODO: create link object
                 {
                     type:'HasMany',
                     key: 'groups',
                     relatedModel: 'CGroupCong',
                     reverseRelation: {
                         key: 'congregations'
                     }
                 }
                 ]
    });
    // TODO: Should this be global or not?
    cong1 = new Cong({
        name:'Caney OPC',
        mailing_state:'KS'
    })
    cong1.save({}, {success:function(){
        cong1.set({name:'Caney OPC, second version'}).save()
    }})
    
    var CongList = Backbone.Collection.extend({
      url : "/cong",
      model : Cong,
      // The congs should be ordered by name
      comparator : function(cong){
        return cong.get("name");
      }
    });
//    var Congs = new CongList()
//    Congs.add(cong1)
    
    // A link object between 'Cong' and 'Person', to achieve many-to-many relations.
    var CongPerson = Backbone.RelationalModel.extend({
    })
    
    var Person = Backbone.RelationalModel.extend({
        urlRoot:'/person',
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
                       relatedModel: 'CongPerson',
                       reverseRelation: {
                           key: 'people'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany',
                       key: 'groups',
                       relatedModel: 'CGroupPerson',
                       reverseRelation: {
                           key: 'people'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany',
                       key: 'roles',
                       relatedModel: 'PersonRole',
                       reverseRelation: {
                           key: 'people'
                       }
                   },
                   // TODO: create link object
                   {
                       type:'HasMany',
                       key: 'offices',
                       relatedModel: 'OfficePerson',
                       reverseRelation: {
                           key: 'people'
                       }
                   }
                   ]
    })
    var PersonList = Backbone.Collection.extend({
      url : "/people",
      model : Person,
      // The people should be ordered by lastname, firstname
      comparator : function(obj){
        return obj.get("lastname") + obj.get("firstname");
      }
    });
    var People = new PersonList()
    

    // TODO: Create views here
    
    var App = Backbone.Router.extend({
      initialize : function(){
      
      }
    });
    // TODO: Call App() and other views if necessary
 });