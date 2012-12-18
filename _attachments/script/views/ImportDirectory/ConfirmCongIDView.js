define([
        'config'
        ], 
        function(config){
    
    var ConfirmCongIDView = Backbone.View.extend({
        initialize: function(){
            this.render();
        },
        render: function(){
            config.render_to_id(this, "#search_template")
        },
        events: {
            // TODO: We are trying to get the AJAX request to work on the "on key up" event; 
            //  but no luck so far.
            //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/searchview-search-onkeyup
            "click #search": "doSearch"
        },
    });
    return ConfirmCongIDView

});