define([
    'config',
    'model',
    'backbone',
    'mustache',
    'text!views/FindAChurch/Map.html',
    'text!views/FindAChurch/Address.html',
    'text!views/FindAChurch/CongInfowindow.html',
    'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
    ], 
    function(config, model, Backbone, Mustache, template, AddressTemplate, CongInfowindowTemplate){

        return Backbone.View.extend({
            initialize: function(options){
                _.bindAll(this, 'create_map', 'get_location', 'handleErrors', 'close_infowindows',
                    'update_congs_collection', 'update_map', 'hide_link_show_get_directions_form')
                this.options = options
                this.markers = []
                // Center on Philadelphia, PA by default
                this.default_map_center = {latitude:39.951596,longitude:-75.160095}
                this.default_zoom = 14
                // Update map when congs collection changes
                this.listenTo(this.collection, 'all', this.update_map)
            },
            render: function(){
                $('#map').html(Mustache.render(template))
                this.delegateEvents()

                // Create infowindow                              
                this.infowindow = new google.maps.InfoWindow();

                // Initialize Google map
                this.get_location()
                // TODO: use navigator.geolocation.watchPosition(this.create_map) to track user's moving location
            },
            
            // Main methods
            update_congs_collection:function(event){
                // Updates congs collection to get all congs within map's current bounds
                var thiz = this
                var mapbounds;
                // Determine whether the new bounds were set by moving the map, or by a user's search.  If the map
                //  was moved, the event is undefined because google.maps.event.addListener() does not pass
                //  the event to the callback.
                if (typeof event !== 'undefined'){
                    // Get the bounds from this.search_params.
                    // Create an instance of Circle() with the selected radius
                    var loc = this.options.search_params.get('results')[0].geometry.location;
                    var center = new google.maps.LatLng(loc.lat(), loc.lng());
                    var circle = new google.maps.Circle({
                        radius: this.options.search_params.get('distance'),
                        center: center
                    });
                    // Center and zoom the map to the bounds of the circle
                    this.map.setCenter(loc);
                    mapbounds = circle.getBounds()
                    this.map.fitBounds(mapbounds); // this sets the zoom 
                }else{
                    // Get the bounds from the map
                    mapbounds = this.map.getBounds()
                    // Store the new center
                    // TODO: Is this the right code location for this code?
//                     var center = this.map.getCenter()
//                     this.options.search_params.set('location', center.lat() + ',' + center.lng())
                }
                
                // mapbounds contains an array containing two lat/lng pairs in this order:
                // (south bottom 36, west left -96)
                // (north top 37, east right -95)
                var north_east = mapbounds.getNorthEast();
                var south_west = mapbounds.getSouthWest();

                var west_lng = south_west.lng();
                var east_lng = north_east.lng();
                var north_lat = north_east.lat();
                var south_lat = south_west.lat();
    
                // Filter congs in hoodie's local store by the specified bounds
                var congs_in_bounds = thiz.collection.filter(function(cong){
                    var g = cong.get('geocode')
                    return (typeof g !== 'undefined' && 
                            g.lat <= north_lat && 
                            g.lat >= south_lat && 
                            g.lng >= west_lng && 
                            g.lng <= east_lng)
                })
                thiz.collection.reset(congs_in_bounds)
            },
            update_map:function(){
                // When the map is panned or otherwise moved,
                //  Remove from the map the markers that are not in the new list, and
                //  add to the map the markers that are not in the old list.
                //  This will prevent losing focus on the infowindow that is currently 
                //  open, and avoid an unneccessary marker refresh.
                
                // Instead of removing all markers from the map, then plotting all new congs on new markers,
                //  do two set operations to remove only markers not displayed, and add only the markers that
                //  are new, to the map.  This will preserve the state (e.g., a directions origin address entered
                //  by a user) in any infowindow that is open during this marker refresh operation.
                
                var thiz = this
                // Remove markers that are not in the new set of congs returned
                _.each(_.difference(_.pluck(thiz.markers, 'couch_id'), thiz.collection.pluck('id')), function(id){
                    var marker = _.findWhere(thiz.markers, {couch_id:id})
                    // Remove marker from the list of markers
                    thiz.markers = _.without(thiz.markers, marker)
                    // Remove this marker from the map, which should also remove it from memory
                    marker.setMap(null)
                })
                // Add new congs to map
                _.each(_.difference(thiz.collection.pluck('id'), _.pluck(thiz.markers, 'couch_id')), function(id){
                    var cong = thiz.collection.get(id)
                    // Get cong's latlng
                    var coords = cong.get('geocode')
                    // This is the case we want to handle.
                    var denomination = cong.get('denomination_abbr')?' ('+cong.get('denomination_abbr')+')':''
                    // Here is where we actually plot the congs on the map
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(coords[0], coords[1]),
                        map: thiz.map,
                        title: cong.get('name') + denomination
                    });
                    google.maps.event.addListener(marker, 'click', function() {
                        // Render the infowindow HTML
                        // TODO: make it its own backbone view to prepare for giving it more functionality
                        // Dynamically create an address to feed into maps.google.com's search page
                        cong.attributes.address = Mustache.render(AddressTemplate, cong.toJSON()).replace('\n', '')
                        var contentString = Mustache.render(CongInfowindowTemplate, cong.toJSON())
                        thiz.infowindow.setContent(contentString)
                        thiz.infowindow.open(this.map, marker);
                        // If the "Directions" link is clicked,
                        // If we already know the user's location
                        // TODO: Is this code duplicated in the get_location() function?
                        if (navigator.geolocation){
                            // Use it without showing the form
                            var evt = event
                            navigator.geolocation.getCurrentPosition(function(position){
                                window.target = $(evt.target)
                                // Set the href of the link so if the user clicks it it will go to the right URL
                                $('a.get_directions').attr('href', 'http://maps.google.com/maps?saddr=' + 
                                                           position.coords.latitude + ',' + position.coords.longitude + '&daddr=' + 
                                                           cong.attributes.address)
                                $('a.get_directions').attr('target', '_blank')
                            },function(error){
                                switch(error.code){
                                    case error.PERMISSION_DENIED:
                                        // console.log("User denied the request for Geolocation.")
                                        // Hide the link and show the "Get directions" form
                                        $('body').on('click', 'a.get_directions', thiz.hide_link_show_get_directions_form);
                                        break;
                                    case error.POSITION_UNAVAILABLE:
                                        // console.log("Location information is unavailable.")
                                        break;
                                    case error.TIMEOUT:
                                        // console.log("The request to get user location timed out.")
                                        break;
                                    case error.UNKNOWN_ERROR:
                                        // console.log("An unknown error occurred.")
                                        break;
                                }
                            });
                        }else{
                            // console.log("Geolocation is not supported by this browser.");
                        }
                    });
                    marker.couch_id = cong.get('id')
                    // TODO: Make it so the city entered has a different color than results 
                    //  found and/or the results entered have an "A,B,C" feature on the pinpoint.
                    
                    // TODO: Figure out what address formats we need to parse before sending address to Google.
                    // TODO: Figure out which line(s) (address1 or address2) is needed to send to Google.
                    //  Maybe if geocoding add1 fails, try add2
                    //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/parse-address-formats
                    // Name:    Caney OPC
                    // Add1:    CVHS Gym
                    // Add2:    300 A St <-- We need this, not addr1
                    
                    // Name:    Caney OPC
                    // Add1:    YMCA
                    // Add2:    500 S Green St. Room 12 <-- We need this, not addr1
                })
            },
            
            // Utility methods
            get_location:function(){
                if (navigator.geolocation){
                    // Center the map on the viewer's country by default
                    navigator.geolocation.getCurrentPosition(this.create_map,this.handleErrors);
                }else{
                    console.log("Geolocation is not supported by this browser.");
                    // TODO: Find a different way to locate the user, perhaps by IP address
                    this.create_map({coords:this.default_map_center})
                }
            },
            create_map:function(position){
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var myOptions = {
                    // If we're centered on Philadelphia, zoom in close; otherwise, zoom out some to hopefully
                    //    display at least one congregation
                    zoom: (position.coords.latitude !== this.default_map_center.latitude) ? 8 : 14,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                }
                this.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

                // Attach event listeners to the map
                // TODO: This currently creates multiple identical event listeners, which is a memory leak.
                //    That is because these event listeners are created every time create_map runs,
                //    which is every time the user clicks the menu link for the "Find a church" page.
                //    So, figure out how to create these event listeners only once.
                // Close the open infowindow if the user clicks on the map
                var thiz = this
                google.maps.event.addListener(this.map, 'click', function() {
                    thiz.infowindow.close()
                })
                // Attach event handler to display new congs when the map's bounds change
                google.maps.event.addListener(this.map, 'idle', this.update_congs_collection)
                google.maps.event.addListener(this.map, 'bounds_changed', this.update_congs_collection)
                // Update the collection when the search params change
                this.listenTo(this.options.search_params, 'change', this.update_congs_collection)
            },
            handleErrors:function(error){
                switch(error.code){
                    case error.PERMISSION_DENIED:
                        console.log("User denied the request for Geolocation.")
                        this.create_map({coords:this.default_map_center})
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log("Location information is unavailable.")
                        this.create_map({coords:this.default_map_center})
                        break;
                    case error.TIMEOUT:
                        console.log("The request to get user location timed out.")
                        this.create_map({coords:this.default_map_center})
                        break;
                    case error.UNKNOWN_ERROR:
                        console.log("An unknown error occurred.")
                        this.create_map({coords:this.default_map_center})
                        break;
                }
            },
            close_infowindows:function() {
                _.each(this.infowindows, function(iw){
                    iw.close();
                })
            },
            hide_link_show_get_directions_form:function(event) {
                $(event.target).hide()
                $(event.target).parent().children("form.get_directions_form").show()
                var content = $(event.target).parent()[0].innerHTML
                // Force the infowindow to resize to fit its new content height
                this.infowindow.setContent(content)
            }
        });
    }
);