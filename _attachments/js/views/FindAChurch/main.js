define([
        './MapView',
        './SearchView',
        './CongregationsView',
        'config'
        ], 
        function(MapView,SearchView,CongregationsView,config){

    var FindAChurchView = Backbone.View.extend({
        initialize : function(){
        },
        render: function(){
            config.render_to_id(this, "#find_a_church_template")
            // Render child views
            this.map_view = new MapView({ el: $("#map") });
            this.search_view = new SearchView({ el: $("#search_container") });
            this.congregations_view = new CongregationsView({ el: $("#congregations_container") });
        }
    })
    return FindAChurchView

});