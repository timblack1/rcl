define(
   [
    'config',
    'model',
    'mustache',
    './DirURLView',
    'text!views/ImportDirectory/main.html'
    ],
    function(config, model, Mustache, DirURLView, template){

        return Backbone.View.extend({
            initialize : function(){
                db = config.db
                window.wgxpath.install()
                
                // Set up browser changes listener to watch for and handle Node changes
                //  listener's response
                var changes = db.changes();
                this.template = template;
                // Register necessary subviews
                this.DirURLView = DirURLView;
            },
            render: function(){
                // TODO: Consider using assign() as described here:
                //  http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
                //config.render_to_id(this, "#import_directory_template")
                // Render Mustache template
                $('#content').html(Mustache.render(this.template));
                // Render first subview
                this.DirURLView = new DirURLView({el: '#steps'})
                this.DirURLView.render()
                this.delegateEvents()
            }
        })

});
