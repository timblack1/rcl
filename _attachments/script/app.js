// Define require() from require.js using the standard AMD define
define(['model', 'async!https://maps.googleapis.com/maps/api/js?sensor=false',
        'lib/jquery.couchLogin'], function(model){
    
    var path = unescape(document.location.pathname).split('/'),
        db = $.couch.db(path[1]);
   
    // TODO: This should probably go into a configuration file
    // Enables Mustache.js-like templating.
    _.templateSettings = {
      interpolate : /\{\{(.+?)\}\}/g
    };

//  -------------------------------------------------------------------

//    // Example of how to save a many-to-many relation to the database
//    // Create CGroup model
//    cgroups = new model.CGroups
//    OPC = cgroups.create({
//        name:'Orthodox Presbyterian Church',
//        abbreviation:'OPC'
//    })
//    // Instantiate group of congs
//    congs = new model.Congs
//    // Instantiate first congregation model
//    // TODO: Should this be global or not?
//    cong1 = congs.create({
//        name:'Caney OPC',
//        mailing_state:'KS'
//    },{
//        success:function(){
//            // Instantiate second congregation model
//            cong2 = congs.create({
//                name:'Bartlesville OPC',
//                mailing_state:'OK'
//            },{success:function(){
//                // Add congregations to cgroup
//                OPC.get('congregations').add([{_id:cong1.get('_id')},{_id:cong2.get('_id')}])
//                // Save cgroup to db
//                OPC.save({_id:OPC.get('_id')},{success:function(){
//                    $.each([cong1,cong2], function(key, cong){
//                        cong.get('cgroups').add({_id:OPC.get('_id')})
//                        cong.save({},{success:function(){
//                            // Example of how to fetch many-to-many relations from the db
//                            // Fetch the cong so as to populate its relations in the browser
//                            cong.fetch({success:function(){
//                                // Example of how to query for related CGroups
//                                var cong_cgroups = cong.get('cgroups')
//                                for (var i=0; i<cong_cgroups.length; i++){
//                                    var cgroup_id = cong_cgroups.at(i).get('_id')
//                                    var cgroup = cgroups.get(cgroup_id)
//                                }
//                                // Example of how to query by one attribute
//                                congs_by_name = new model.CongsByName
//                                congs_by_name.db.keys = ['Caney OPC']
//                                congs_by_name.fetch({success:function(col, res){
//                                    var caney_opc = col.at(0)
//                                }})
//                            }})
//                        }})
//                    })
//                }})
//            }})
//        }
//    })

//  -------------------------------------------------------------------

    // TODO: Create Backbone views here
    // TODO: Move views into separate files when they get too long or numerous here
    //  This tutorial shows how to use RequireJS with Backbone:
    //  http://backbonetutorials.com/organizing-backbone-using-modules/
    MapView = Backbone.View.extend({
        initialize: function(){
            this.render();

        	// TODO: Migrate the code below into Backbone events
        	
        	// Attach events to search_the_map form elements
        	$('#search').click(function() {
        		codeAddress();
        		return false;
        	});
        	$('#search_the_map').keypress(function(event) {
        		if (event.which==13){ // The user pressed the enter key
        			event.preventDefault();  // Prevent the default action of submitting the form
        			codeAddress();
        			return false; // This might help some browsers avoid submitting the form
        		}
        	});
        },
        render: function(){
            var template = _.template( $("#map_template").html(), {} );
            $(this.el).html( template );
            
            // Initialize Google map
            var geocoder;
            var map;
            geocoder = new google.maps.Geocoder();
            // TODO: Center the map on the viewer's country
            var latlng = new google.maps.LatLng(-34.397, 150.644);
            var myOptions = {
                    zoom: 8,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
            }
            map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
        }
    });
    MenuView = Backbone.View.extend({
        initialize: function(){
            this.render();
            // TODO: Get the menu item that is selected
            var path = unescape(document.location.pathname).split('/')
            var filename = path[path.length-1]
            // Add the "active" class to the menu item the user clicked
            $('#mainmenu a[href="' + filename + '"]').addClass('active')
        },
        render: function(){
        	var template = _.template( $("#menu_template").html(), {} );
            $(this.el).html( template );
        },
        events: {
            "click input[type=button]": "doSearch",
            "click #delete_all_opc_cgroups" : "delete_all_opc_cgroups",
            "click #delete_all_opc_directories" : "delete_all_opc_directories",
            "click #delete_all_caney_opc" : "delete_all_caney_opc",
            "click #delete_all_opc_data" : "delete_all_opc_data"
        },
        // TODO: Does this function belong here or in another view?
        doSearch: function( event ){
            // Button clicked, you can access the element that was clicked with event.currentTarget
            alert( "Search for " + $("#search_input").val() );
        },
        delete_all_opc_directories:function(){
            // Delete all OPC directories
            var db = $$(this).app.require('db').db
            console.log('in delete function')
            // Get all OPC directories
            db.view('rcl/directories',{
                keys:['OPC'],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    db.bulkRemove({docs:docs}, {
                        success:function(data){
                            //console.log(data)
                        }
                    })
                }
            })
        },
        delete_all_caney_opc:function(){
            // Delete all OPC directories
            var db = $$(this).app.require('db').db
            // Get all OPC congregations
            db.view('rcl/caney_opc',{
                keys:['Caney OPC', 'Caney OPC, second version', 'Caney OPC, third version',
                      'Bartlesville OPC'],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    db.bulkRemove({docs:docs}, {
                        success:function(data){
                            //console.log(data)
                        }
                    })
                }
            })
        },
        delete_all_opc_cgroups:function(){
            // Delete all OPC cgroups
            //var db = $$(this).app.require('db').db
            // Get all OPC groups
            db.view('rcl/cgroup-by-abbreviation',{
                keys:['OPC'],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    db.bulkRemove({docs:docs}, {
                        success:function(data){
                            //console.log(data)
                        }
                    })
                }
            })
        },
        delete_all_opc_data:function(){
            // Delete all OPC directories
            var db = $$(this).app.require('db').db
            // Get all OPC directories
            db.view('rcl/opc',{
                keys:['OPC'],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    db.bulkRemove({docs:docs}, {
                        success:function(data){
                            //console.log(data)
                        }
                    })
                }
            })
        }
     });
    
    CongregationsView = Backbone.View.extend({
        initialize: function(){
            this.render();
            // Apply tablesorter widget to table containing congregation list
    		$("#congregation_list")
            .tablesorter({widgets: ['zebra'], locale: 'us', useUI: true});
    		// TODO: For some reason the pager doesn't display, its div wraps around the table and filter widgets,
    		//		 and it breaks the sorter so when you click on the table header the rows disappear.
            //.tablesorterPager({container: $("#pager")});
        },
        render: function(){
        	var template = _.template( $("#congregations_template").html(), {} );
            $(this.el).html( template );
        }
    });
    SearchView = Backbone.View.extend({
        initialize: function(){
            this.render();
        },
        render: function(){
            var template = _.template( $("#search_template").html(), {} );
            $(this.el).html( template );
        },
        events: {
            // TODO: We are trying to get the AJAX request to work on the "on key up" event; 
            //  but no luck so far. 
            "click #search": "doSearch"
        },
        doSearch: function( event ){
        	var address = document.getElementById("search_the_map").value;
        	geocoder.geocode( { 'address': address}, function(results, status) {
        		if (status == google.maps.GeocoderStatus.OK) {
        			// Use Circle() as a helper to avoid doing math. 
        			// Convert radius*units to meters
        			var radius = $('#radius').val(); 
        			var units = $('#units').val();
        			if (units == 'miles'){
        				var distance = radius * 1609.344;
        			} else if (units == 'km') {
        				var distance = radius * 1000;
        			}
        			// Create an instance of Circle() with the selected radius
        			var loc = results[0].geometry.location;
        			var center = new google.maps.LatLng(loc.lat(), loc.lng());
        			var circle = new google.maps.Circle({radius: distance, center: center}); 
        			// Center and zoom the map to the bounds of the circle. 
        			map.setCenter(loc);
        			map.fitBounds(circle.getBounds()); // this sets the zoom 
        			// mapbounds contains an array containing two lat/lng pairs in this order:
        			// (south bottom 36, west left -96)
        			// (north top 37, east right -95)
        			var mapbounds = circle.getBounds();
        			var north_east = mapbounds.getNorthEast();
        			var south_west = mapbounds.getSouthWest();

        			var west_lng = south_west.lng();
        			var east_lng = north_east.lng();
        			var north_lat = north_east.lat();
        			var south_lat = south_west.lat();

        			// Send AJAX call to controller method containing bounds within which congregations are found
        			// So we can search like this:  cong_lat > south_lat and cong_lat < north_lat and cong_lng > west_lng and cong_lng < east_lng
        			// TODO: Create code to get congs in bounds
        			$.ajax({
        				url: "/cong/getcongsinbounds",
        				data: {
        					west_lng:	west_lng,
        					east_lng:	east_lng,
        					north_lat:	north_lat,
        					south_lat:	south_lat
        				},
        				success: function(data){
        				    // TODO: Rewrite this to use the data format returned from couchdb
        					var congs = data['congs'];
        					if (congs.length > 0){
        						// Plot the congregations returned on the map
        						function close_infowindows() {
        							for (var i2=0; i2<infowindows.length; i2++){
        								infowindows[i2].close(map,marker);
        							}
        						}

        						// TODO: Use a template rather than constructing HTML here,
        						//    and wrap the display in a self-updating Backbone view,
        						//    which should render this .remove() call unnecessary
        						// Remove existing table rows that contain congregation data (don't remove the header row)
        						$("#congregation_list tbody tr").remove();

        						var infowindows = [];
        						for (var i=0; i<congs.length; i++){
        							var point = new google.maps.LatLng(congs[i].lat, congs[i].lng);
        							var marker = new google.maps.Marker({
        								position: point,
        								map: map,
        								title: congs[i].name
        							});
        							// TODO: Make it so the city entered has a different color than results 
        							//	found and/or the results entered have an "A,B,C" feature on the pinpoint.

        							// TODO: Figure out what address formats we need to parse before sending address to Google.
        							// TODO: Figure out which line(s) (address1 or address2) is needed to send to Google.
        							// Name:	Caney OPC
        							// Add1:	CVHS Gym
        							// Add2:	300 A St <-- We need this, not addr1

        							// Name:	Caney OPC
        							// Add1:	YMCA
        							// Add2:	500 S Green St. Room 12 <-- We need this, not addr1


        							var contentString = '' +
        							'<h4 style="margin: 0">' + congs[i].name + '</h4>' +
        							'<p>' + 
        							congs[i].meeting_address1 + "<br />" + 
        							( congs[i].meeting_address2 ? congs[i].meeting_address2 + "<br />" : '' ) + 
        							congs[i].meeting_city + ", " + 
        							congs[i].meeting_state + " " + 
        							congs[i].meeting_zip + "<br />" +
        							( congs[i].phone ? congs[i].phone + "<br />" : '' ) +
        							( congs[i].website ? '<a href="http://' + congs[i].website +'">' + congs[i].website + "</a><br />" : '' ) +
        							'</p>' +
        							'<form action="http://maps.google.com/maps" method="get" target="_blank">' +
        							'Enter your starting address:' +
        							'<input type="text" name="saddr" />' +
        							'<input type="hidden" name="daddr" value="' +
        							congs[i].meeting_address1 + ', ' + 
        							congs[i].meeting_city + ", " + 
        							congs[i].meeting_state + " " + 
        							congs[i].meeting_zip + " " +
        							"(" + congs[i].name + ")" +
        							'" />' +
        							'<input type="submit" value="get directions" />' +
        							'</form>' ;


        							// Create infowindow							  
        							var infowindow = new google.maps.InfoWindow({
        								content: contentString,
        								maxWidth: 300
        							});
        							//$(document['#infowindow'+i]).parent.style = 'overflow-y:hidden';
        							// Add the infowindow as an attribute of this marker to make it accessible within marker events.
        							marker.infowindow = infowindow;
        							// Add the infowindow to an array so we can close all infowindows from the events below.
        							infowindows[i] = infowindow;
        							// Add infowindow to map
        							google.maps.event.addListener(marker, 'click', function() {
        								close_infowindows();
        								this.infowindow.open(map,this);
        							});
        							// Close all infowindows when user clicks on map
        							google.maps.event.addListener(map, 'click', function() {
        								close_infowindows();
        							});

        							//TODO: Add congregation info to the table below the map.
        							// Construct the table rows that we're going to append to the table

        							var msg="<tr>" +
        							"<td><a href='/cong/" + congs[i].id + "'>" + congs[i].name + "</a></td>"+
        							"<td>" + congs[i].meeting_city + ", " + congs[i].meeting_state + ", " + congs[i].meeting_country + "</td>" +
        							"<td>" +(congs[i].phone ? congs[i].phone + "<br />": "" ) + 
        							(congs[i].email ? "<a href='mailto:" + congs[i].email + "'>" + congs[i].email + "</a><br />": "" ) + 
        							(congs[i].website ? "<a href='http://" + congs[i].website + "'>" + congs[i].website + "</a>": "") + 
        							"</td>" + 
        							"</tr>"; 

        							// Append the new table rows to the table
        							$("#congregation_list tbody").append(msg);
        						}
        					}
        				}
        			});
        		} else {
        			alert("Geocode was not successful for the following reason: " + status);
        		}
        	});
        	}
    });
    var FindAChurchView = Backbone.View.extend({
        initialize : function(){
        },
        render: function(){
            // TODO: Refactor this so we don't repeat ourselves
            //  Create a generalized render(this, element_id) function
            var template = _.template( $("#find_a_church_template").html(), {} );
            $(this.el).html( template );
            // Render child views
            this.menu_view = new MenuView({ el: $("#mainmenu") });
            this.map_view = new MapView({ el: $("#map") });
            this.search_view = new SearchView({ el: $("#search_container") });
            this.congregations_view = new CongregationsView({ el: $("#congregations_container") });
        }
    })
    var ImportDirectoryView = Backbone.View.extend({
        initialize : function(){
        },
        render: function(){
            // TODO: Refactor this so we don't repeat ourselves
            //  Create a generalized render(this, element_id) function
            var template = _.template( $("#import_directory_template").html(), {} );
            $(this.el).html( template );
        },
        events: {
            'keyup #url':"get_church_dir_from_url",
            'click #directory_type input': 'show_directory_type'
        },
        get_church_dir_from_url:function(){
            // TODO: Rewrite this for Backbone
        	var elem = $('#url'),
            	// TODO: do we need config here anymore?
    //        	config = $$(this).app.require('config'),
            	CGroup = model.CGroup,
            	Directory = model.Directory,
            	Cong = model.Cong,
            	CGroup = model.CGroup
    	       
    	// Delay this to run after typing has stopped for 2 seconds, so we don't send too many requests
    	// TODO: Don't fire on every key event, but only once after delay.
    	//			The way to do this is not via setTimeout, but probably something like a while loop
    	//setTimeout(function(){
            	
    	// Declare several utility functions for use further below

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
    		//console.log(dir)
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
    	                    // TODO: Throw an error or handle the problem that this
                            // directory
    	                    // has multiple entries
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
    		
    	// If the associated directory exists in the db, get it
    	var url = $('#url').val()
    	directories = new model.DirectoriesByURL
    	directories.db.keys = [url]
    	// TODO: Start here
    	directories.fetch({success:function(col, res){
    	    var dir = col.at(0)
    	    console.log(dir)
    	}})
    	congs_by_name = new model.DirectoriesByURL
//      congs_by_name.db.keys = ['Caney OPC']
//      congs_by_name.fetch({success:function(col, res){
//          var caney_opc = col.at(0)
//      }})
    	var cgroup = ''
    	// Query database by cgroup.abbreviation
    	// TODO: Turn this into a view in model.cgroup
    	// TODO: Run this when the abbreviation changes, rather than when the URL changes
    	//console.log(db)
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
        },
        hide_dir_and_display_type:function(){
        	$('#dir_and_display_type').hide(1000)
        },
        hide_subform:function(){
        	$("#directory_type, #rss_feed, #cong_details, #state_page, #church_directory_page").hide(1000);
        },
        show_directory_type:function(){
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
        },
        show_state_page:function(){
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
    })
    
    // Create main application
    var App = Backbone.Router.extend({
      initialize : function(){
          // TODO: Set up routes here
          // This renders the default view for the app
          // TODO:  If the page loaded from a different view's URL, load that view instead
          //    Maybe we can handle that in the router below.
          this.find_a_church_view = new FindAChurchView({ el: $("#content") });
          //this.find_a_church_view.render()
          this.import_directory_view = new ImportDirectoryView({ el: $("#content") });
          this.import_directory_view.render()
          // TODO: Move tests into a View that displays in a suitable location on the page
          $("#account").couchLogin({});
      },
      // Set up URLs here
      // TODO: Set CouchDB routing for URLs it doesn't understand.  Is there a way to do this
      //    without duplicating what is written here?
      //    http://blog.couchbase.com/what%E2%80%99s-new-apache-couchdb-011-%E2%80%94-part-one-nice-urls-rewrite-rules-and-virtual-hosts
      //    Maybe in this.initialize we can dynamically get ddoc.rewrites, iterate through it, 
      //    and dynamically create this.routes in the correct data format, 
      //    which is {'url':'function_name',...}.
      routes: {
          "index.html":                 "index.html",
          "find_a_church":                 "find_a_church",
          "import_directory":              "import_directory"
      },
      find_a_church:function(){
          // TODO: This destroys the old view, and renders a new view, in the #content div.
          //    But if the view has already been rendered, and has some state, it might 
          //    be better to HIDE other views, and DISPLAY this one, rather than render it,
          //    because this would preserve the rendered view's state.
          //    Con:  Preserving the rendered view's state is not what most users expect.
          //    Pro:  It might be what most users want
          //    So, do we want to preserve this view's state?
          this.find_a_church_view.render()
      },
      import_directory:function(){
          this.import_directory_view.render()
      }
 });
    // Instantiate App
    app = new App
    // Create SEF URLs and handle clicks
    Backbone.history.start({pushState: true, root: "/rcl/_design/rcl/"})
    // Globally capture clicks. If they are internal and not in the pass 
    // through list, route them through Backbone's navigate method.
    // TODO: Create vhosts entry to allow pages to load from direct access to the URL, like
    //  to http://localhost:5984/rcl/_design/rcl/import_directory.  Currently that URL returns:
    //  {"error":"not_found","reason":"Document is missing attachment"}
    // TODO: When I create a vhosts entry for /rcl2 and rewrites.json, then go to 
    //  http://localhost:5984/rcl2/find_a_church, it returns:
    //  {"error":"not_found","reason":"Document is missing attachment"}
    $(document).on("click", "a[href^='/']", function(event){
        var href = $(event.currentTarget).attr('href')
        // chain 'or's for other black list routes
        var passThrough = href.indexOf('sign_out') >= 0 || href.indexOf('delete') >= 0
        // Allow shift+click for new tabs, etc.
        if (!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey){
            event.preventDefault()
            // Instruct Backbone to trigger routing events
            app.navigate(href, { trigger: false })
            return false
        }
    })
});