define([
        '../../config',
        '../../vendor/mustache',
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
            this.cong_fields_view = new CongFieldsView({el: $('#fields_container')})
            this.cong_fields_view.render()
            // TODO: Make popovers out of the sub-steps and forms (regex) here:
            //  http://twitter.github.io/bootstrap/javascript.html#popovers
            // Listen for and handle a selection event in cong_details_fields_selector
            $('#cong_details_fields_selector').mouseup(this.create_regular_expression);
        },
        create_regular_expression:function(event){
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
            
            // TODO: Test to see if this combination of XPATH and regex gets the correct string out of the HTML
            // TODO: Use XPATH to get selection_parent_html
            var regex = new RegExp(field_regex)
            var result = regex.exec(selection_parent_html)[1]

            // TODO: Tim start here
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
            var db_name = window.app.dir.get('currently_selected_field')
            $('#' + db_name + '_div').html(RegExp.unescape(result))
        
            // Store the current settings into the dir
            var fields = window.app.dir.get('fields') ? window.app.dir.get('fields') : {}
            fields[db_name] = {
                        'element_xpath_local':element_xpath_local,
                        'element_xpath':element_xpath,
                        'regex':field_regex
            }
            // Write directory to the database
            window.app.dir.fetch({success:function(){
                // TODO: Why is this trying to PUT 19 times for one attempt?!
                //  This drives the memory usage up when Chrome's console is open
                window.app.dir.save({fields:fields})
            }})

            // Put field_regex in textarea to allow the user to edit it
            $('#cong_details_fields_selector').popover('destroy')
            $('#cong_details_fields_selector').popover({
                placement:'top',
                html:true,
                content:"Please edit this regular expression.  (<a href=''>Here's how</a>)<br /><textarea>" + field_regex +
                        "</textarea>",
                trigger:"manual"
            })
            // TODO: Explain how to edit the regex in a modal popup window, as follows:
            // [Explain how here, using explanation found in RegexEditor.html.]  " +
            //                        "You can read documentation about the regular expression syntax at " +
            //                        "<a href='http://www.w3schools.com/jsref/jsref_obj_regexp.asp' target='_blank'>W3Schools</a> "+
            //                        "and <a href='https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions' "+
            //                        "target='_blank'>Mozilla Developer Network</a>."
            $('#cong_details_fields_selector').popover('show')
            // Start here
            // TODO: Add onchange event to the textarea to write changes to the Backbone model and save to the db
        }
    });

});
