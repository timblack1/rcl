define([
        './MapView',
        './SearchView',
        './CongregationsView',
        ], 
        function(MapView,SearchView,CongregationsView){

    var FindAChurchView = Backbone.View.extend({
        initialize : function(){
        },
        render: function(){
            // TODO: Refactor this so we don't repeat ourselves
            //  Create a generalized render(this, element_id) function
            var template = _.template( $("#find_a_church_template").html(), {} );
            $(this.el).html( template );
            // Render child views
            this.map_view = new MapView({ el: $("#map") });
            this.search_view = new SearchView({ el: $("#search_container") });
            this.congregations_view = new CongregationsView({ el: $("#congregations_container") });
        }
    })
    return FindAChurchView

});