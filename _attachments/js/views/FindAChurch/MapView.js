define([
    'config',
    'backbone',
    'mustache',
    'text!views/FindAChurch/Map.html',
    'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
    ], 
    function(config, Backbone, Mustache, template){

        return Backbone.View.extend({
            initialize: function(){
                _.bindAll(this, 'create_map', 'getLocation', 'handleErrors', 'refresh_congs')
                // TODO: Set the map view to listen to congs collection change events.
                // This returns an Uncaught TypeError: Object [object Object] has no method 'listenTo'
                this.listenTo(this.collection, 'all', this.refresh_congs)
            },
            render: function(){
                $('#map').html(Mustache.render(template))
                this.delegateEvents()

                // Initialize Google map
                // First without user's location, centered on Philadelphia
                this.create_map({coords:{latitude:39.951596,longitude:-75.160095}})
                this.getLocation()
                // TODO: use navigator.geolocation.watchPosition(this.create_map) to track user's moving location
            },
            create_map:function(position){
                var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var myOptions = {
                    zoom: 8,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                }
                window.app.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
                // TODO: Plot congs in this user's vicinity by default
                //  This requires using code currently found in SearchView.js
                //  So maybe move that code into a library?
                //  As a simple workaround, I'll just use the form for now:
                $('.location').val(position.coords.latitude + ',' + position.coords.longitude)
                $('.search').click()
                $('.location').val('')
            },
            getLocation:function(){
                if (navigator.geolocation){
                    // Center the map on the viewer's country by default
                    navigator.geolocation.getCurrentPosition(this.create_map,this.handleErrors);
                }else{
                    console.log("Geolocation is not supported by this browser.");
                    // TODO: Find a different way to locate the user, perhaps by IP address
                    // Center on Philadelphia, PA
                    this.create_map({coords:{latitude:39.951596,longitude:-75.160095}})
                }
            },
            handleErrors:function(error){
                switch(error.code){
                    case error.PERMISSION_DENIED:
                        console.log("User denied the request for Geolocation.")
                        break;
                    case error.POSITION_UNAVAILABLE:
                        console.log("Location information is unavailable.")
                        break;
                    case error.TIMEOUT:
                        console.log("The request to get user location timed out.")
                        break;
                    case error.UNKNOWN_ERROR:
                        console.log("An unknown error occurred.")
                        break;
                }
            },
            refresh_congs:function(){
                // TODO: Use this.collection to repopulate the map
            }
        });
    }
);