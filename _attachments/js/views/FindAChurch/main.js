define([
        'config',
        './MapView',
        './SearchView',
        './CongregationsView'
        ], 
        function(config,MapView,SearchView,CongregationsView){

    return Backbone.View.extend({
        initialize : function(){
        },
        render: function(){
            config.render_to_id(this, "#find_a_church_template")
            // Render child views
            this.map_view = new MapView({ el: $("#map") });
            this.map_view.render()
            this.search_view = new SearchView({ el: $("#search_container") });
            this.search_view.render()
            this.congregations_view = new CongregationsView({ el: $("#congregations_container") });
            this.congregations_view.render()
        }
    })

});