function(){

	// TODO: Is elem needed?
	var elem = $(this),
		db = $$(this).app.require('db').db
		// TODO: Get model working
		//var model = $$(this).app.require('model').model
	
	// Delay this to run after typing has stopped for 2 seconds, so we don't send too many requests
	// TODO: Don't fire on every key event, but only once after delay.
	//			The way to do this is not via setTimeout, but probably something like a while loop
	//setTimeout(function(){

	function populate_dir(cgroup){
		// Populate directory with new data from page
		if (typeof dir.cgroup_id === 'undefined') {
			dir.cgroup_id = cgroup.id
		}
		// TODO: We should check to see whether any directory already uses the URL the user is entering, 
		//			and if it is present, say something like:
		//			"This URL is already in the database.  Would you like to edit its settings?"
		dir.url = $('#url').val();
		dir.get_url_contents = true // triggers changes_listener.js
		dir.name = $('#directory_name').val()
		dir.abbreviation = $('#abbreviation').val()
		// TODO: Should we do a fuzzy search or autocomplete, to get the user to pick the right cgroup?
		// Save request to get contents of URL to database
		console.log(dir)
		// TODO: This saveDoc call causes a "Document update conflict."
		//			Is this because the changes listener has already changed the document?
		//			It does happen only on the second modification of the doc, so maybe.
		db.saveDoc(dir, {
			success:function(msg){
				// Watch for Node changes listener's response
				var changes = db.changes()
				changes.onChange = function(change){
					console.log(change)
					// Get document by id
					db.openDoc(change.id, {
						success:function(msg){
							// Determine if the changed document is the one we are editing, and if it has a value for url_html		
							// Get the document's url_html
							// Is msg the full doc?
							console.log(msg)
						}
					})
				}
				changes.stop();
			}
		})
	}
		
	function create_dir(cgroup){
		
		// Create directory if it does not exist in the browser's memory
		if (typeof dir === 'undefined'){
			// Get directory doc from db if it exists there
			db.view('rcl/directories', {
				keys:[$('#abbreviation').val()],
				include_docs:true,
				success:function(data){
					if (data.rows.length>1){
						// TODO: Throw an error or handle the problem that this directory has multiple entries
						console.log("Error:  More than one copy of this directory's settings are found in the database.")
					}else if (data.rows.length==1){
						// We found the right directory
						dir = data.rows[0]
					}else{
						// Create new directory document from here
						dir = {type:'directory'};
					}
					populate_dir(cgroup)
				}
			})
		}else{
			// Use existing directory object in browser's memory
			populate_dir(cgroup)
		}
	}
		
	// If the associated cgroup exists in the db, get it
	var cgroup = ''
	// Query database by cgroup.abbreviation
	db.view('rcl/cgroup-by-abbreviation', {
		keys:[$('#abbreviation').val()],
		include_docs:true,
		success:function(data){
			if (data.rows.length==1){
				// Get this cgroup from the db
				var cgroup = data.rows[0]
				create_dir(cgroup)
			}else if (data.rows.length > 1){
				// Report error
				console.log("Error:  More than one copy of this cgroup's settings are found in the database.")
			}else if (data.rows.length==0){
				// Otherwise, create that cgroup
				var cgroup = {
						type:	'cgroup',
						name:	$('#directory_name').val(),
						abbreviation:	$('#abbreviation').val()
				}
				db.saveDoc(cgroup,{
					success:function(data){
						cgroup.id = data._id
						create_dir(cgroup)
					}
				})
			}
		}
	})
	
	

//	$.ajax({
//		type: "POST",
//		url: "/cong/get_page_type",
//		data: ({url : directory.url}),
//        success: function(msg){
//			// TODO: In the controller & output to form, handle whether this is an RSS feed or an HTML page
//        	$("#url_result_div").innerHTML = msg;
//        	if (msg == 'html'){
//        		$("#directory_type").show(1000);
//        		$("#rss_feed").hide(1000);
//        		directory.page_type = 'html';
//        	} else if (msg == 'rss'){
//        		// TODO: Display the right form controls for an RSS page
//        		$("#directory_type").hide(1000);
//        		$("#rss_feed").show(1000);
//        		directory.page_type = 'rss';
//        	} else { // We got an error code
//        		// Hide the form controls.
//        		elem.trigger('hide_subform');
//        	}
//        },
//        error: function(xhr, ajaxOptions, thrownError){
//          $("#url_result_div").innerHTML = xhr.responseText;
//        },
//		statusCode: {
//			500: function(data, textStatus, jqXHR){
//				// TODO: Handle 500 errors here
//				//alert(data);
//				//alert(data.responseText)
//				// TODO: Even though Chrome's developer tools says the server is returning a 500 error,
//				//			This code does not seem to be running.
//				console.log("The 500 error handler is running.");
//				elem.trigger('hide_subform');
//			},
//			404: function(data, textStatus, jqXHR){
//				// TODO: Handle 404 errors here
//				elem.trigger('hide_subform');
//			}
//		}
//	});

	//},2000);
	
}