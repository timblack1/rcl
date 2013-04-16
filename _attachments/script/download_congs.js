// Apache 2.0 J Chris Anderson 2011
$(function() {   
    // friendly helper http://tinyurl.com/6aow6yn
    $.fn.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    var path = unescape(document.location.pathname).split('/'),
        design = path[3],
        // TODO: Why is my username and password showing up in the URL of db requests in 
        //			Chrome's Developer Tools Network panel?  Shouldn't authentication be handled 
        //			by a cookie after it is initialized?
        db = $.couch.db(path[1]);
    $("#account").couchLogin({});
   
    // TODO: Put custom evently code here
    
    $.couch.app(function(app) {
        $("#mainmenu").evently("mainmenu", app);
        $("#download").evently("download", app);
	});
    
	// TODO: We are trying to get the AJAX request to work on the "on key up" event; but no luck so far. 
	// attach this AJAX call to the form element with an event
	$('#details_regex').keyup(function() {
		if (!directory.fields[selected_field]){
			directory.fields[selected_field] = {};
		}
		directory.fields[selected_field].regex = $('#details_regex').val();
		store_directory();
	});
	
	function store_directory(){
		// Write the directory to the database
		directory.name = $('#cgroup_name').val();
		directory.abbreviation = $('#abbreviation').val();
		$.post(
				'/cong/store_directory_regex',
				// Convert the directory object into json before sending it to the server.
				{'dir_json': JSON.stringify({
												'directory':directory
											})
				},
				function(data){
					// TODO: Handle an error response - if this returns an error, then notify the user
				}
		);
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
	

	
	function show_retry_button(el){
		// Record which field's text box was clicked in a global variable
		selected_field = $(el).attr('id');
		// Show this field's "No, this isn't right" button, and hide all others
		$('#fields_table button').hide();
		$('#' + selected_field + '_button').show();
		// Create global directory.fields object if it doesn't already exist
		if (typeof directory.fields === 'undefined') {
			directory.fields = {};
		}
		// TODO:  This doesn't actually work yet, for some reason
		// If this field's settings have already been stored in directory.fields, 
		//		load it in the textarea
		if (directory.fields[selected_field]!=undefined){
			$('#details_regex').val(directory.fields[selected_field].regex);
		}
		// Listen for and handle a selection event
		$('#cong_details_fields_selector').mouseup(create_regular_expression());
	}
	function show_select_cong_details(e, el){
		// Disable the links in the new content we have loaded
		e.preventDefault();
		// Get the base_url of the directory site
		directory.base_url = $('#url').val().split('/')[2];
		// Get the URL of the cong page
		directory.cong_page_url = $(el).attr('href');
		$.get(
				'/cong/get_page_content',
				// Load the URL of the link that was clicked into a div
				{url:'http://' + directory.base_url + '/' + directory.cong_page_url},
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
	
	// ------------------- MAIN CODE --------------------------
	
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
    
 });