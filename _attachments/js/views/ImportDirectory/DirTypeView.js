define([
        'config',
        'mustache',
        'text!views/ImportDirectory/DirType.html',
        './StatePageView'
        ], 
        function(config, Mustache, template, StatePageView){
    
    var DirType = Backbone.View.extend({
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
            // We're using a recursive setTimeout because window.app.dir is not available at runtime here
            // TODO: Start here 2014. Get window.app.dir to be defined so the execution can proceed from here.
            //  The place to do that is first in URLView.js.
            //  I've changed window.app.dir to be the model of the URLView.  Is URLView available in this scope?
            //  This may be my next step.
            function wait_for_dir(){
                if (typeof window.app.dir === 'undefined'){
                    console.error('window.app.dir is undefined')
                    setTimeout(wait_for_dir, 500)
                }else{
                    console.log('window.app.dir is defined')
                    window.app.dir.set('display_type', $('input:radio[name=type]:checked').val())
                    this.state_page_view = new StatePageView({el: '#steps'})
                    this.state_page_view.render()
                }
            }
            wait_for_dir()
        }

    });
    return DirType;

});
