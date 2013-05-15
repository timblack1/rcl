define([
        '../../config',
        '../../vendor/mustache',
        './StatesOnePageView',
        './StatesOneStatePerPageView'
        ], 
        function(config, Mustache, StatesOnePageView, StatesOneStatePerPageView){
    
    var StatePageView = Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            this.delegateEvents()

            var type = window.app.dir.get('display_type');
            // TODO: The PCA has a KML file at http://batchgeo.com/map/kml/c78fa06a3fbdf2642daae48ca62bbb82
            //  Some (all?) data is also in JSON at http://static.batchgeo.com/map/json/c78fa06a3fbdf2642daae48ca62bbb82/1357687276
            //  After trimming off the non-JSON, the cong details are in the obj.mapRS array
            //  You can pretty-print it at http://www.cerny-online.com/cerny.js/demos/json-pretty-printing
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
    return StatePageView;

});
