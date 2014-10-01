define([
        'config',
        'model',
        'mustache',
        'text!views/ImportDirectory/GeocodeStats.html',
        'typeahead'
        ],
        function(config, model, Mustache, template){

    return Backbone.View.extend({
        initialize:function(){
            // Make it easy to reference this object in event handlers
//             _.bindAll(this, 'update', 'save');
            this.listenTo(this.model, "change", this.render);
        },
        render: function(){
            var data = this.model.toJSON()
            data.geocode_end_time_human = this.model.get_end_time_human()
            this.$el.html(Mustache.render(template, data));
            this.delegateEvents()
        }
    });
});

