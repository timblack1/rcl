define([
        'config',
        'mustache',
        'text!views/FindAChurch/CongInfowindow.html',
        'text!views/FindAChurch/Address.html'
        ], 
        function(config, Mustache, CongInfowindowTemplate, AddressTemplate){

    return Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'location_keyup', 'geocode', 'do_search')
            window.app.geocoder = new google.maps.Geocoder();
        },
        render: function(){
            // TODO: Convert this to use Mustache
            config.render_to_id(this, "#search_template")
            
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
        		    // Convert radius*units to meters
        		    var radius = $('#radius').val(); 
        		    var units = $('#units').val();
        		    var distance;
        		    if (units == 'miles'){
        		        distance = radius * 1609.344;
        		    } else if (units == 'km') {
        		        distance = radius * 1000;
        		    }
        		    // Create an instance of Circle() with the selected radius
        		    var loc = results[0].geometry.location;
        		    var center = new google.maps.LatLng(loc.lat(), loc.lng());
        		    var circle = new google.maps.Circle({radius: distance, center: center}); 
        		    // Center and zoom the map to the bounds of the circle. 
        		    window.app.map.setCenter(loc);
        		    window.app.map.fitBounds(circle.getBounds()); // this sets the zoom 
        		    // Plot congs on map
                    // TODO: Start here.  Just update congs collection, not map directly
        		    //thiz.plot_congs_on_map()
                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });

		},
        do_search: function( event ){
            // If user submitted an address,
            // Geocode user-submitted address
            event.preventDefault()
            // Clear any existing markers from map
            this.remove_markers()
            // Use location user entered
            var location = $('.location').val()
            if (location == ''){
                // Or just use map's center
                // TODO: Avoid accessing the map here somehow; maybe just get congs using the map's center in MapView.js
                location = window.app.map.getCenter().toUrlValue()
            } 
            this.geocode(location)
        }
    });
});