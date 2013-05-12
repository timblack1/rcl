define([
        '../../config',
        '../../lib/mustache',
        'text!views/ImportDirectory/CongFields.html'
        ], 
        function(config, Mustache, template){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
            // List field names
            // TODO: Should we get these field names out of the model?
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
            var fields = []
            for (var i=0; i < field_names.length; i++){
                fields.push({
                  pretty_name:config.capitalize(field_names[i].replace('_', ' ')),
                  db_name:field_names[i]
                })
            }
            this.fields = fields
        },
        render: function(){
            $('#fields_table_container').html(Mustache.render(template, {fields:this.fields}));
            this.delegateEvents()
        },
        events: {
            "focus #fields_table_mustache input[type=text]": "display_button"
        },
        recreate_regex:function(event){
            // test to see if this is a button which ends with _button
            if ($(event.target).attr("id").match(/_button$/)){
                //calculate the associated text boxes id from that button's id
                var text_box_id = $(event.target).attr("id").replace('_button',"")
                console.log(text_box_id)
                //http://stackoverflow.com/questions/12045675/clearing-the-entry-box-text-when-clicking-a-button
                // Clear the text box
                $('#' + text_box_id).val('')
                // TODO: Recreate the regex by including one more (HTML? space-separated string?)
                //  element of context on each side
                
             }
        },
        display_button: function(event) {
            
            // Record which field's text box was clicked
            this.selected_field = $(event.target).attr('id');
            // Show this field's "No, this isn't right" button, and hide all others
            $('#fields_table_mustache button').hide();
            $('#' + this.selected_field + '_button').show();
            // Create global dir.fields object if it doesn't already exist
            if (typeof window.app.dir.get('fields') === 'undefined') {
                window.app.dir.set('fields', {});
            }
            // TODO:  This doesn't actually work yet, for some reason
            // If this field's settings have already been stored in dir.fields, 
            //      load it in the textarea
            if (window.app.dir.get('fields')[this.selected_field] !== undefined){
                $('#details_regex').val(window.app.dir.get('fields')[this.selected_field].regex);
            }
            var thiz = this
            
            function create_regular_expression(){
                $('#cong_details_fields_selector *').mouseup(function(event){
                    // Create a regular expression to get the selected cong field's data out of the HTML

                    // Prevent the event from propagating further up the DOM tree
                    //event.cancelBubble = true; // TODO: is this required for IE?
                    event.stopPropagation();
                    // Prevent the click from causing the browser to follow a link or do anything else we don't want
                    event.preventDefault();
                    
                    // Get the element that was clicked
                    var element = $(event.target);
                    // Get the selected text
                    
                    function getSelected(event) {
                        if (window.getSelection) { return window.getSelection(); }
                        else if(document.getSelection) { return document.getSelection(); }
                        else {
                            var selection = document.selection && document.selection.createRange();
                            if(selection.text) { return selection.text; }
                            return false;
                        }
                        return false;
                    }
                     
                    var selection = getSelected();
                    // Get the XPath of the selected element
                    // Note that you have to pass it a DOM element, not a JQuery element, hence the [0] index
                    var element_xpath_local = config.getXPath(element[0]);
                    // Replace RCL's local HTML page's xpath prefix with the remote congregation directory's 
                    //      xpath prefix, which should be '/html'
                    var rcl_xpath_prefix = '/html/body/div[2]/div/div[5]/div';
                    var element_xpath = element_xpath_local.replace(rcl_xpath_prefix, '/html');
                    // Get the string that was selected
                    var s = new String(selection);
                    // Escape periods so they aren't interpreted as regular expressions
                    var s_escaped = s.replace(/\./g,'\\.');

                    // Regex escape and unescape functions
                    // TODO: Move these functions out into a shared library
                    RegExp.escape = function(text) {
                        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                    }
                    RegExp.unescape = function(text){
                        // All this does is remove all backslashes from its input
                        return text.replace(/\\+/g, "");
                    }
                    // Create a regular expression using the above data.
                    var selection_parent_html = $.trim(element.html()).replace(/\./g,'\\.');
                    // example selection_parent_html:  "<h2>GRACE - Wasilla, AK</h2>"
                    // We want to get just "GRACE" out of the string
                    // Like this:  "<h2>(.+?) - Wasilla, AK</h2>"
                    // We already know s = 'GRACE'
                    var field_regex = selection_parent_html.replace(s_escaped,"(.+)").replace(/\\\./g,'\\\\.');
                    // Put regex in textarea to allow the user to edit it
                    // TODO: Maybe move this into a Backbone model change listener event on the regex textarea's model
                    //  so the textarea updates itself whenever the regex changes in the model
                    $('#details_regex').val(field_regex);
                    
                    // TODO: Test to see if this combination of XPATH and regex gets the correct string out of the HTML
                    // TODO: Use XPATH to get selection_parent_html
                    var regex = new RegExp(field_regex)
                    var result = regex.exec(selection_parent_html)[1]

                    // TODO: Tim start here
                    // TODO: For some reason the remote page's HTML reloads after the mouseup event which 
                    //  runs this function.  This removes the user's text selection, which is not nice for the user.
                    //  Maybe related:  sometimes when the remote page's HTML first loads when step 5 renders,
                    //      the HTML appears to load twice.
                    
                    // TODO: Instead of immediately reporting the match to the user, we 
                    //      should test whether result == s, and if it doesn't, then
                    //      we may need to create a regular expression that searches for 
                    //      [tag_begin] 1 character + "GRACE" + 1 character [tag_end] to give the regex 
                    //      enough context to get the correct data out of the string.
                    //      This is what the "No, this isn't right" button is for.
                    // if (result != s){
                    //     // TODO: Expand regular expression to include surrounding parent tags
                    // }
                    // Insert the regex's match into the appropriate text box to allow 
                    //      the user to confirm that the regex matched the right data.
                    //      Unescape this to remove slashes
                    $('#' + thiz.selected_field).val(RegExp.unescape(result))
                    // Store the current settings into the dir
                    var fields = window.app.dir.get('fields') || {}
                    fields[thiz.selected_field] = {
                                'element_xpath_local':element_xpath_local,
                                'element_xpath':element_xpath,
                                'regex':field_regex
                    }
                    window.app.dir.set('fields', fields)
                    // Write directory to the database
                    window.app.dir.fetch({success:function(){
                        window.app.dir.save()
                    }})
                });
            }
            // Listen for and handle a selection event
            $('#cong_details_fields_selector').mouseup(create_regular_expression());
            // TODO: Create a listener to handle a click on this button
            //  First see if we can create a listener in the view's events section; if not, create the listener here
         
        }

    });

});