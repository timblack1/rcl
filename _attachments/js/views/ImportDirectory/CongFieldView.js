define([
        '../../config',
        '../../vendor/mustache',
        'text!views/ImportDirectory/CongField.html'
        ], 
        function(config, Mustache, template){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            // TODO: Render individual views for each field, and append them to fields_container
            $('#fields_container').append(Mustache.render(template, this.options.field));
            this.delegateEvents()
            // Attach event handler here since the events hash below doesn't seem to do it
            $('#' + this.options.field.db_name + '_row').on('click',this.row_clicked)
        },
        events: {
            'click': 'row_clicked',
            'click button':'recreate_regex'
        },
        recreate_regex:function(event){
            // Clear the div
            $('#' + this.options.field.db_name + '_div').html('')
            // TODO: Recreate the regex by including one more (HTML? space-separated string?)
            //  element of context on each side
        },
        row_clicked: function(event) {
            
            // Notify the user that this is the selected field
            $('.field_row').removeClass('field_selected')
            $('#' + this.options.field.db_name + '_row').addClass('field_selected')

            // Create global dir.fields object if it doesn't already exist
            if (typeof window.app.dir.get('fields') === 'undefined') {
                window.app.dir.set('fields', {})
            }
            
            // If this field's settings have already been stored in dir.fields, 
            //      load it in the textarea
            // TODO: Make textarea a Backbone view
            if (window.app.dir.get('fields')[this.field] !== undefined){
                $('#details_regex').val(window.app.dir.get('fields')[this.field].regex);
            }
            
            // Store which field was selected last, so the create_regular_expression mouseup handler 
            //  can determine which field to write to
            window.app.dir.set('currently_selected_field', this.options.field.db_name)
        }

    });

});
