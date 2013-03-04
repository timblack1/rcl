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
	cwd = process.cwd(),
	config = require(cwd + '/config'),
	db = config.db,
	log = require(cwd + '/lib').log;
	//$ = require('jquery');
//var model = require('model.js').model
	//stdin = process.openStdin();
if (config.debug)
	var longjohn = require(cwd + '/node_modules/longjohn')

//stdin.setEncoding('utf8');

// Declare utility functions
function get_url(doc, from_url, to_html, status_flag){
    http.get(doc[from_url], function(res){
        var pageData = ''
        res.on('data', function(chunk){
            pageData += chunk
        })
        res.on('end', function(){
            // TODO: Check to see if we got a 404 response
            // Write the contents of the html variable back to the database
            doc[to_html] = pageData
            doc[status_flag] = 'gotten'
            // TODO: Use Backbone here instead of cradle
            db.save(doc._id, doc._rev, doc, function(err, res){
                // TODO: Do anything more that needs to be done here
            });
        })
    });
}
currently_getting = []
function get_url_set(doc, options){
    // TODO: Will these globals interfere with each other if there are multiple downloads happening simultaneously?
    var output_array = []
    var output_array_saved = false
    // Don't run more than one copy of this task at a time
    if (currently_getting.indexOf(options.status_flag) == -1){
        // Add this options.status_flag to the list of tasks
        currently_getting.push(options.status_flag)
        var i = 0
        // Use a recursive function to allow throttling the rate of web-scraping requests
        //  per second to avoid getting banned by some servers.
        function recurse_urls(i, options){
            // Stop running if we have reached the end of the list of URLs,
            if (doc[options.from_urls][i] !== '' && typeof doc[options.from_urls][i] !== 'undefined' &&
                    // and don't run if we've already downloaded the HTML for this URL
                    typeof doc[i] == 'undefined'){
                // TODO: Make this handle doc[options.method] == 'post'
                http.get(doc[options.from_urls][i], function(res){
                    var pageData = ''
                    res.on('data', function(chunk){
                        pageData += chunk
                    })
                    res.on('end', function(){
                        // TODO: Check to see if we got a 404 response
                        // Append result to output_array
                        output_array[i] = pageData
                        if (doc[options.status_flag] !== 'getting'){
                            // TODO: It seems this is getting reset to "requested" by the next unit test, because the db
                            //  contains "requested" rather than "getting" soon after this runs
                            doc[options.status_flag] = 'getting'
                            // report to the db the fact we are getting the HTML
                            db.save(doc._id, doc._rev, doc)
                        }
                        // Record the number downloaded
                        db.get(doc._id, function(err, doc){
                            doc[options.number_downloaded] = i
                            db.save(doc._id, doc._rev, doc, function(err, response){
                                console.log('i: ' + i)
                                // If we've downloaded all the HTML, and haven't saved to the db yet
                                if (output_array.length == doc[options.from_urls].length && output_array_saved !== true){
                                    // TODO: Start here.  This recursion has a memory leak, maybe because the script
                                    //  keeps downloading even after output_array_saved == true
                                    var save_attempts = 0
                                    options.output_array_saved = output_array_saved
                                    function save_again(doc, options){
                                        db.get(doc._id, function(err, doc){
                                            if (!err && doc && doc._id && typeof doc._id !== 'undefined'){
                                                // Save to the db all the HTML we've gotten
                                                // TODO: This is running several times in series
                                                console.log('output_array.length: ' + output_array.length)
                                                doc[options.to_html] = output_array
                                                doc[options.status_flag] = 'gotten'
                                                // Deletes number downloaded since it's not needed anymore
                                                delete doc[options.number_downloaded]
                                                db.save(doc._id, doc._rev, doc, function(err, response){
                                                    if (typeof err !== 'undefined'){
                                                        console.error(err)
                                                        // Recurse to try saving again
                                                        // Only recurse 10 times, then fail, to avoid a memory leak
                                                        if (save_attempts < 0){
                                                            save_attempts++;
                                                            console.log('save_attempts: ' + save_attempts)
                                                            save_again(doc, options.output_array_saved)
                                                        }else{
                                                            console.error('Failed to save doc: ' + doc._id, doc._rev)
                                                        }
                                                    }else{
                                                        options.output_array_saved = true
                                                        // Remove this options.status_flag from the list of tasks
                                                        currently_getting.splice(currently_getting.indexOf(options.status_flag),1)
                                                        // Clean up some memory
                                                        output_array = []
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    if (options.output_array_saved !== true){
                                        save_again(doc, options)
                                    }
                                }
                            })
                        })
                        // Call this function recursively to enable throttling the rate of web-scraping requests
                        // Handle next URL
                        recurse_urls(i+1, options)
                    })
                })
            }else{
                currently_getting.splice(currently_getting.indexOf(options.status_flag),1)
            }
        }
        recurse_urls(i, options)
    }
}

// Handle all changes
process.on('message', function(doc){

    // Watch for requests to get the contents of a URL for a church directory
    // TODO: Check to see if the URL is valid
    if (doc.collection == 'directory' && doc.get_url_html=='requested' && doc.url){
        // E.g., when a user enters "opc.org/locator.html" into the church directory configuration page,
        //  then go get the contents of that URL.
        get_url(doc, 'url', 'url_html', 'get_url_html')
    }
    // Watch for requests to get the contents of a state page URL
    if (doc.collection == 'directory' && doc.get_state_url_html=='requested' && doc.state_url){
        // Interpolate state names into URLs
        var state_page_urls = []
        for (var i=0; i<doc.state_page_values.length; i++){
            if (doc.state_page_values[i] !== ''){
                state_page_urls.push(doc.state_url.replace('{state_name}', doc.state_page_values[i]))
            }
        }
        doc.state_page_urls = state_page_urls
        get_url_set(doc, {
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
});
