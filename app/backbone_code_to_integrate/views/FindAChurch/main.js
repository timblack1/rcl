define([
    'config',
    'model',
    'mustache',
    'text!views/FindAChurch/main_template.html',
    './MapView',
    './SearchView',
    './CongregationsView',
    'async!https://maps.googleapis.com/maps/api/js?sensor=false&key=AIzaSyCcl9RJaWMuEF50weas-we3D7kns-iWEXQ'
    ],
    function(config,model,Mustache,template,MapView,SearchView,CongregationsView){

        return Backbone.View.extend({
            initialize : function(){
                this.congs = []
            },
            render: function(){
                $('.content').html(Mustache.render(template))
                this.delegateEvents()
                
                // Create congs collection
                this.congs_coll = new model.Congs()
                this.congs_coll.fetch();
                // Create search_params model
                var SearchParams = Backbone.Model.extend()
                var search_params = new SearchParams()
                
                // Render child views
                // Render a map view, passing in the collection as its collection
                this.map_view = new MapView({
                    el: $("#map"), 
                    collection:this.congs_coll,
                    search_params:search_params
                });
                this.map_view.render()
                
                // Render the search form view
                this.search_view = new SearchView({
                    el: $("#search_container"), 
                    collection:this.congs_coll, 
                    model:search_params
                });
                this.search_view.render()
                // Render a Backgrid view for a table of congregations, passing the congs collection, to whose changes
                //    the Backgrid listens automatically.
                this.congregations_view = new CongregationsView({
                    el: $(".congregations_container"), 
                    collection:this.congs_coll
                });
                this.congregations_view.render()
            }
        })
        
});