define([
        '../../config',
        '../../lib/mustache',
        'text!views/ImportDirectory/CongDetails.html',
        './CongFieldsView'
        ], 
        function(config, Mustache, template, CongFieldsView){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            $('#steps').html(Mustache.render(template));
            this.delegateEvents()
            this.cong_fields_view = new CongFieldsView({el: $('#fields_table_container')})
            this.cong_fields_view.render()
        }
    });

});