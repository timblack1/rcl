define([
        'config',
        'backbone',
        'mustache',
        'text!views/ImportDirectory/CongField.html'
        ], 
        function(config, Backbone, Mustache, template){
    
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
        row_clicked: function(event){
            
            // Notify the user that this is the selected field
            $('.field_row').removeClass('field_selected')
            // TODO: It should be possible to refer to this field's set of DOM elements more simply than this,
            //  using this.$el (or this.$() syntax and a class rather than and ID)
            $('#' + this.options.field.db_name + '_row').addClass('field_selected')
            // this.$el.addClass('field_selected')

            // Notify the user they should select the data in the remote page which belongs in this field
            $('#cong_details_fields_selector').popover('destroy')
            $('#cong_details_fields_selector').popover({
                placement:'right',
                content:"Highlight the congregation's <strong>" + this.options.field.pretty_name + "</strong> where it appears in the page below.",
                trigger:"manual"
            })
            $('#cong_details_fields_selector').popover('show')
            $('#fields_container').popover('hide')

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
