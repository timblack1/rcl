define([
        'config',
        'mustache',
        'text!views/ImportDirectory/DirType.html',
        './StatePageView'
        ], 
        function(config, Mustache, template, StatePageView){
    
    return Backbone.View.extend({
        initialize:function(){
        },
        render: function(){
            $('#steps').html(Mustache.render(template));
            this.delegateEvents()
        },
        events: {
            // Handle event which leads to step 3
            'click input[type=radio]':'radio_clicked'
        },
        radio_clicked:function(event){
            // Record the directory type
            this.model.set('display_type', $('input:radio[name=type]:checked').val())
            this.state_page_view = new StatePageView({el: '#steps', model: this.model})
            this.state_page_view.render()
        }

    });

});
