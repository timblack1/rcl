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
    
        // TODO: Figure out the syntax for saving many-to-many relations to the database 
        //  and restoring them from the database.
        // Instantiate congregation model
        // TODO: Should this be global or not?
        cong1 = new model.Cong({
            name:'Caney OPC',
            mailing_state:'KS'
        })
        // Save congregation model
        cong1.save({}, {success:function(){
            // Instantiate second congregation model
            cong2 = new model.Cong({
                name:'Bartlesville OPC',
                mailing_state:'OK'
            })
            // Save second congregation model
            cong2.save({},{success:function(){
                // Create CGroup model and add congregations to it
                // make an 'OPC' CGroup
                OPC = new model.CGroup({
                    name:'Orthodox Presbyterian Church',
                    abbreviation:'OPC',
                    congregations:[cong1.get('_id'), cong2.get('_id')]
                })
                // The way to associate congregations with the cgroup so they can be saved 
                //  to the database is by adding the congregation._id to the 
                //  cgroup.congregations array 
                // add cong1 & cong2 to the OPC group
                // TODO: Figure out how to add an _id when other ids are already in the array
                //OPC.set('congregations', [cong1.get('_id'), cong2.get('_id')])
                // This one works to at least relate the model objects in the browser
                //OPC.get('congregations').add({congregation:cong1})
                // These don't relate the model objects in the browser
                //OPC.get('congregations').add({_id:cong1.get('_id')})
                //OPC.get('congregations').add({congregation:cong1.toJSON()})
                //OPC.get('congregations').push(cong1.get('_id'))
                console.log(OPC.get('congregations'))
                
                // Save CGroup model to the database
                // TODO: Start here. This isn't saving ids (or full model objects, 
                //  which we don't want) to the db
                OPC.save({}, {success:function(){
                    // Make the OPC group fetch its related congregations' full data 
                    //  from the database.
                    //  We're following http://stackoverflow.com/questions/10871369/how-to-handle-relations-in-backbone-js
                    //  This answer:  http://stackoverflow.com/a/10875400
                    //OPC.fetchRelated('congregations')
                    console.log(OPC.get('congregations'))
                    // This returns correct cong objects
                    // TODO: How can I get backbone-relational to do this for me?
                    // This seems to be about the same problem as http://stackoverflow.com/questions/11669356/how-to-auto-create-many-to-many-relations-from-initial-json-with-backbone-relati
                    $.each(OPC.get('congregations'), function(key, val){ console.log(Cong.findOrCreate(val)); })
                    
                }});
            }})
        }})
        // TODO: Figure out the syntax for querying via relations in the database.
    
//        cong1.save({}, {success:function(){
//            cong1.set({name:'Caney OPC, second version'}).save({}, {success:function(){
//                cong2.save({}, {success:function(){
//                }})
//            }})        
//        }})
    
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