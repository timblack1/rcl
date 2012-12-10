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
function get_url_set(doc, from_urls, method, to_html, status_flag, options){
    var i = 0
    // Use a recursive function to allow throttling the rate of web-scraping requests
    //  per second to avoid getting banned by some servers.
    function recurse_urls(i){
        doc[status_flag] = 'getting'
        if (doc[from_urls][i] != '' && typeof doc[from_urls][i] != 'undefined'){
            // TODO: Make this handle doc[method] == 'post'
            http.get(doc[from_urls][i], function(res){
                var pageData = ''
                res.on('data', function(chunk){
                    pageData += chunk
                })
                res.on('end', function(){
                    // TODO: Check to see if we got a 404 response
                    // Write the contents of the html variable back to the database
                    if (!doc[to_html] || doc[to_html] == ''){
                        doc[to_html] = new Array() // declare as array
                    }
                    var temp_items = doc[to_html]
                    var num_items = temp_items.push(pageData)
                    doc[to_html] = temp_items
                    if (num_items==doc[from_urls].length){
                        // We've gotten all the items' html!
                        doc[status_flag] = 'gotten'
                    }
                    // TODO: Use Backbone here instead of cradle
                    db.save(doc._id, doc._rev, doc, function(err, res){
                        // Do anything more that needs to be done here
                        doc._rev = res.rev
                        if (typeof options.success != 'undefined'){
                            options.success()
                            // Call this function recursively
                            recurse_urls(i+1)
                        }
                    });
                })
            });
        }
    }
    recurse_urls(i)
}

// Handle all changes
process.on('message', function(doc){

	// Watch for requests to get the contents of a URL for a church directory
	// TODO: Check to see if the URL is valid
	if (doc.collection == 'directory' && doc.get_url_html=='requested' && doc.url){
		// E.g., when a user enters "opc.org/locator.html" into the church directory configuration page,
		// 	then go get the contents of that URL.
        get_url(doc, 'url', 'url_html', 'get_url_html')
	}
	// Watch for requests to get the contents of a state page URL
    if (doc.collection == 'directory' && doc.get_state_url_html=='requested' && doc.state_url){
        // Interpolate state names into URLs
        var state_page_urls = new Array()
        for (var i=0; i<doc.state_page_values.length; i++){
            if (doc.state_page_values[i] != ''){
                state_page_urls.push(doc.state_url.replace('{state_name}', doc.state_page_values[i]))
            }
        }
        doc.state_page_urls = state_page_urls
        get_url_set(doc, 'state_page_urls', 'state_url_method', 'state_url_html', 'get_state_url_html', {success:function(){
            // TODO: Cleanup unnecessary doc attributes here?  Probably that should be done in
            //  ImportDirectoryView.js instead.
        }})
    }
});
