define([
        'config',
        'model',
        'mustache',
        'text!views/FindAChurch/CongInfowindow.html',
        'text!views/FindAChurch/Address.html',
        'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
        ], 
        function(config, model, Mustache, CongInfowindowTemplate, AddressTemplate){

    return Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'location_keyup', 'add_listener', 'do_search', 'add_listener', 
                'close_infowindows', 'remove_markers', 'plot_congs_on_map')
            window.app.geocoder = new google.maps.Geocoder();
            // TODO: Decide which variables should be passed into this and other views from main.js.
            //    Maybe just pass this.parent, and put all of the above in the parent, except for any which are
            //        possible to set as defaults in the view constructor
            
            // Not yet passed in
            //    this.markers
            //    this.infowindow
            //    this.map
            
            // Passed as defaults into view constructor
            //    this.collection
            
            // TODO: Start here.  Use search location & parameters to update congs collection, not map directly
            
        },
        render: function(){
            // TODO: Convert this to use Mustache
            config.render_to_id(this, "#search_template")
            
            // Attach search event handler to search button and text box
            $('.search').click(this.do_search)
            $('.location').keyup(this.location_keyup)
            $('#radius').on('change', this.do_search)
            // $('#radius').on('change', ($('.search').click())
            // Attach event handler to display new congs when the map's bounds change
            this.add_listener()
        },
        location_keyup:function(event){
            if (event.which == 13){
                this.do_search(event)
            }
        },
        add_listener:function(){
            // Attach event handler to display new congs when the map's bounds change
            var thiz = this
            google.maps.event.addListener(window.app.map, 'idle', function(event){
                thiz.plot_congs_on_map()
            })
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
        		    thiz.plot_congs_on_map()
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
                location = window.app.map.getCenter().toUrlValue()
            } 
            this.geocode(location)
        }
    });
});