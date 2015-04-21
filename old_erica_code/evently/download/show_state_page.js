function(){
	// Get the list of state page URLS out of its option values
	// That is a bit challenging, because the format may be different for each directory.
	// So, I think we need a regular expression editor here.
	// TODO: Get the select box via a user's click, and record its xpath so it can be found later.
	// TODO: Get the user to confirm that this select box is found by that xpath
	// TODO: Disable the select box immediately after the user clicks on it, so they can't 
	//			click on one of its options and fire a page load event.
	var el = $(this),
		db = $$(this).app.require('db').db,
		options = $(el).children(),
		values = [];
	for (var i=0; i<options.length; i++){
		values[i] = $(options[i]).val();
	}
	dir.state_page_values = values;
	// Get cong data from a URL like this:  http://opc.org/locator.html?state=WA&search_go=Y
	// TODO: But, this URL only works for the OPC site, so we'll have to generalize this code
	//			to work for other sites too.
	// TODO: Maybe the way to do that is to ask the user to confirm or enter what the URL is
	//			for an example state page ("To what URL does this link normally lead? 
	//			<input type='text' />")
	// 			and to enter what other URL or POST parameters are necessary to make that page
	//			load a state correctly,
	//			and ask the user what the parameter name is for which the state drop-down box
	//			provides a value.
	// Get only the first state name for now
	for (var i=0; i<values.length; i++){
		if (values[i] !== ""){
			var state_name = values[i];
			break;
		}
	}
	dir.state_url = 'http://opc.org/locator.html?state=' + state_name + '&search_go=Y'
	db.saveDoc(dir, {
		success:function(msg){
			// Display the contents of the state page
			db.openDoc(msg.id, {
				success:function(doc){
					// Hide divs we don't need now
					$("#state_page, #url_and_display_type, #directory_type, #cong_details_fields_selector").hide(1000);
					$('#cong_details_url_selector').html(doc.state_url_html)
					// Show state details page div
					$("#cong_details_url, #cong_details_url_selector").show(1000);
					$('#cong_details_url_selector a').click(function(e){
						show_select_cong_details(e, this);
					});
				}
			})
		}
	})
	//TODO else notify user that they did not click into a select element
}