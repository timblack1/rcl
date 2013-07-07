define([
        'config',
        '../../model',
        'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
        ], 
        function(config, model){

    return Backbone.View.extend({
        initialize: function(){
            window.app.geocoder = new google.maps.Geocoder();
        },
        render: function(){
            // TODO: Convert this to use Mustache
            config.render_to_id(this, "#search_template")

            // Attach search event handler to search button and text box
            $('.search').click(this.do_search)
            $('.location').keyup(this.do_search)
            // TODO: Attach event handlers to display new congs when the map is panned or zoomed
        },
        do_search: function( event ){
            // TODO: If user submitted an address,
            // Geocode user-submitted address
            event.preventDefault()
            var thiz = this
            // Handle event if the search button was clicked or the return key was pressed in the location text box
            if ($(event.target).attr('class') == 'search' || event.which == 13){
                // TODO: Clear any existing markers from map
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

                        // Send AJAX call to geocouch containing bounds within which congregations are found
                        // Geocouch uses GeoJSON coordinates, which are lower left, then upper right, which is the same
                        //  order Google Maps uses
                        $.get('http://'+config.domain+':'+config.port+'/'+config.db_name+'/_design/'+
                                config.db_name+'/_spatial/points?bbox='+
                                south_lat+','+west_lng+','+north_lat+','+east_lng,
                            function(data, textStatus, jqXHR){
                                var congs = eval('('+data+')')['rows'];
                                if (typeof congs !== 'undefined' && congs.length > 0){
                                    // TODO: Refactor this so it's not redeclared every time this code is called
                                    // Plot the congregations returned on the map
                                    function close_infowindows() {
                                        _.each(thiz.infowindows, function(iw, index, iws){
                                            // TODO: Get the current marker
                                            iw.close();
                                        })
                                    }
                                    // TODO: Use a template rather than constructing HTML here,
                                    //    and wrap the display in a self-updating Backbone view tied to the congs_coll collection,
                                    //    which should render this .remove() call unnecessary
                                    //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cong-list-in-backbone-template
                                    // Remove existing table rows that contain congregation data (don't remove the header row)
                                    $("#congregation_list tbody tr").remove();

                                    thiz.infowindows = [];
                                    var congs_coll = new model.Congs()
                                    var ids = _.pluck(congs,'id')
                                    congs_coll.db = {}
                                    congs_coll.db.keys = ids
                                    // Switch view to get arbitrary ids
                                    congs_coll.db.view = 'by_id'
                                    congs_coll.fetch(
                                        {
                                            include_docs:true,
                                            success:function(congs_coll, response, options){
                                                _.each(congs,function(cong,index,congs){
                                                    var cong_data = congs_coll.get(cong.id)
                                                    var coords = cong.geometry.coordinates
                                                    var point = new google.maps.LatLng(coords[0], coords[1]);
                                                    var marker = new google.maps.Marker({
                                                        position: point,
                                                        map: window.app.map,
                                                        title: cong_data.get('name')
                                                    });
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


                                                    var contentString = '' +
                                                    '<h4 style="margin: 0">' + cong_data.get('name') + '</h4>' +
                                                    '<p>' + 
                                                    cong_data.get('meeting_address1') + "<br />" + 
                                                    ( cong_data.get('meeting_address2') ? cong_data.get('meeting_address2') + "<br />" : '' ) + 
                                                    cong_data.get('meeting_city') + ", " + 
                                                    cong_data.get('meeting_state') + " " + 
                                                    cong_data.get('meeting_zip') + "<br />" +
                                                    ( cong_data.get('phone') ? cong_data.get('phone') + "<br />" : '' ) +
                                                    ( cong_data.get('website') ? '<a href="http://' + cong_data.get('website') +'">' + cong_data.get('website') + "</a><br />" : '' ) +
                                                    '</p>' +
                                                    '<form action="http://maps.google.com/maps" method="get" target="_blank">' +
                                                    'Enter your starting address:' +
                                                    '<input type="text" name="saddr" />' +
                                                    '<input type="hidden" name="daddr" value="' +
                                                    cong_data.get('meeting_address1') + ', ' + 
                                                    cong_data.get('meeting_city') + ", " + 
                                                    cong_data.get('meeting_state') + " " + 
                                                    cong_data.get('meeting_zip') + " " +
                                                    "(" + cong_data.get('name') + ")" +
                                                    '" />' +
                                                    '<input type="submit" value="get directions" />' +
                                                    '</form>' ;


                                                    // Create infowindow                              
                                                    var infowindow = new google.maps.InfoWindow({
                                                        content: contentString,
                                                        maxWidth: 300
                                                    });
                                                    //$(document['#infowindow'+i]).parent.style = 'overflow-y:hidden';
                                                    // Add the infowindow as an attribute of this marker to make it accessible within marker events.
                                                    marker.infowindow = infowindow;
                                                    // Add the infowindow to an array so we can close all infowindows from the events below.
                                                    thiz.infowindows[index] = infowindow;
                                                    // Add infowindow to map
                                                    google.maps.event.addListener(marker, 'click', function() {
                                                        close_infowindows();
                                                        this.infowindow.open(window.app.map,marker);
                                                    });
                                                    // Close all infowindows when user clicks on map
                                                    google.maps.event.addListener(window.app.map, 'click', function() {
                                                        close_infowindows();
                                                    });

                                                    //TODO: Add congregation info to the table below the map.
                                                    // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cong-search-results-in-table-template
                                                    // Construct the table rows that we're going to append to the table

                                                    var msg="<tr>" +
                                                    "<td><a href='/cong/" + cong_data.get('id') + "'>" + cong_data.get('name') + "</a></td>"+
                                                    "<td>" + cong_data.get('meeting_city') + ", " + cong_data.get('meeting_state') + ", " + cong_data.get('meeting_country') + "</td>" +
                                                    "<td>" +(cong_data.get('phone') ? cong_data.get('phone') + "<br />": "" ) + 
                                                    (cong_data.get('email') ? "<a href='mailto:" + cong_data.get('email') + "'>" + cong_data.get('email') + "</a><br />": "" ) + 
                                                    (cong_data.get('website') ? "<a href='http://" + cong_data.get('website') + "'>" + cong_data.get('website') + "</a>": "") + 
                                                    "</td>" + 
                                                    "</tr>"; 

                                                    // Append the new table rows to the table
                                                    $("#congregation_list tbody").append(msg);
                                                })
                                            },
                                            error:function(collection, response, options){
                                                console.error(response)
                                            }
                                        }
                                    )
                                }
                            }
                        )
                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });
            }
        }
    });
});