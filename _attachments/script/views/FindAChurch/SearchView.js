define([
        'config',
        'async!https://maps.googleapis.com/maps/api/js?sensor=false'
        ], 
        function(config){

    var SearchView = Backbone.View.extend({
        initialize: function(){
            this.render();
        },
        render: function(){
            config.render_to_id(this, "#search_template")
        },
        events: {
            // TODO: We are trying to get the AJAX request to work on the "on key up" event; 
            //  but no luck so far. 
            "click #search": "doSearch"
        },
        doSearch: function( event ){
            var address = document.getElementById("search_the_map").value;
            geocoder.geocode( { 'address': address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    // Use Circle() as a helper to avoid doing math. 
                    // Convert radius*units to meters
                    var radius = $('#radius').val(); 
                    var units = $('#units').val();
                    if (units == 'miles'){
                        var distance = radius * 1609.344;
                    } else if (units == 'km') {
                        var distance = radius * 1000;
                    }
                    // Create an instance of Circle() with the selected radius
                    var loc = results[0].geometry.location;
                    var center = new google.maps.LatLng(loc.lat(), loc.lng());
                    var circle = new google.maps.Circle({radius: distance, center: center}); 
                    // Center and zoom the map to the bounds of the circle. 
                    map.setCenter(loc);
                    map.fitBounds(circle.getBounds()); // this sets the zoom 
                    // mapbounds contains an array containing two lat/lng pairs in this order:
                    // (south bottom 36, west left -96)
                    // (north top 37, east right -95)
                    var mapbounds = circle.getBounds();
                    var north_east = mapbounds.getNorthEast();
                    var south_west = mapbounds.getSouthWest();

                    var west_lng = south_west.lng();
                    var east_lng = north_east.lng();
                    var north_lat = north_east.lat();
                    var south_lat = south_west.lat();

                    // Send AJAX call to controller method containing bounds within which congregations are found
                    // So we can search like this:  cong_lat > south_lat and cong_lat < north_lat and cong_lng > west_lng and cong_lng < east_lng
                    // TODO: Create code to get congs in bounds
                    $.ajax({
                        url: "/cong/getcongsinbounds",
                        data: {
                            west_lng:   west_lng,
                            east_lng:   east_lng,
                            north_lat:  north_lat,
                            south_lat:  south_lat
                        },
                        success: function(data){
                            // TODO: Rewrite this to use the data format returned from couchdb
                            var congs = data['congs'];
                            if (congs.length > 0){
                                // Plot the congregations returned on the map
                                function close_infowindows() {
                                    for (var i2=0; i2<infowindows.length; i2++){
                                        infowindows[i2].close(map,marker);
                                    }
                                }

                                // TODO: Use a template rather than constructing HTML here,
                                //    and wrap the display in a self-updating Backbone view,
                                //    which should render this .remove() call unnecessary
                                // Remove existing table rows that contain congregation data (don't remove the header row)
                                $("#congregation_list tbody tr").remove();

                                var infowindows = [];
                                for (var i=0; i<congs.length; i++){
                                    var point = new google.maps.LatLng(congs[i].lat, congs[i].lng);
                                    var marker = new google.maps.Marker({
                                        position: point,
                                        map: map,
                                        title: congs[i].name
                                    });
                                    // TODO: Make it so the city entered has a different color than results 
                                    //  found and/or the results entered have an "A,B,C" feature on the pinpoint.

                                    // TODO: Figure out what address formats we need to parse before sending address to Google.
                                    // TODO: Figure out which line(s) (address1 or address2) is needed to send to Google.
                                    // Name:    Caney OPC
                                    // Add1:    CVHS Gym
                                    // Add2:    300 A St <-- We need this, not addr1

                                    // Name:    Caney OPC
                                    // Add1:    YMCA
                                    // Add2:    500 S Green St. Room 12 <-- We need this, not addr1


                                    var contentString = '' +
                                    '<h4 style="margin: 0">' + congs[i].name + '</h4>' +
                                    '<p>' + 
                                    congs[i].meeting_address1 + "<br />" + 
                                    ( congs[i].meeting_address2 ? congs[i].meeting_address2 + "<br />" : '' ) + 
                                    congs[i].meeting_city + ", " + 
                                    congs[i].meeting_state + " " + 
                                    congs[i].meeting_zip + "<br />" +
                                    ( congs[i].phone ? congs[i].phone + "<br />" : '' ) +
                                    ( congs[i].website ? '<a href="http://' + congs[i].website +'">' + congs[i].website + "</a><br />" : '' ) +
                                    '</p>' +
                                    '<form action="http://maps.google.com/maps" method="get" target="_blank">' +
                                    'Enter your starting address:' +
                                    '<input type="text" name="saddr" />' +
                                    '<input type="hidden" name="daddr" value="' +
                                    congs[i].meeting_address1 + ', ' + 
                                    congs[i].meeting_city + ", " + 
                                    congs[i].meeting_state + " " + 
                                    congs[i].meeting_zip + " " +
                                    "(" + congs[i].name + ")" +
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
                                    infowindows[i] = infowindow;
                                    // Add infowindow to map
                                    google.maps.event.addListener(marker, 'click', function() {
                                        close_infowindows();
                                        this.infowindow.open(map,this);
                                    });
                                    // Close all infowindows when user clicks on map
                                    google.maps.event.addListener(map, 'click', function() {
                                        close_infowindows();
                                    });

                                    //TODO: Add congregation info to the table below the map.
                                    // Construct the table rows that we're going to append to the table

                                    var msg="<tr>" +
                                    "<td><a href='/cong/" + congs[i].id + "'>" + congs[i].name + "</a></td>"+
                                    "<td>" + congs[i].meeting_city + ", " + congs[i].meeting_state + ", " + congs[i].meeting_country + "</td>" +
                                    "<td>" +(congs[i].phone ? congs[i].phone + "<br />": "" ) + 
                                    (congs[i].email ? "<a href='mailto:" + congs[i].email + "'>" + congs[i].email + "</a><br />": "" ) + 
                                    (congs[i].website ? "<a href='http://" + congs[i].website + "'>" + congs[i].website + "</a>": "") + 
                                    "</td>" + 
                                    "</tr>"; 

                                    // Append the new table rows to the table
                                    $("#congregation_list tbody").append(msg);
                                }
                            }
                        }
                    });
                } else {
                    alert("Geocode was not successful for the following reason: " + status);
                }
            });
            }
    });
    return SearchView

});