define([
        '../../config',
        '../../lib/mustache',
        'text!views/ImportDirectory/CongField.html'
        ], 
        function(config, Mustache, template){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            // TODO: Render individual views for each field, and append them to fields_table_container
            $('#fields_table').append(Mustache.render(template, this.options.field));
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
            
            // Hide all other fields' buttons
            $('#fields_table button').hide()

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
            var thiz = this
            // Store which field was selected last, so the create_regular_expression mouseup handler 
            //  can determine which field to write to
            window.app.dir.set('currently_selected_field', this.options.field.db_name)
            
            function create_regular_expression(event){
                // Create a regular expression to get the selected cong field's data out of the HTML

                // Prevent the event from propagating further up the DOM tree
                //event.cancelBubble = true; // TODO: is this required for IE?
                event.stopPropagation();
                // Prevent the click from causing the browser to follow a link or do anything else we don't want
                event.preventDefault();
                
                // Get the element that was clicked
                var element = $(event.target);
                
                // Get the XPath of the selected element
                // Note that you have to pass it a DOM element, not a JQuery element, hence the [0] index
                var element_xpath_local = config.getXPath(element[0]);
                // Replace the xpath of the div containing the remote page with the remote congregation directory's 
                //      xpath prefix, which should be '/html'.  The result is that we store the xpath as it would work
                //      in the remote page, and if we change RCL's page structure, our stored xpath does not become
                //      obsolete.
                var rcl_xpath_prefix = config.getXPath($('#cong_details_fields_selector')[0])
                var element_xpath = element_xpath_local.replace(rcl_xpath_prefix, '/html');
                
                // Get the selected text
                function getSelectedText(event) {
                    if (window.getSelection) { return window.getSelection(); }
                    else if(document.getSelection) { return document.getSelection(); }
                    else {
                        var selection = document.selection && document.selection.createRange();
                        if(selection.text) { return selection.text; }
                        return false;
                    }
                    return false;
                }
                var selection = getSelectedText();
                
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
                // So interpolate (.+?) in place of s_escaped as an initial attempt at creating the regular expression
                var field_regex = selection_parent_html.replace(s_escaped,"(.+)").replace(/\\\./g,'\\\\.');
                // Put regex in textarea to allow the user to edit it
                // TODO: Maybe move this into a Backbone model change listener event on the regex textarea's model
                //  so the textarea updates itself whenever the regex changes in the model.
                //  Does this mean we need one textarea view per regex field?
                $('#details_regex').val(field_regex);
                
                // TODO: Test to see if this combination of XPATH and regex gets the correct string out of the HTML
                // TODO: Use XPATH to get selection_parent_html
                var regex = new RegExp(field_regex)
                var result = regex.exec(selection_parent_html)[1]

                // TODO: Tim start here
                // TODO: For some reason the remote page's HTML reloads after the mouseup event which 
                //  runs this function.  This removes the user's text selection, which is not nice for the user.
                //  Maybe related:  sometimes the HTML appears to load twice when the remote page's HTML
                //      first loads when step 5 renders.
                
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
                // TODO: This writes the same value to all used field views
                $('#' + window.app.dir.get('currently_selected_field') + '_div').html(RegExp.unescape(result))
                // TODO: This shows the button on all used field views
                // Show this field's "No, this isn't right" button
                $('#' + window.app.dir.get('currently_selected_field') + '_button').show();
            
                // Store the current settings into the dir
                var fields = window.app.dir.get('fields') ? window.app.dir.get('fields') : {}
                fields[thiz.field] = {
                            'element_xpath_local':element_xpath_local,
                            'element_xpath':element_xpath,
                            'regex':field_regex
                }
                // Write directory to the database
                window.app.dir.fetch({success:function(){
                    window.app.dir.save({fields:fields})
                }})
            }
            // Listen for and handle a selection event
            // TODO: This writes to every field view, not only this view
            //  How can I get it to write to only this view?
            $('#cong_details_fields_selector').mouseup(create_regular_expression);
            // TODO: Create a listener to handle a click on this button
            //  First see if we can create a listener in the view's events section; if not, create the listener here
         
        }

    });

});