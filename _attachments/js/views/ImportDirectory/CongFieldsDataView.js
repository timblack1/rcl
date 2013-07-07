define([
        '../../config',
        '../../vendor/mustache',
        'text!views/ImportDirectory/CongFieldsData.html'
        ], 
        function(config, Mustache, template){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            // TODO: Render individual views for each field, and append them to fields_container
        	var fields = [
        	              {name: "Caney OPC"},
        	              {name: "Bartlesville OPC"},
        	              ]
            $('.cong_fields_data').append(Mustache.render(template, {fields: fields}));
            this.delegateEvents()
        }   
    });
});
