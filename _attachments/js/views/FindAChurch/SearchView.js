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
            // Use location user entered
            var location = $('.location').val()
            if (location == ''){
                // TODO: Start here.  Create a new Backbone model named
                //    search_params and update it, then update map bounds when it changes.  Create this model
                //    in main.js, then pass it into SearchView as its model, and into
                //    MapView via new View([options]) syntax (accessed as this.options.name).
                // Or just use map's center
                // TODO: Avoid accessing the map here somehow; maybe just get congs using the map's center in MapView.js
                location = window.app.map.getCenter().toUrlValue()
            } 
            this.geocode(location)
        }
    });
});