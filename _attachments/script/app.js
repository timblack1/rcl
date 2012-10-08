// Define require() from require.js using the standard AMD define
define(['model', 'async!https://maps.googleapis.com/maps/api/js?sensor=false',
        'lib/jquery.couchLogin'], function(model){
    
    var path = unescape(document.location.pathname).split('/'),
        db = $.couch.db(path[1]);
    $("#account").couchLogin({});
   
    // TODO: Put custom evently code here
    
    // Evently version
    // TODO: Migrate these Evently widgets to Backbone views
    $.couch.app(function(app) {
        $("#mainmenu").evently("mainmenu", app);
        $("#map").evently("map", app);
        $("#search_container").evently("search", app);
    });

    // ------------------------------------------------------------------
    // Backbone version
    // ------------------------------------------------------------------
    
    // TODO: This should probably go into a configuration file
    // Enables Mustache.js-like templating.
    _.templateSettings = {
      interpolate : /\{\{(.+?)\}\}/g
    };

    // Example of how to save a many-to-many relation to the database
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
                // TODO: This isn't working
                // Note that one reason might be that it isn't created the same way OPC is above,
                //  but adding congregations to OPC is working.
                cong1.get('cgroups').add({_id:OPC.get('_id')})
//              console.log(cong1.get('cgroups'))
                console.log(cong1)
//                // TODO: This isn't working either
//                $.each([cong1,cong2], function(key, cong){
//                    cong.get('cgroups').add({_id:OPC.get('_id')})
//                    cong.save()
//                })
            }});
        }})
    }})
    // TODO: Figure out the syntax for restoring many-to-many relations from the database 
    // TODO: Figure out the syntax for querying via relations in the database.
    //  It appears to be by creating a collection whose url points to a CouchDB view,
    //  then querying (an instance of) that collection using CouchDB query options
    // Note:  Just instantiating a new Collection like this populates it from the db,
    //  which may be all we need to do, if the relations are recorded properly above.
    //  Or we may have to call .fetch() on each relationship's collection.
    congs2 = new model.Congs
    
    // TODO: Create Backbone views here
    // TODO: Move views into separate files when they get too numerous here
    //  This tutorial shows how to use RequireJS with Backbone:
    //  http://backbonetutorials.com/organizing-backbone-using-modules/
    MapView = Backbone.View.extend({
        initialize: function(){
            this.render();

        	// TODO: Migrate the code below into Backbone events
        	
        	// Attach events to search_the_map form elements
        	$('#search').click(function() {
        		codeAddress();
        		return false;
        	});
        	$('#search_the_map').keypress(function(event) {
        		if (event.which==13){ // The user pressed the enter key
        			event.preventDefault();  // Prevent the default action of submitting the form
        			codeAddress();
        			return false; // This might help some browsers avoid submitting the form
        		}
        	});
        },
        render: function(){
            var template = _.template( $("#map_template").html(), {} );
            $(this.el).html( template );
            // Initialize Google map
            // TODO: We are trying to get the AJAX request to work on the "on key up" event; but no luck so far. 
            var geocoder;
            var map;
            function initialize() {
                geocoder = new google.maps.Geocoder();
                // TODO: Center the map on the viewer's country
                var latlng = new google.maps.LatLng(-34.397, 150.644);
                var myOptions = {
                        zoom: 8,
                        center: latlng,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                }
                map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
            }
            initialize();
        },
        events: {
            "click input[type=button]": "doSearch"
        },
        doSearch: function( event ){
            // Button clicked, you can access the element that was clicked with event.currentTarget
            alert( "Search for " + $("#search_input").val() );
        }
    });
    // TODO: Move form elements into Backbone view
    //  - Copy above view to below
    //  - in initialize:  Delete all but this.render();
    //  - in render:  Delete all but the first two lines, then modify the first two lines to
    //      reference a container div with the correct ID
    //  - in doSearch:  Find our existing code that handles the "change" event in the 
    //      input & select elements, put it into doSearch, rename doSearch to appropriately describe
    //      that code, then modify the events: section above to call that doSearch function when
    //      the change event happens in the input & select boxes
    //  - Instantiate this new view in a variable below. 

    // TODO: Should this view initialization be done in the App below?
    var map_view = new MapView({ el: $("#map") });
    
    // TODO: Create main application
    var App = Backbone.Router.extend({
      initialize : function(){
          // TODO: Set up URLs here
      }
    });
    // TODO: Call App() and other views if necessary
});