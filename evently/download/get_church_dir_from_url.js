function(){
	var elem = $(this),
	config = $$(this).app.require('config'),
	db = config.db,
	model = $$(this).app.require('model').model,
	CGroup = model.types.CGroup,
	Directory = model.types.Directory,
	Cong = model.types.Cong
	// TODO: Get model working
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
	var cong1 = Cong.init({
	    name:'Caney OPC',
	    mailing_state:'KS'
	})
	console.log(cong1)
	cong1.save()
	
	// Delay this to run after typing has stopped for 2 seconds, so we don't send too many requests
	// TODO: Don't fire on every key event, but only once after delay.
	//			The way to do this is not via setTimeout, but probably something like a while loop
	//setTimeout(function(){

	function populate_dir(cgroup){
		// Populate directory with new data from page
		if (dir.cgroup_id === undefined) {
			dir.cgroup_id = cgroup.id
		}
		// Check to see whether any directory already uses the URL the user is entering, 
		//	and if it is present, load its settings from the database and enter them into the form.
		// TODO: Later, instantiate the CouchAppObject instance here, and have it load data from
		//	the db automatically.
		dir.url = $('#url').val();
		dir.get_url_contents = true // triggers changes_listener.js
		// TODO: Should we do a fuzzy search or autocomplete, to get the user to pick the 
		//	right cgroup?

		// Save request to get contents of URL to database
		// TODO: Move the rev-checking and object syncing code below into CouchAppObject.js
		// Get current object from db
		console.log(dir)
		if (dir._id){
			// We've already gotten this dir out the db
			db.openDoc(dir._id, {
				success:function(doc){
					// Save rev for after merge
					var rev = doc._rev
					// Merge browser's copy of dir with db copy, retaining URL from browser
					$.extend(doc, dir)
					// restore rev
					doc._rev = rev
					dir = doc
					// Save new doc to db
					db.saveDoc(dir, {
						success:function(msg){
							// Set the local copy of the directory's new _rev
							dir._rev = msg.rev
							// Watch for Node changes listener's response
							var changes = db.changes();
							changes.onChange(function(change){
								// Determine if the changed document is the one we are editing 
								var change_id = change.results[0].id
								if (change_id == dir._id){
									// Get document by id
									db.openDoc(change_id, {
										success:function(doc){
											// Put new dir from db into memory
											// TODO: This should set dir._rev to the rev in the db, but doesn't,
											//	so it causes a doc update conflict in the browser
											dir = doc;
											// if the new doc has a value for url_html
											if (dir.url_html){
												// In the controller & output to form, handle whether this is an RSS feed or an HTML page
												// Determine whether url_html contains HTML or RSS
												if (dir.url_html.indexOf("</html>") > -1){
													$("#directory_type").show(1000);
													$("#rss_feed").hide(1000);
													dir.pagetype = 'html';
												}
												else if (dir.url_html.indexOf("</rss>") > -1){
													// TODO: Display the right form controls for an RSS page
													$("#directory_type").hide(1000);
													$("#rss_feed").show(1000);
													dir.pagetype = 'rss';
												}
												else { // We got an error code
													// Hide the form controls.
													elem.trigger('hide_subform');
												}
												$("#url_result_div").innerHTML = dir.pagetype;
											}
										}
									});
								}
							});
							// TODO:  I'm a little confused.  Because changes.onChange is asynchronous, do we need
							//	changes.stop() here?
							//changes.stop();
						}
					})
				}
			})
		}
	}
	
		
	function create_dir(cgroup){
		// Create directory if it does not exist in the browser's memory
		if (typeof dir === 'undefined'){
			// Get directory doc from db if it exists there
			var url = $('#url').val()
			// TODO: Move this into model.cgroup
			db.view('rcl/directories-by-url', {
				startkey:url,
				endkey:url,
				include_docs:true,
				success:function(data){
					dir = {}
					if (data.rows.length>1){
						// TODO: Throw an error or handle the problem that this directory 
						//	has multiple entries
						console.log("Error:  More than one copy of this directory's settings are found in the database.")
					}else if (data.rows.length==1){
						// We found the right directory
						// Populate dir object from db
						dir = data.rows[0].doc
					}else{
						// Create new directory document from here
						dir = {type:'directory'};
					}
					dir.url = url
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
	// TODO: Run this when the abbreviation changes, rather than when the URL changes
	console.log(db)
	db.view('rcl/cgroup-by-abbreviation', {
		keys:[$('#abbreviation').val()],
		include_docs:true,
		success:function(data){
			if (data.rows.length==1){
				// Get this cgroup from the db
				var cgroup = data.rows[0].doc
				// Populate page with this cgroup's data
				$('#cgroup_name').val(cgroup.name)
				$('#abbreviation').val(cgroup.abbreviation);
				create_dir(cgroup)
			}else if (data.rows.length > 1){
				// Report error
				console.log("Error:  More than one copy of this cgroup's settings are found in the database.")
			}else if (data.rows.length==0){
				// Otherwise, create that cgroup
				var cgroup = {
						type:	'cgroup',
						name:	$('#cgroup_name').val(),
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
}