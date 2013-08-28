define(
   [
    '../config',
    'backbone'
    ], 
    function(config){

    var RunTestsView = Backbone.View.extend({
        initialize: function(){
            db = config.db
            this.render()
        },
        render: function(){
            var template = _.template( $('#test_template').html().replace(/script2/g, 'script'), {} );
            $(this.el).html( template );
        }     
    });
    
    return RunTestsView

});