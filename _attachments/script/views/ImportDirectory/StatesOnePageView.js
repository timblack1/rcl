define([
        '../../config',
        '../../lib/mustache',
        'text!views/ImportDirectory/StatesOnePage.html'
        ], 
        function(config, Mustache, template){
    
    var StatesOnePageView = Backbone.View.extend({
        initialize:function(){
            this.template = template;
        },
        render: function(){
            $('#steps').html(Mustache.render(this.template));
            this.delegateEvents()
        },
        events: {
        }

    });
    return StatesOnePageView;

});