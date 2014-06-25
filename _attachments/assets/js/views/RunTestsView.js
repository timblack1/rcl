define(
   [
    'config',
    'backbone_hoodie',
    'mustache',
    'text!views/RunTests.html'
    ], 
    function(config, Backbone, Mustache, RunTestsTemplate){

    var RunTestsView = Backbone.View.extend({
        initialize: function(){
            db = config.db
            this.render()
        },
        render: function(){
            $(this.el).html(Mustache.render(RunTestsTemplate));
        }     
    });
    
    return RunTestsView

});