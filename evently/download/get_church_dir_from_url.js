function(){

	var elem = $(this),
		db = $$(this).app.require('db').db
		// TODO: Get model working
		//var model = $$(this).app.require('model').model
		// Example usage of CouchObject model
//		// Create a cong
//		var cong = model.types.Cong.init({
//		    name:'Caney OPC',
//		    mailing_state:'KS'
//		})
//		// Or create first, then populate second
//		var cong = model.types.Cong.init()
//		// Retrieve a cong from the database
//		var cong = model.types.Cong.init(id)
//		groups = cong.groups
//		
	
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
		// TODO: This saveDoc call sometimes causes a "Document update conflict."
		//			Is this because the changes listener has already changed the document?
		//			It does happen only on the second modification of the doc, so maybe.
		//			Or is it because we are not using the _rev when we save?
		// TODO: Problem here is that when I try to update the db using the directory object existing in
		//	memory, I get an update conflict (in the client or on the server?), because 
		//	the dir in memory has an out of date revision 
		//	number.  So I need to update the rev (and maybe other attributes) of the dir in memory 
		//	from the db
		// TODO: Move the rev-checking and object syncing code below into CouchAppObject.js
		db.saveDoc(dir, {
			success:function(msg){
				// Set the local copy of the directory's new _rev
				dir._rev = msg.rev
				console.log(dir._rev)
				// Watch for Node changes listener's response
				var changes = db.changes()
				changes.onChange(function(change){
					console.log(change)
					// Determine if the changed document is the one we are editing 
					if (change.id == dir._id){
						// Get document by id
						db.openDoc(change.id, {
							success:function(doc){
								// Put new dir from db into memory
								// TODO: This should set dir._rev to the rev in the db, but doesn't
								// start here
								dir = doc
								// if the new doc has a value for url_html
								if (dir.url_html){
									// Determine whether url_html contains HTML or RSS
							        if ("</html>" in dir.url_html){
							        	dir.pagetype = 'html'
							        }
							        elseif ("</rss>" in dir.url_html){
							        	dir.pagetype = 'rss'
							        }
						        	console.log(dir.pagetype)
								}
							}
						})
					}
				})
				// TODO:  I'm a little confused.  Because changes.onChange is asynchronous, do we need
				//	changes.stop() here?
				//changes.stop();
			}
		})
	}
		
	function create_dir(cgroup){
		// Create directory if it does not exist in the browser's memory
		if (typeof dir === 'undefined'){
			// Get directory doc from db if it exists there
			// TODO: Move this into model.cgroup
			db.view('rcl/directories', {
				keys:[$('#abbreviation').val()],
				include_docs:true,
				success:function(data){
					if (data.rows.length>1){
						// TODO: Throw an error or handle the problem that this directory has multiple entries
						console.log("Error:  More than one copy of this directory's settings are found in the database.")
						// TODO: When I refresh http://localhost:37470/rcl/_design/rcl/import_directory.html,
						//	I get this error in an alert box: "The document could not be saved: Document update conflict."
						//  I think this is because I'm not using the previous _rev in the saveDoc command.
					}else if (data.rows.length==1){
						// We found the right directory
						dir = data.rows[0].doc
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
	// TODO: Turn this into a view in model.cgroup
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