define(
   [
    'config',
    'model',
    'mustache',
    './URLView',
    'text!views/ImportDirectory/main.html'
    ],
    function(config, model, Mustache, URLView, template){

        return Backbone.View.extend({
            initialize : function(){
                window.wgxpath.install()
                
                this.template = template;
                // Register necessary subviews
                this.URLView = URLView;
                // TODO: Consider using kimonolabs.com as a web scraper, though maybe not if it costs too much.
            },
            render: function(){
                // TODO: Consider using assign() as described here:
                //  http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
                //config.render_to_id(this, "#import_directory_template")
                // Render Mustache template
                $('.content').html(Mustache.render(this.template));
                // Render first subview
                this.URLView = new URLView({el: '#steps'})
                this.URLView.render()
                this.delegateEvents()
            }
        })

});
