// This code (and its parent process in changes.js) is a Node.JS listener
//	listening to CouchDB's _changes feed, and is derived from
//	https://github.com/mikeal/node.couch.js and
//	http://dominicbarnes.us/node-couchdb-api/api/database/changes.html
// It monitors when requests are submitted to:
//	(when configuring a directory's settings) get a url in general
//	(when a directory is already configured) download all cong data for a directory
// TODO: Could we use backbone-couch.js here instead of cradle, in order to use our
//	Backbone model here?

var buffer = '',
	http = require('http'),
    https = require('https'),
	ncl_dir = '/_attachments/node_changes_listeners/',
	config = require('./config'),
	db = config.db,
	log = require('./lib').log;
	//$ = require('jquery');
//var model = require('model.js').model
	//stdin = process.openStdin();
// if (config.debug)
// 	var longjohn = require('./node_modules/longjohn')

//stdin.setEncoding('utf8');

console.log('Starting changes listener...')

// -------- Declare utility functions --------

function get_url(doc, from_url, to_html, status_flag, options){
    var http_lib = http
    if (doc[from_url].indexOf('https') === 0){
        // Switch to using https if necessary
        var http_lib = https
    }
    http_lib.get(doc[from_url], function(res){
        var pageData = ''
        res.on('data', function(chunk){
            pageData += chunk
        })
        res.on('end', function(){
            // Check to see if we got a 404 response
			if (res.statusCode == '404'){
				console.log('Got a 404!')
				// TODO: If we got a 404, then notify the user this page doesn't exist
				doc[status_flag] = '404'
				db.save(doc._id, doc._rev, doc)
			}else{
				// Write the contents of the html variable back to the database
				doc[to_html] = pageData
				doc[status_flag] = 'gotten'
				// console.log(new Date().getTime() + '\t n: ' + status_flag + ': ' + doc[status_flag] + ' ' + doc[from_url])
				// TODO: Use Backbone here instead of cradle
				db.save(doc._id, doc._rev, doc, function(err, res){
					// TODO: Do anything more that needs to be done here
                    if (to_html == 'url_html'){
                        console.log('Getting url_html...handling response end')
                        console.log(doc)
                    }
					if (options && options.success){
						options.success()
					}
				});
			}
        })
    });
}
function save(options){
    db.get(options.doc._id, function(err, doc){
        options.doc = doc
        if (!err && options.doc && options.doc._id && typeof options.doc._id !== 'undefined'){
            // Save to the db all the HTML we've gotten
            // TODO: This is running several times in series
            options.doc[options.to_html] = options.output_array
            options.doc[options.status_flag] = 'gotten';
            // Deletes number downloaded since it's not needed anymore
            delete options.doc[options.number_downloaded]
            db.save(options.doc._id, options.doc._rev, options.doc, function(err, response){
                if (err !== null){
                    console.error(err)
                    // Recurse to try saving again
                    // Only recurse a certain number of times, then fail, to avoid a memory leak
                    if (options.save_attempts <= 5){
                        options.save_attempts++;
                        // console.log('options.save_attempts: ' + options.save_attempts)
                        save(options)
                    }else{
                        // TODO: This is where we get an error.  For some reason sometimes,
                        //  but not always, we have the wrong revision here, and this causes get_state_url_html
                        //  to never == 'gotten', (so the state details page doesn't display?)
                        // console.error('Failed to save doc: ' + options.doc._id, options.doc._rev)
                    }
                }else{
                    // console.log('Succeeded at saving all the states\' HTML pages')
                    options.output_array_saved = true
                    // Remove this options.status_flag from the list of tasks
                    currently_getting.splice(currently_getting.indexOf(options.status_flag),1)
                    // Clean up some memory
                    options.output_array = []
                }
            })
        }
    })
}
function recurse_then_save(i, options){
    // If we've downloaded all the HTML, and haven't saved to the db yet
    if (options.output_array.length == options.doc[options.from_urls].length && options.output_array_saved !== true){
        options.save_attempts = 0
        if (options.output_array_saved !== true){
            save(options)
            // console.log ("after saving all the states")
        }
    }
    // Call the parent function recursively to enable throttling the rate of web-scraping requests
    // Handle next URL
    recurse_urls(i+1, options)
}
function recurse_urls(i, options){
    if (typeof options.doc[options.from_urls] == 'undefined'){
        // console.log(options.doc[options.from_urls])
    }
    // Stop running if we have reached the end of the list of URLs,
    if (options.doc[options.from_urls][i] !== '' && typeof options.doc[options.from_urls][i] !== 'undefined' &&
            // and don't run if we've already downloaded the HTML for this URL
            typeof options.doc[i] == 'undefined'){
        // TODO: Make this handle options.doc[options.method] == 'post'
        http.get(options.doc[options.from_urls][i], function(res){
            var pageData = ''
            res.on('data', function(chunk){
                pageData += chunk
            })
            res.on('end', function(){
                // TODO: Check to see if we got a 404 response
                // Append result to options.output_array
                options.output_array[i] = pageData
                if (options.doc[options.status_flag] !== 'getting'){
                    options.doc[options.status_flag] = 'getting'
                    // Set flag to indicate that we just reset the status_flag
                    options.flag_set = true
                    // report to the db the fact we are getting the HTML
                    // console.log ("before saving all the states")
                    db.save(options.doc._id, options.doc._rev, options.doc, function(err, response){
                        recurse_then_save(i, options)
                    })
                }
                // Record the number downloaded
                // Don't run until the status_flag has been set
                if (typeof options.flag_set !== 'undefined' && options.flag_set === true){
                    recurse_then_save(i, options)
                }
            })
        })
    }else{
        currently_getting.splice(currently_getting.indexOf(options.status_flag),1)
    }
}
currently_getting = []
function get_url_set(options){
    // Don't run more than one copy of this task at a time
    if (currently_getting.indexOf(options.status_flag) == -1){
        // Add this options.status_flag to the list of tasks
        currently_getting.push(options.status_flag)
        var i = 0
        options.output_array = []
        options.output_array_saved = false
        // Use a recursive function to allow throttling the rate of web-scraping requests
        //  per second to avoid getting banned by some servers.
        recurse_urls(i, options)
    }
}

// -------- Main routine that handles all db changes --------

// Only get changes after "update_seq"
db.get('', function(err,doc){
	// TODO: This throws:  TypeError: Cannot read property 'update_seq' of undefined
    db.changes({since:doc.update_seq}).on('change', function (change) {
        db.get(change.id, change.changes[0].rev, function(err, doc){
            if (change.id && change.id.slice(0, '_design/'.length) !== '_design/') {
                // This is a change to a data document
                // Feed the new doc into the changes listeners
                if (doc) { // Don't handle docs that have been deleted
                    // Watch for requests to get the contents of a URL for a church directory
					// TODO: Check to see if the URL is valid
					if (doc.collection == 'directory' && doc.get_url_html=='requested' && doc.url){
						// E.g., when a user enters "opc.org/locator.html" into the church directory configuration page,
						//  then go get the contents of that URL.
                        get_url(doc, 'url', 'url_html', 'get_url_html')
					}
					if (doc.collection == 'directory' && doc.get_cong_url_html=='requested' && doc.cong_url){
						get_url(doc, 'cong_url_raw', 'cong_url_html', 'get_cong_url_html', {success:function(){
							// Iterate state pages' HTML
							for (var i=0; i<doc.state_url_html.length; i++){
								// TODO: Get each cong's URL
								var state_html = doc.state_url_html[i]
								
								// TODO: Get each cong page's HTML & write to database
							}
						}})
					}
					// Watch for requests to get the contents of a state page URL
					if (doc.collection == 'directory' && doc.get_state_url_html=='requested' && doc.state_url){
						// Interpolate state names into URLs
						var state_page_urls = []
						// console.log('before interpolating state names into URLs')
						for (var i=0; i<doc.state_page_values.length; i++){
							if (doc.state_page_values[i] !== ''){
								state_page_urls.push(doc.state_url.replace('{state_name}', doc.state_page_values[i]))
							}
						}
						// console.log('about to get_url_set')
						doc.state_page_urls = state_page_urls
						get_url_set({
							doc:               doc,
							from_urls:          'state_page_urls',
							method:             'state_url_method',
							to_html:            'state_url_html',
							status_flag:        'get_state_url_html',
							number_downloaded:  'state_urls_gotten',
							success:function(){
							// TODO: Cleanup unnecessary doc attributes here?  Probably that should be done in
							//  ImportDirectoryView.js instead.
						}})
					}
					// Watch for requests to get the contents of a batchgeo map URL
					if (doc.collection == 'directory' && doc.get_batchgeo_map_html=='requested' && doc.batchgeo_map_url){
						get_url(doc, 'batchgeo_map_url', 'batchgeo_map_html', 'get_batchgeo_map_html')
					}
					// Watch for requests to get the contents of a JSON feed
					if (doc.collection == 'directory' && doc.get_json=='requested' && doc.json_url){
						get_url(doc, 'json_url', 'json', 'get_json')
					}

                }
            }
        });
    });
})
