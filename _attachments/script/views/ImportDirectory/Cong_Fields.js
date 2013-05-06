define([
        '../../config',
        '../../lib/mustache',
        'text!views/ImportDirectory/cong_fields.html'
        ], 
        function(config, Mustache, template){
    
    var Cong_Fields = Backbone.View.extend({
        initialize:function(){
            this.template = template;
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
            var fields_html = Mustache.render(this.template, {fields:fields})
            $('#fields_table_container').append(fields_html);
        },
        events: {
            "focus #fields_table_mustache input[type=text]": "display_button",
            "click #fields_table_mustache button": "recreate_regex"
        },
        recreate_regex:function(event){
            //test to see if this is a button which ends with _button
            if ($(event.target).attr("id").match(/_button$/)){
                //calculate the associated text boxes id from that button's id
            	var text_box_id = $(event.target).attr("id") .replace('_button',"")
            	console.log (text_box_id)
                //http://stackoverflow.com/questions/12045675/clearing-the-entry-box-text-when-clicking-a-button
                // Clear the text box
            	$('#' + text_box_id)
            	.val('')
                // Recreate the regex by including one more (HTML? space-separated string?)
                //  element of context on each side
                
             }
                  
                
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
        			// 		xpath prefix, which should be '/html'
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
        			// Note this is Python's named group regex syntax.
        			// If we re-write this in JavaScript's regex syntax, we cannot use named groups.
        			var field_regex = selection_parent_html.replace(s_escaped,"(.+)").replace(/\\\./g,'\\\\.');
        			// Put regex in textarea to allow the user to edit it
        			$('#details_regex').val(field_regex);
        			// Put an object in the directory.fields object under the selected_field (field name) as its property name
        			dir.set (selected_field, {
        					'element_xpath_local':element_xpath_local,
        					'element_xpath':element_xpath,
        					'regex':field_regex
        			});
        			
        			var patt=new RegExp(field_regex)
        			var result = patt.test (s)
        			console.log ("result: ", result)
        			
        			// TODO: Instead of immediately reporting the match to the user, we 
					//		should test whether data.match == s, and if it doesn't, then
					// 		we may need to create a regular expression that searches for 
					//		[tag_begin] 1 character + "GRACE" + 1 character [tag_end] to give the regex 
					//		enough context to get the correct data out of the string.
					//		This is what the "No, this isn't right" button is for.
					if (data.match != s){
						// TODO: Expand regular expression to include surrounding parent tags
					}
					// Insert the regex's match into the appropriate text box to allow 
					//		the user to confirm that the regex matched the right data.
					// 		Unescape this to remove slashes
					$('#' + selected_field).val(RegExp.unescape(data.match));
					// Store the current settings into directory.fields
					// Write directory to the database
					store_directory();
        			
        			
        		});
        	}
            // Listen for and handle a selection event
            $('#cong_details_fields_selector').mouseup(create_regular_expression());
            
         
        }
    });
    return Cong_Fields

});