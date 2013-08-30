define([
        'config',
        'model',
        'mustache',
        'text!views/FindAChurch/main_template.html',
        './MapView',
        './SearchView',
        './CongregationsView'
        ], 
        function(config,model,Mustache,template,MapView,SearchView,CongregationsView){

    return Backbone.View.extend({
        initialize : function(){
            this.congs = []
        },
        render: function(){
            _.bindAll(this, 'prep_congs_coll', 'get_congs')
            $('#content').html(Mustache.render(template))
            this.delegateEvents()
            
            // Create congs collection
            this.congs_coll = new model.Congs()
            
            // Render child views
            // Render a map view, passing in the collection as its collection
            this.map_view = new MapView({ el: $("#map"), collection:this.congs_coll });
            this.map_view.render()
            
            // Render the search form view
            this.search_view = new SearchView({ el: $("#search_container") });
            this.search_view.render()
            // TODO: Render a Backgrid view for a table of congregations, passing the congs collection, to whose changes
            //    the Backgrid listens to automatically.
            //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cong-list-in-backbone-template
            this.congregations_view = new CongregationsView({ el: $("#congregations_container"), collection:this.congs_coll });
            this.congregations_view.render()

            // Get the list of congs related to the default map center, and put in this.congs_coll
            this.get_congs({success:this.prep_congs_coll})
            // TODO: Fetch the initial set of congs, triggering the views to display that collection
            this.congs_coll.fetch()
        },
        get_congs:function(options){
            var thiz = this
            // mapbounds contains an array containing two lat/lng pairs in this order:
            // (south bottom 36, west left -96)
            // (north top 37, east right -95)
            // TODO: This throws an error since the map hasn't been rendered yet at this point in the code execution
            //    (when this line is called from line 39 above)
            //    So how do we fix this?
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
                    options.success(congs)
                }
            )            
        },
        prep_congs_coll:function(congs){
            if (congs.length > 0){
                var ids = _.pluck(congs,'id')
                this.congs_coll.db = {}
                this.congs_coll.db.keys = ids
                // Switch view to get arbitrary ids
                this.congs_coll.db.view = 'by_id'
            }
        }
    })

});