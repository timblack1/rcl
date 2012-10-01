// Define require() from require.js using the standard AMD define
define(['model'], function(model){
    // TODO: Is this needed within RequireJS?
    // Encapsulate app code and execute it on domReady event
    // Apache 2.0 J Chris Anderson 2011
    $(function() {   
        // TODO: Is this still needed?  It came as part of the Evently couchapp
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
        
        // Enables Mustache.js-like templating.
        _.templateSettings = {
          interpolate : /\{\{(.+?)\}\}/g
        };
    
        // Example of how to save a many-to-many relation to the datbase
        // Instantiate group of congs
        congs = new model.Congs
        // Instantiate congregation model
        // TODO: Should this be global or not?
        cong1 = congs.create({
            name:'Caney OPC',
            mailing_state:'KS'
        })
        // Save congregation model so we can get its _id
        cong1.save({}, {success:function(){
            // Instantiate second congregation model
            cong2 = congs.create({
                name:'Bartlesville OPC',
                mailing_state:'OK'
            })
            // Save second congregation model so we can get its _id
            cong2.save({},{success:function(){
                // Create CGroup model and add congregations to it
                OPC = new model.CGroup({
                    name:'Orthodox Presbyterian Church',
                    abbreviation:'OPC'
                })
                // Add congregations to cgroup
                OPC.get('congregations').add({_id:cong1.get('_id')})
                OPC.get('congregations').add({_id:cong2.get('_id')})
                
                // Save CGroup model to the database so we can get its _id
                OPC.save({}, {success:function(){
                    // Add cgroup to congs' cgroups
                    $.each([cong1,cong2], function(key, cong){
                        cong.get('cgroups').add({_id:OPC.get('_id')})
                        cong.save()
                    })
                }});
            }})
        }})
        // TODO: Figure out the syntax for restoring many-to-many relations from the database 
        // TODO: Figure out the syntax for querying via relations in the database.
        //  It appears to be by creating a collection whose url points to a CouchDB view,
        //  then querying (an instance of) that collection using CouchDB query options
        var congs2 = new model.Congs
        congs2.fetch()
        //console.log(congs2)
    
        // TODO: Create views here
        // TODO: This tutorial shows how to use RequireJS with Backbone:
        //  http://backbonetutorials.com/organizing-backbone-using-modules/
        
        // Main application
        var App = Backbone.Router.extend({
          initialize : function(){
          
          }
        });
        // TODO: Call App() and other views if necessary
     });
});