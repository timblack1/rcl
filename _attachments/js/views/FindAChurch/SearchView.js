define([
        'config',
        'mustache',
		'jquery_cookie',
        'text!views/FindAChurch/Search.html'
        ], 
        function(config, Mustache, jquery_cookie, template){

    return Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'location_keyup', 'geocode')
            window.app.geocoder = new google.maps.Geocoder();
        },
        render: function(){
            this.$el.html(Mustache.render(template))
            
            // Attach search event handler to search button and text box
            $('.search').click(this.geocode)
            $('.location').keyup(this.location_keyup)
            $('.radius').on('change', this.geocode)
            
            // TODO: Improve User Interface:
            // TODO: - Try to be able to guess which unit of distance (Mi or KM) they prefer based on 
            //  some input from the user.
            // TODO:   * Event Handler: On page load
			
            // TODO:     * If the distance unit cookie is set,
			if ( this.is_distance_unit_cookie_set() ){
				// TODO:  set the distance units in the form based
            	//              on what is in the cookie.
				
			}
            // TODO:     * Else, on page load, before the person searches, 
			else {
				// TODO: guess what units they want based 
            	//                  on one of the following:
				
			}
            // TODO:       * First try the users' browser's geolocation information. If 
            //                  the user is in one of the countries that use miles, select "miles" in the form
            //                  and save it to the cookie.
			
			
			var thiz=this
			
			if (navigator.geolocation){
				// Center the map on the viewer's country by default
				navigator.geolocation.getCurrentPosition(function(position){			
					window.app.geocoder = new google.maps.Geocoder();
					window.app.geocoder.geocode( { 'address': position.coords.latitude + "," + position.coords.longitude}, function(results, status) {
					//	Underscore.js _.filter() method) for results[0].address_components[x].types.short_name == 'US'
						if (status == google.maps.GeocoderStatus.OK){
							var use_miles_array = _.filter(results, function(item){ 
								var long_names = _.pluck (item.address_components, "long_name")
								//See if it contains countries that use miles (GB, LR, MM, US)
								var country_name = _.intersection(["United Kingdom", "Liberia", "Myanmar", "United States"], long_names)[0]
								return (country_name !== "")
							});
							if (use_miles_array.length >0) {
							    // Set the form to use miles here
								thiz.$('.units').val('miles')
							}else{
								thiz.$('.units').val('km')
							}
						}
					})
				})
			}else{
				console.log("Geolocation is not supported by this browser.");
				// TODO: Find a different way to locate the user, perhaps by IP address
				this.create_map({coords:this.default_map_center})
			}
				
			
			// TODO:       * Next, try the browser country or language setting.		
            // TODO:       * Next try figuring it based on the country in which they are searching.
            // TODO:       * Maybe try their IP address (but this might be hard to do from JavaScript in the browser).
			

			
        },
		is_distance_unit_cookie_set:function(){
			// TODO: Get cookie here
			
		},
		set_distance_unit_cookie:function(){
			// TODO: Set cookie here
			
		},
        location_keyup:function(event){
            if (event.which == 13){
                this.geocode(event)
            }
        },
        geocode: function (event){
            event.preventDefault()
            // If user submitted an address, put that address into this.model
            // Use location user entered

            // Convert radius*units to meters
            var radius = $('.radius').val(); 
            var units = $('.units').val();
            var distance;
            if (units == 'miles'){
                distance = radius * 1609.344;
            } else if (units == 'km') {
                distance = radius * 1000;
            }
            
            // TODO: Event handler: On search form submission, record the currently-selected distance unit
            //  in a cookie, and record there whether they selected it manually or not.
            // Geocode location
        	var thiz=this
            var location = $('.location').val()
            if (location == ''){
                location = thiz.model.get('location')
            }
            window.app.geocoder.geocode( { 'address': location}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    // Put the above variables into this.model in one action so there's only one change event
                    thiz.model.set({
                        location:location,
                        radius:radius,
                        distance:distance,
                        units:units,
                        results:results
                    })
                    // TODO: Send the request to Google; if Google says the location is ambiguous, 
                    //  then use one of the location methods above (geolocation, etc.) to send Google
                    //  a hint about in which country the user is attempting to search.
             		// TODO: Event handler: On search results being returned to the browser from the 
                    //  Google Maps API, Google's geocode responses state in which country the searched-for 
                    //  location is found, so after they search, you can set their distance units for them 
                    //  (in a cookie and in the form) based on the country, unless (in a cookie you can see)
                    //  they have already selected a distance unit manually.
                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });
		}
    });
});