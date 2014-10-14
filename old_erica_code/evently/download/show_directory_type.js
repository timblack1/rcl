function(){
	var type = $('input:radio[name=type]:checked').val();
	var elem = $(this)
	// TODO: Why doesn't this allow the other radio button to be selected once one button is selected?
	if (type=='one page'){
		// Show the one page divs
		$("#state_page").hide(1000);
		// TODO: If "One Page" is selected, then show page containing list of all congs.
		dir.display_type = type;
	}
	//  If "One state per page" is selected, then drop down box showing state options.
	if (type=='one state per page'){
		// Show the state page divs
		$("#state_page").show(1000);
		dir.display_type = type;
		// Populate state_drop_down_selector div with contents of church directory page, 
		//	maybe in a scrollable div
		$('#state_drop_down_selector').html(dir.url_html);
		// We bind the event here because the select element didn't exist at this Evently widget's 
		//	initialization
		$('#state_drop_down_selector select').mousedown(function(){elem.trigger('show_state_page')})
	}
	elem.trigger('hide_dir_and_display_type')
}