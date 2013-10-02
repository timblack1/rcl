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
            
//             // TODO: Geocode location, then set new map center in MapView.js
//             location = window.app.map.getCenter().toUrlValue()
            // TODO: Move this code to MapView.js
//             this.geocode(location)
        }
    });
});