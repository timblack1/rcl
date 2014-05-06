define([
        'config',
        'mustache',
		'jquery_cookie',
        'text!views/FindAChurch/Search.html'
        ], 
        function(config, Mustache, jquery_cookie, template){

    return Backbone.View.extend({
        initialize: function(){
            _.bindAll(this, 'location_keyup', 'geocode', 'set_distance_unit_cookie',
                'is_distance_unit_cookie_set', 'get_distance_units', 'location_keyup')
            window.app.geocoder = new google.maps.Geocoder();
        },
        render: function(){
            this.$el.html(Mustache.render(template))
            
            // Attach search event handler to search button and text box
            this.listenTo(this.$('.search'), 'click', this.geocode)
            this.listenTo(this.$('.location'), 'keyup', this.location_keyup)
            this.listenTo(this.$('.radius'), 'change', this.geocode)
            this.listenTo(this.$('.units'), 'change', this.set_distance_unit_cookie)
            
            // TODO: Improve User Interface:
            // TODO: - Try to be able to guess which unit of distance (Mi or KM) they prefer based on 
            //  some input from the user.
            // TODO:   * Event Handler: On page load
			
            //If the distance unit cookie is set,
			// set the distance units in the form based on what is in the cookie.
			if ( this.is_distance_unit_cookie_set() ){
				this.$('.units').val($.cookie('units_of_measurement'));		
			}
            // TODO:     * Else, on page load, before the person searches, 
			else {
				// TODO: guess what units they want based on one of the following:
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
                                // Set the user's location's country's distance units in the form
                                thiz.$('.units').val(thiz.get_distance_units(results))
                            }
                        })
                    })
                }else{
                    console.log("Geolocation is not supported by this browser.");
                    // TODO: Find a different way to locate the user, perhaps by IP address
                    this.create_map({coords:this.default_map_center})
                }

                // TODO:       * Next try figuring it based on the country in which they are searching.
                // TODO:       * Next, try the browser country or language setting.
                // TODO:       * Maybe try their IP address (but this might be hard to do from JavaScript in the browser).
				
			}
        },
		is_distance_unit_cookie_set:function(){
			// Get cookie here
			$.cookie('units_of_measurement')
			if (typeof $.cookie('units_of_measurement') === 'undefined'){
				return false;
			}else{
				return true
			}
		},
		set_distance_unit_cookie:function(){
			//  Set cookie here
			$.cookie('units_of_measurement', this.$('.units').val());		
			
		},
        location_keyup:function(event){
            if (event.which == 13){
                this.geocode(event)
            }
        },
		get_distance_units:function(results){
            var country_names_objects = _.filter(results[0].address_components, function(item){
            	//See if it contains countries that use miles (GB, LR, MM, US)
                return ["United Kingdom", "Liberia", "Myanmar", "United States"].indexOf(item.long_name) !== -1
			});
            country_names = _.chain(country_names_objects)
                .pluck('long_name')
                .filter(function(item){ return typeof item !== 'undefined'; })
                .value()
            if (country_names.length >0){
                output = 'miles'
            }else{
                output = 'km'
            }
            return output;
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
					//START HERE  This function needs to be edited next.
					
					debugger;
					if (!thiz.is_distance_unit_cookie_set()){
						var distance_units = thiz.get_distance_units(results)
						debugger;
						$.cookie('units_of_measurement',distance_units)	
					//set the cookie (miles or km), rename function, make sure it returns miles or km.
					}
					
					
					
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