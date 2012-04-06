$(document).ready(function() {
	
	// ----------------- DEFINE UTILITY FUNCTIONS --------------------------------

	function hide_subform(){
		$("#directory_type, #rss_feed, #cong_details, #state_page, #church_directory_page").hide(1000);
	}
	hide_subform();
	
	function test_regex_ajax(el){
		$.ajax({
			type: "POST",
			url: "/cong/test_regex_ajax",
			data: ({regex : el.val()}),
            success: function(msg){
              $("#result_div").innerHTML = msg;
            },
            error: function(xhr, ajaxOptions, thrownError){
              $("#result_div").innerHTML = xhr.responseText;
            },
			statusCode: {
				500: function(data, textStatus, jqXHR){
					// TODO: Handle 500 errors here
					//alert(data);
					//alert(data.responseText)
				}
			}
		});
	}
	
	// TODO: We are trying to get the AJAX request to work on the "on key up" event; but no luck so far. 
	// attach this AJAX call to the form element with an event
	$('#details_regex').keyup(function() {
		// TODO: Don't post the textarea's value to the server on keyup
		// test_regex_ajax($('#details_regex'));
		// TODO: Instead, write the textarea's value to the global selections variable, so it can be saved 
		//		in the database later
		// TODO: If selections[selected_field] doesn't exist, this returns:
		//		Uncaught TypeError: Cannot set property 'field_regex' of undefined
		if (!selections[selected_field]){
			selections[selected_field] = {};
		}
		selections[selected_field].field_regex = $('#details_regex').val();
	});
	
	function store_selection_data(selection,element,element_xpath_local,element_xpath,s){
		field_regex = $('#details_regex').val();
		// Put an object in the array under the selected_field (field name) as its array key
		// TODO: Fix this.  For some reason the array ends up being empty after this call.
		selections[selected_field] = {
				'selection':selection,
				'element':element,
				'element_xpath_local':element_xpath_local,
				'element_xpath':element_xpath,
				'string':s,
				'regex':field_regex
		};
		console.log(selections);
	}

	function getXPath( element ){
	    var xpath = '';
	    for ( ; element && element.nodeType == 1; element = element.parentNode )
	    {
	        var id = $(element.parentNode).children(element.tagName).index(element) + 1;
	        id > 1 ? (id = '[' + id + ']') : (id = '');
	        xpath = '/' + element.tagName.toLowerCase() + id + xpath;
	    }
	    return xpath;
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
			var selection = getSelected();
			// Get the XPath of the selected element
			// Note that you have to pass it a DOM element, not a JQuery element, hence the [0] index
			var element_xpath_local = getXPath(element[0]);
			// Replace RCL's local HTML page's xpath prefix with the remote congregation directory's 
			// 		xpath prefix, which should be '/html'
			var rcl_xpath_prefix = '/html/body/div[2]/div/div[5]/div';
			var element_xpath = element_xpath_local.replace(rcl_xpath_prefix, '/html');
			// Get the string that was selected
			var s = new String(selection);

			// Create a regular expression using the above data.
			var selection_parent_html = $.trim(element.parent().html());
			// example selection_parent_html:  "<h2>GRACE - Wasilla, AK</h2>"
			// We want to get just "GRACE" out of the string
			// Like this:  "<h2>(.+?) - Wasilla, AK</h2>"
			// We already know s = 'GRACE'
			var field_regex = selection_parent_html.replace(s,"(?P<" + selected_field + ">.+?)");
			// Put regex in textarea to allow the user to edit it
			$('#details_regex').val(field_regex);
			// Run the regular expression in Python and return the resulting match
			$.post(
					'/cong/test_single_regex',
					{
						'regex':field_regex,
						'string':selection_parent_html
					},
					function(data){
						// TODO: Instead of immediately reporting the match to the user, we 
						//		should test whether data.match == s, and if it doesn't, then
						// 		we may need to create a regular expression that searches for 
						//		[tag_begin] 1 character + "GRACE" + 1 character [tag_end] to give the regex 
						//		enough context to get the correct data out of the string.
						//		This is what the "No, this isn't right" button is for.
						if (data.match == s){
							// TODO: Expand regular expression to include surrounding parent tags
						}
						// Insert the regex's match into the appropriate text box to allow 
						//		the user to confirm that the regex matched the right data
						$('#' + selected_field).val(data.match);
						// Store the current settings into the selections array
						store_selection_data(selection,element,element_xpath_local,element_xpath,s);
						
						// TODO: Write the selections array to the database for this directory
					}
			);
		});
	}
	
	function show_retry_button(el){
		// Record which field's text box was clicked in a global variable
		selected_field = $(el).attr('id');
		// Show this field's "No, this isn't right" button, and hide all others
		$('#fields_table button').hide();
		$('#' + selected_field + '_button').show();
		// Create global selections array if it doesn't already exist
		if (typeof variable === 'undefined') {
			selections = [];
		}
		// TODO:  This doesn't actually work yet, for some reason
		// If this field's settings have already been stored in the selections 
		//		array, load it in the textarea
		if (selections[selected_field]!=undefined){
			$('#details_regex').val(selections[selected_field].regex);
		}
		// Listen for and handle a selection event
		$('#cong_details_fields_selector').mouseup(create_regular_expression());
	}
	function show_select_cong_details(e, el){
		// Disable the links in the new content we have loaded
		e.preventDefault();
		// Get the base_url of the directory site
		var base_url = $('#url').val().split('/')[2];
		$.get(
				'/cong/get_page_content',
				// Load the URL of the link that was clicked into a div
				{url:'http://' + base_url + '/' + $(el).attr('href')},
				function(msg){
					$('#cong_details_fields_selector').html(msg);
					// Hide divs we don't need now
					$("#cong_details_url").hide(1000);
					// Show cong fields selector div, regex div
					$('#cong_details_fields').show(1000);
					$('#fields_table input').click(function(){
						show_retry_button(this);
					});
				}
		);
	}
	function show_state_page(el){
		// Get the list of state page URLS out of its option values
		// That is a bit challenging, because the format may be different for each directory.
		// So, I think we need a regular expression editor here.
		// TODO: Create a regular expression to find this select box
		// TODO: Get the user to confirm that this select box is found by that regular expression
		// TODO: Disable the select box immediately after the user clicks on it, so they can't click on one of its options and fire a page load event.
		var options = $(el).children();
		var values = [];
		for (var i=0; i<options.length; i++){
			values[i] = $(options[i]).val();
		}
		// Get cong data from a URL like this:  http://opc.org/locator.html?state=WA&search_go=Y
		// TODO: But, this URL only works for the OPC site, so we'll have to generalize this code to work for other sites too.
		// TODO: Maybe the way to do that is to ask the user to confirm or enter what the URL is for an example state page ("To what URL does this link normally lead? <input type='text' />")
		// 			and to enter what other URL or POST parameters are necessary to make that page load a state correctly,
		//			and ask the user what the parameter name is for which the state drop-down box provides a value.
		for (var i=0; i<values.length; i++){
			if (values[i] !== ""){
				var state_name = values[i];
				break;
			}
		}
		$.get(
				'/cong/get_page_content',
				{url:'http://opc.org/locator.html?state=' + state_name + '&search_go=Y'},
				function(msg){
					// Hide divs we don't need now
					$("#state_page, #url_or_rss, #directory_type, #cong_details_fields_selector").hide(1000);
					// Load contents of state page in state details div
					$('#cong_details_url_selector').html(msg);
					// Show state details page div
					$("#cong_details_url").show(1000);
					$('#cong_details_url_selector a').click(function(e){
						show_select_cong_details(e, this);

					});
				}
		);		
		//TODO else notify user that they did not click into a select element
	}
	function get_church_dir_from_url(el){
		$.ajax({
			type: "POST",
			url: "/cong/get_page_type",
			data: ({url : el.val()}),
            success: function(msg){
				// TODO: In the controller & output to form, handle whether this is an RSS feed or an HTML page
            	$("#url_result_div").innerHTML = msg;
            	if (msg == 'html'){
            		$("#directory_type").show(1000);
            		$("#rss_feed").hide(1000);
            	} else if (msg == 'rss'){
            		// TODO: Start here:  Display the right form controls for an RSS page
            		$("#directory_type").hide(1000);
            		$("#rss_feed").show(1000);
            	} else { // We got an error code
            		// Hide the form controls.
            		hide_subform();
            	}
            },
            error: function(xhr, ajaxOptions, thrownError){
              $("#url_result_div").innerHTML = xhr.responseText;
            },
			statusCode: {
				500: function(data, textStatus, jqXHR){
					// TODO: Handle 500 errors here
					//alert(data);
					//alert(data.responseText)
					// TODO: Even though Chrome's developer tools says the server is returning a 500 error,
					//			This code does not seem to be running.
					console.log("The 500 error handler is running.");
					hide_subform();
				},
				404: function(data, textStatus, jqXHR){
					// TODO: Handle 404 errors here
					hide_subform();
				}
			}
		});
	}
	
	// ------------------- MAIN CODE --------------------------
	
	$('#url').keyup(function() {
		// Delay this to run after typing has stopped for 2 seconds, so we don't send too many requests
		// TODO: Don't fire on every key event, but only once after delay.
		//setTimeout(function(){
		      get_church_dir_from_url($('#url'));
		//},2000);
	});
	/* attempt to find a text selection */
	function getSelected() {
		if (window.getSelection) { return window.getSelection(); }
		else if(document.getSelection) { return document.getSelection(); }
		else {
			var selection = document.selection && document.selection.createRange();
			if(selection.text) { return selection.text; }
			return false;
		}
		return false;
	}
	
	// Attach an event to the radio buttons named "type"
	$('input[name="type"]').click(function(){
		var type = $('input:radio[name=type]:checked').val();
		//	TODO: If "One Page" is selected, then show page containing list of all congs.
		if (type=='one page'){
			// Show the one page divs
			$("#state_page").hide(1000);
		}
		//  If "One state per page" is selected, then drop down box showing state options.
		if (type=='state pages'){
			// Show the state page divs
			$("#state_page").show(1000);this
			// Populate state_drop_down_selector div with contents of church directory page, maybe in a scrollable div
			$.post(
					'/cong/get_page_content',
					{url:$('#url').val()},
					function(msg){
						$('#state_drop_down_selector').html(msg);
						// Bind the click event on all select elements
						$("select").mousedown(function(e){
							show_state_page(this);
						});
					}
			);
		}
	});

});
