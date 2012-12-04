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
function get_url_set(doc, from_urls, to_html, status_flag){
    for (var i=0; i<doc[from_urls].length; i++){
        doc[status_flag] = 'getting'
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
                // TODO: Start here
                if (num_items==doc[from_urls].length){
                    // We've gotten all the items' html!
                    doc[status_flag] = 'gotten'
                }
                // TODO: Use Backbone here instead of cradle
                db.save(doc._id, doc._rev, doc, function(err, res){
                    // TODO: Do anything more that needs to be done here
                });
            })
        });
    }
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
            get_url(doc, 'state_page_values', 'state_url_html', 'get_state_url_html')
    }
});
