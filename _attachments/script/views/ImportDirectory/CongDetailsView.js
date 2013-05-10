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
        },
        events: {
            "focus #fields_table_mustache input[type=text]": "display_button"
        },
        display_button: function(event) {
            // Record which field's text box was clicked in a global variable
            selected_field = $(event.target).attr('id');
            // Show this field's "No, this isn't right" button, and hide all others
            $('#fields_table_mustache button').hide();
            $('#' + selected_field + '_button').show();
            // Create global dir.fields object if it doesn't already exist
            if (typeof dir.get('fields') === 'undefined') {
                dir.set('fields', {});
            }
            // TODO:  This doesn't actually work yet, for some reason
            // If this field's settings have already been stored in dir.fields, 
            //      load it in the textarea
            if (dir.get('fields')[selected_field] !== undefined){
                $('#details_regex').val(dir.get('fields')[selected_field].regex);
            }
            // Listen for and handle a selection event
            $('#cong_details_fields_selector').mouseup(create_regular_expression());
            
         
        }
    });

});