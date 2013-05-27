define([
        'config',
        'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
        ], 
        function(config){
    
    var MapView = Backbone.View.extend({
        initialize: function(){
        },
        render: function(){
            config.render_to_id(this, "#map_template")

            // Initialize Google map
            var geocoder;
            var map;
            geocoder = new google.maps.Geocoder();
            // TODO: Center the map on the viewer's country
            //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/center-map-on-viewers-country
            var latlng = new google.maps.LatLng(-34.397, 150.644);
            var myOptions = {
                             zoom: 8,
                             center: latlng,
                             mapTypeId: google.maps.MapTypeId.ROADMAP
            }
            map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
        },
        events:{
            'click #search':'codeAddress',
            'keypress #search_the_map': 'search'
        },
        search:function(event){
            if (event.which==13){ // The user pressed the enter key
                event.preventDefault();  // Prevent the default action of submitting the form
                codeAddress();
                return false; // This might help some browsers avoid submitting the form
            }
        },
        codeAddress:function(event){
            codeAddress();
            return false;
        }
    });
    return MapView

});