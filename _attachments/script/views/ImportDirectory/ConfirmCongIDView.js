define([
        'config'
        ], 
        function(config){
    
    var ConfirmCongIDView = Backbone.View.extend({
        initialize:function(){
            this.render()
            // Ask the user which part of the URL that was clicked is the
            //  congregation ID.
            this.href = $(event.target).attr('href')
            var href = this.href
            // TODO: Handle the case where the href contains a javascript function call.  The
            //  PCA's directory works this way.
            // TODO: Handle the case where the href is empty and the click is handled
            //  by an onclick event.  This case is probably rare, so is a low priority.
            // Put href into div
            this.$('#href').html(href);
            // Try to guess the id with a regular expression, and display that id to 
            //  the user in a div.  Ask the user if it is the part of the URL that contains
            //  the congregation's id. Make it so the user only has to click a "Yes" button 
            //  to confirm if we got it right.
            this.regex = /([0-9])+/
            var href_underlined = href.replace(this.regex, '<u>$1</u>');
            this.$('#href_underlined').html(href_underlined)
        },
        render: function(){
            config.render_to_id(this, "#confirm_cong_id_template")
        },
        events: {
            "click #yes": "yes",
            "click #no": "no"
        },
        yes:function(){
            // Converts:
            //  church.html?church_id=3
            // into:
            //  church.html?church_id={cong_id}
            var url = this.href.replace(this.regex, '{cong_id}')
            this.record_id_format(url)
        },
        no:function(){
            // TODO: Otherwise, ask the user to highlight the congregation's id
        },
        record_id_format:function(url){
            // TODO: start here
            // TODO: Record the pattern of the URL the user clicked
            // TODO: If the URL is only partial, prepend the root of the URL
            var href = this.href
            if (href.indexOf('/') == 0){
                // TODO: Prepend the root of the URL
            }
            if(!href.match(/^http/)){
                // TODO: Prepend the root of the URL relative to the directory's URL
            }
            // TODO: Probably this step should not yet be called here, but only after 
            //  the user responds
            // Show step 5
            $('#cong_details_fields').show(1000)
            
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
            // Render Mustache template
            var tmpl = $('#fields_template').html();
            var fields_html = Mustache.render(tmpl, {fields:fields})
            $('#fields_table_container').append(fields_html);
        }
    });
    return ConfirmCongIDView

});