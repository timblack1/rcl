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
            this.markers = []
            // Create infowindow                              
            this.infowindow = new google.maps.InfoWindow();
            // Close the open infowindow if the user clicks on the map
            var thiz = this
            google.maps.event.addListener(window.app.map, 'click', function() {
                thiz.infowindow.close()
            })
        },
        render: function(){
            // TODO: Convert this to use Mustache
            config.render_to_id(this, "#search_template")
            //$('#')
            
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
        do_search: function( event ){
            // If user submitted an address,
            // Geocode user-submitted address
            event.preventDefault()
            var thiz = this
            // Clear any existing markers from map
            thiz.remove_markers()
            // Use location user entered
            var location = $('.location').val()
            if (location == ''){
                // Or just use map's center
                location = window.app.map.getCenter().toUrlValue()
            }
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
        close_infowindows:function() {
            _.each(this.infowindows, function(iw){
                iw.close();
            })
        },
        remove_markers:function(){
            // Remove each marker from the map
            var thiz = this
            _.each(this.markers,function(marker){
                if (marker !== thiz.open_marker)
                marker.setMap(null)
            })
            // Empty the array itself
            this.markers = [];
        },
        plot_congs_on_map:function(){
            var thiz = this
            // mapbounds contains an array containing two lat/lng pairs in this order:
            // (south bottom 36, west left -96)
            // (north top 37, east right -95)
            var mapbounds = window.app.map.getBounds();
            var north_east = mapbounds.getNorthEast();
            var south_west = mapbounds.getSouthWest();

            var west_lng = south_west.lng();
            var east_lng = north_east.lng();
            var north_lat = north_east.lat();
            var south_lat = south_west.lat();

            // TODO: When the map is panned or otherwise moved,
            //  Remove from the map the markers that are not in the new list
            //  Add to the map the markers that are not in the old list
            //  This will prevent losing focus on the infowindow that is currently 
            //  open, and avoid an unneccessary marker refresh
            // Send AJAX call to geocouch containing bounds within which congregations are found
            // Geocouch uses GeoJSON coordinates, which are lower left, then upper right, which is the same
            //  order Google Maps uses
            $.get('http://'+config.domain+':'+config.port+'/'+config.db_name+'/_design/'+
                    config.db_name+'/_spatial/points?bbox='+
                    south_lat+','+west_lng+','+north_lat+','+east_lng,
                function(data, textStatus, jqXHR){
                    if (data == '') return;
                    var congs = eval('('+data+')')['rows'];
                    if (typeof congs !== 'undefined' && congs.length > 0){
                        // TODO: Refactor this so it's not redeclared every time this code is called
                        // Plot the congregations returned on the map
                        // TODO: Wrap the display in a self-updating Backbone view tied to the congs_coll collection,
                        //    which should render this .remove() call unnecessary
                        //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cong-list-in-backbone-template
                        // Remove existing table rows that contain congregation data (don't remove the header row)
                        // $("#congregation_list tbody tr").remove();

                        var congs_coll = new model.Congs()
                        var ids = _.pluck(congs,'id')
                        congs_coll.db = {}
                        congs_coll.db.keys = ids
                        // Switch view to get arbitrary ids
                        congs_coll.db.view = 'by_id'
                        // Note: Binding the "all" event maxed out the CPU, so don't do it!
                    	congs_coll.on("add,remove,reset,change,destroy", function(event_name){
                    		// Get all the congregations in this collection
                    		// For each congregation: Create a table row
                    		var row_list = congs_coll.map(function(element, index, list){
                                // TODO: Backgrid rendered this obsolete
//                     			return Mustache.render(CongTableRowTemplate, element.attributes)
                                // TODO: Create marker for this cong here
                                //  Move code from below up to here
                    		})
                    		var rows=row_list.join()
                    		// Append all the table rows to the table
                    		$("#congregation_list tbody").html(rows);
                    	})
                        congs_coll.fetch(
                            {
                                include_docs:true,
                                success:function(congs_coll, response, options){
                                    // Instead of removing all markers from the map, then plotting all new congs on new markers,
                                    //  do two set operations to remove only markers not displayed, and add only the markers that
                                    //  are new, to the map.  This will preserve the state (e.g., a directions origin address entered
                                    //  by a user) in any infowindow that is open during this marker refresh operation.

                                    // Remove markers that are not in the new set of congs returned
                                    _.each(_.difference(_.pluck(thiz.markers, 'couch_id'), congs_coll.pluck('_id')), function(id){
                                        var marker = _.findWhere(thiz.markers, {couch_id:id})
                                        // Remove marker from the list of markers
                                        thiz.markers = _.without(thiz.markers, marker)
                                        // Remove this marker from the map, which should also remove it from memory
                                        marker.setMap(null)
                                    })
                                    // Add new congs to map
                                    _.each(_.difference(congs_coll.pluck('_id'), _.pluck(thiz.markers, 'couch_id')), function(id){
                                        var cong = congs_coll.get(id)
                                        // Get cong's latlng
                                        var coords = cong.get('loc')
                                        // This is the case we want to handle.
                                        var denomination = cong.get('denomination_abbr')?' ('+cong.get('denomination_abbr')+')':''
                                        var marker = new google.maps.Marker({
                                            position: new google.maps.LatLng(coords[0], coords[1]),
                                            map: window.app.map,
                                            title: cong.get('name') + denomination
                                        });
                                        google.maps.event.addListener(marker, 'click', function() {
                                        	// Render the infowindow HTML
                                            // TODO: make it its own backbone view
                                            // Dynamically create an address to feed into maps.google.com's search page
                                            cong.attributes.address = Mustache.render(AddressTemplate, cong.toJSON()).replace('\n', '')
                                            var contentString = Mustache.render(CongInfowindowTemplate, cong.toJSON())
                                            thiz.infowindow.setContent(contentString)
                                            thiz.infowindow.open(window.app.map, marker);
                                            // If the "Directions" link is clicked,
                                            // If we already know the user's location
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
                                                            $('body').on('click', 'a.get_directions', function(event) {
                                                                $(event.target).hide()
                                                                $(event.target).parent().children("form.get_directions_form").show()
                                                                var content = $(event.target).parent()[0].innerHTML
                                                                // Force the infowindow to resize to fit its new content height
                                                                thiz.infowindow.setContent(content)
                                                            });
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
                                        marker.couch_id = cong.get('_id')
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
                                        
                                     
                                       
                                        // Add infowindow to map
                                        google.maps.event.addListener(marker, 'click', function() {
                                            
                                        });
                                                                      
                                      
                                        // Add congregation info to the table below the map.
                                        // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cong-search-results-in-table-template
                                        // Construct the table rows that we're going to append to the table
                                    })
                                    // thiz.remove_markers()
                                    // if (typeof thiz.open_infowindow !== 'undefined'){
                                    //     thiz.open_infowindow.open(window.app.map,thiz.open_marker);
                                    // }
                                    // _.each(congs,function(cong,index,congs){
                                    //     var cong_data = congs_coll.get(cong.id)
                                    //     var coords = cong.geometry.coordinates
                                    //     var point = new google.maps.LatLng(coords[0], coords[1]);
                                    //     var marker = new google.maps.Marker({
                                    //         position: point,
                                    //         map: window.app.map,
                                    //         title: cong_data.get('name')
                                    //     });
                                    //     thiz.markers.push(marker)
                                    //     // TODO: Make it so the city entered has a different color than results 
                                    //     //  found and/or the results entered have an "A,B,C" feature on the pinpoint.

                                    //     // TODO: Figure out what address formats we need to parse before sending address to Google.
                                    //     // TODO: Figure out which line(s) (address1 or address2) is needed to send to Google.
                                    //     //  Maybe if geocoding add1 fails, try add2
                                    //     //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/parse-address-formats
                                    //     // Name:    Caney OPC
                                    //     // Add1:    CVHS Gym
                                    //     // Add2:    300 A St <-- We need this, not addr1

                                    //     // Name:    Caney OPC
                                    //     // Add1:    YMCA
                                    //     // Add2:    500 S Green St. Room 12 <-- We need this, not addr1

                                    //     // Render the infowindow HTML
                                    //     // TODO: make it its own backbone view
                                    //     cong_data.attributes.address = Mustache.render("{{#meeting_address1}}{{meeting_address1}},{{/meeting_address1}} {{#meeting_city}}{{meeting_city}},{{/meeting_city}} {{meeting_state}} {{meeting_zip}} ({{name}})", cong_data.attributes).replace('\n', '')
                                    //     var contentString = Mustache.render(CongInfowindowTemplate, cong_data.attributes)

                                    //     // Create infowindow                              
                                    //     var infowindow = new google.maps.InfoWindow({
                                    //         content: contentString
                                    //     });
                                    //     //$(document['#infowindow'+i]).parent.style = 'overflow-y:hidden';
                                    //     // Add the infowindow as an attribute of this marker to make it accessible within marker events.
                                    //     marker.infowindow = infowindow;
                                    //     // Add the infowindow to an array so we can close all infowindows from the events below.
                                    //     thiz.infowindows[index] = infowindow;
                                    //     // Add infowindow to map
                                    //     google.maps.event.addListener(marker, 'click', function() {
                                    //         thiz.close_infowindows();
                                    //         this.infowindow.open(window.app.map,marker);
                                    //         // Record the open marker so we can reopen it after the map pans
                                    //         thiz.open_marker = marker
                                    //         thiz.open_infowindow = this.infowindow
                                    //         // If the "Directions" link is clicked,
                                    //         // If we already know the user's location
                                    //         if (navigator.geolocation){
                                    //             // Use it without showing the form
                                    //             var evt = event
                                    //             navigator.geolocation.getCurrentPosition(function(position){
                                    //                 window.target = $(evt.target)
                                    //                 // Set the href of the link so if the user clicks it it will go to the right URL
                                    //                 $('a.get_directions').attr('href', 'http://maps.google.com/maps?saddr=' + 
                                    //                     position.coords.latitude + ',' + position.coords.longitude + '&daddr=' + 
                                    //                     cong_data.attributes.address)
                                    //                 $('a.get_directions').attr('target', '_blank')
                                    //             },function(error){
                                    //                 switch(error.code){
                                    //                     case error.PERMISSION_DENIED:
                                    //                         // console.log("User denied the request for Geolocation.")
                                    //                         // Hide the link and show the "Get directions" form
                                    //                         var iw = this.infowindow
                                    //                         window.infowindow = iw
                                    //                         $('body').on('click', 'a.get_directions', function(event) {
                                    //                             $(event.target).hide()
                                    //                             $(event.target).parent().children("form.get_directions_form").show()
                                    //                             var content = $(event.target).parent()[0].innerHTML
                                    //                             thiz.infowindows[index].setContent(content)
                                    //                         });
                                    //                         break;
                                    //                     case error.POSITION_UNAVAILABLE:
                                    //                         // console.log("Location information is unavailable.")
                                    //                         break;
                                    //                     case error.TIMEOUT:
                                    //                         // console.log("The request to get user location timed out.")
                                    //                         break;
                                    //                     case error.UNKNOWN_ERROR:
                                    //                         // console.log("An unknown error occurred.")
                                    //                         break;
                                    //                 }
                                    //             });
                                    //         }else{
                                    //             // console.log("Geolocation is not supported by this browser.");
                                    //         }
                                    //     });
                                    //     // Close all infowindows when user clicks on map
                                    //     google.maps.event.addListener(window.app.map, 'click', function() {
                                    //         thiz.close_infowindows();
                                    //     });

                                    //     // Add congregation info to the table below the map.
                                    //     // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cong-search-results-in-table-template
                                    //     // Construct the table rows that we're going to append to the table
                                    // })
                                    // thiz.add_listener()
                                },
                                error:function(collection, response, options){
                                    console.error(response)
                                }
                            }
                        )
                    }
                }
            )
        }
    });
});