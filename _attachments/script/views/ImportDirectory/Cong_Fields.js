define([
        '../../config',
        '../../lib/mustache'
        ], 
        function(config, Mustache){
    
    var Cong_Fields = Backbone.View.extend({
        initialize:function(){
             // List field names
            var field_names = [
                      'name',
                      'meeting_address1',
                      'meeting_address2',
                      'meeting_city',
                      'meeting_state',
                      'meeting_zip',
                      'meeting_country',
                      'mailing_address1',
                      'mailing_address2',
                      'mailing_city',
                      'mailing_state',
                      'mailing_zip',
                      'mailing_country',
                      'phone',
                      'fax',
                      'email',
                      'website',
                      'service_info',
                      'date_founded'
                    ]
            // Format field names
            fields = []
            for (var i=0; i < field_names.length; i++){
                fields.push({
                  pretty_name:config.capitalize(field_names[i].replace('_', ' ')),
                  db_name:field_names[i]
                })
            }
        },
        render: function(){
//          var id = "#confirm_cong_id_template"
//          $(id).hide()
//          config.render_to_id(this, id)
//          $(id).show(3000)            
            // Render Mustache template
            var tmpl = $('#fields_template').html();
            var fields_html = Mustache.render(tmpl, {fields:fields})
            $('#fields_table_container').append(fields_html);
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
            // Create global directory.fields object if it doesn't already exist
            // TODO: directory itself doesn't exist yet, so this throws an error
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
    return Cong_Fields

});