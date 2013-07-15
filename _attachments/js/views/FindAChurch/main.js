define([
        'config',
        '../../vendor/mustache',
        'text!views/FindAChurch/main_template.html',
        './MapView',
        './SearchView',
        './CongregationsView'
        ], 
        function(config,Mustache,template,MapView,SearchView,CongregationsView){

    return Backbone.View.extend({
        initialize : function(){
        },
        render: function(){
            $('#content').html(Mustache.render(template))
            this.delegateEvents()
            
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