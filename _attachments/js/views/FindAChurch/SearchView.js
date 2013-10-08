define([
        'config',
        'mustache',
        'text!views/FindAChurch/Search.html'
        ], 
        function(config, Mustache, template){

    return Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'location_keyup', 'geocode', 'do_search')
            window.app.geocoder = new google.maps.Geocoder();
        },
        render: function(){
            this.$el.html(Mustache.render(template))
            
            // Attach search event handler to search button and text box
            $('.search').click(this.do_search)
            $('.location').keyup(this.location_keyup)
            $('#radius').on('change', this.do_search)
            // $('#radius').on('change', ($('.search').click())
            
//           Improve User Interface:
//            	   - Try to be able to guess which unit of distance (Mi or KM) they prefer based on some input from the user. TODO: Figure out the right order of if-clauses to use below, and outline it in comments in the code.
//   TODO         	 * Event Handler: On page load
//   TODO       	   * If the distance unit cookie is set, set the distance units in the form based on what is in the cookie.
//   TODO      	       * Else, on page load, before the person searches, guess what units they want based on one of the following:
//   TODO      	         * First try the users' browser's geolocation information. Google for "calculate distance units from geolocation" to see how others have done this. You can geocode the location using window.app.geocoder = new google.maps.Geocoder(); window.app.geocoder.geocode(..., then filter (using the Underscore.js _.filter() method) for results[0].address_components[x].types.short_name == 'US', then if the user is in one of the countries that use miles, select "miles" in the form and save it to the cookie.
//   TODO      	         * Next try figuring it based on the country in which they are searching.
//   TODO      	         * Next, try the browser country or language setting.
//   TODO      	         * Maybe try their IP address (but this might be hard to do from JavaScript in the browser).
            },
        
     
        location_keyup:function(event){
            if (event.which == 13){
                this.do_search(event)
            }
        },
        geocode: function ( address_line){
        	var thiz=this
            window.app.geocoder.geocode( { 'address': $('.location').val()}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                	  // Use Circle() as a helper to avoid doing math. 
//         		    // Convert radius*units to meters
//         		    var radius = $('#radius').val(); 
//         		    var units = $('#units').val();
//         		    var distance;
//         		    if (units == 'miles'){
//         		        distance = radius * 1609.344;
//         		    } else if (units == 'km') {
//         		        distance = radius * 1000;
//         		    }
        		    // Create an instance of Circle() with the selected radius
        		    var loc = results[0].geometry.location;
        		    var center = new google.maps.LatLng(loc.lat(), loc.lng());
        		    var circle = new google.maps.Circle({radius: distance, center: center}); 
        		    // Center and zoom the map to the bounds of the circle. 
        		    window.app.map.setCenter(loc);
        		    window.app.map.fitBounds(circle.getBounds()); // this sets the zoom 
        		    // Plot congs on map
        		    //thiz.plot_congs_on_map()
                    //TODO  Send the request to Google; if Google says the location is ambiguous, then use one of the location methods above (geolocation, etc.) to send Google a hint about in which country the user is attempting to search.
             		//TODO  Event handler: On search results being returned to the browser from the Google Maps API, Google's geocode responses state in which country the searched-for location is found, so after they search, you can set their distance units for them (in a cookie and in the form) based on the country, unless (in a cookie you can see) they have already selected a distance unit manually.


                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });

		},
        do_search: function( event ){
            event.preventDefault()
            // If user submitted an address, put that address into this.model
            // Use location user entered
            // TODO: Start here.  Create a new Backbone model named
            //    search_params and update it [DONE], then update map bounds when it changes.  Create this model
            //    in main.js, then pass it into SearchView as its model, and into
            //    MapView via new View([options]) syntax (accessed as this.options.name).

            // Convert radius*units to meters
            var radius = $('#radius').val(); 
            var units = $('#units').val();
            var distance;
            if (units == 'miles'){
                distance = radius * 1609.344;
            } else if (units == 'km') {
                distance = radius * 1000;
            }
            // Put the above variables into this.model in one action so there's only one change event
            this.model.set({
                location:$('.location').val(),
                radius:radius,
                distance:distance,
                units:units
            })
            
          //  TODO   Event handler: On search form submission, record the currently-selected distance unit in a cookie, and record there whether they selected it manually or not.
//             // TODO: Geocode location, then set new map center in MapView.js
//             location = window.app.map.getCenter().toUrlValue()
            // TODO: Move this code to MapView.js
//             this.geocode(location)
        }
    });
});