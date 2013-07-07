define([
        '../../config',
        '../../vendor/mustache',
        './StatesOnePageView',
        './StatesOneStatePerPageView'
        ], 
        function(config, Mustache, StatesOnePageView, StatesOneStatePerPageView){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            this.delegateEvents()

            var type = window.app.dir.get('display_type');
            if (type=='one page'){
                // TODO: If "One Page" is selected, then show page containing list of all congs.
                // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/show-one-page-directory
                // Render StatesOnePageView
                // TODO: Maybe this should skip ahead one step to use CongDetailsURLView.js instead of this view
                this.states_one_page_view = new StatesOnePageView({el: '#steps'})
                this.states_one_page_view.render()
            }
            //  If "One state per page" is selected, then drop down box showing state options.
            if (type=='one state per page'){
                // Render StatesOneStatePerPageView
                this.states_one_state_per_page_view = new StatesOneStatePerPageView({el: '#steps'})
                this.states_one_state_per_page_view.render()
            }
        },
        events: {
        }
    });
});
