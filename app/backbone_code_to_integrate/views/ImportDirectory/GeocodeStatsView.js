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
            this.listenTo(this.collection.geocode_stats, "change", this.render);
        },
        render: function(){
            this.$el.html(Mustache.render(template, this.collection.geocode_stats.toJSON()));
            this.delegateEvents()
        }
    });
});

