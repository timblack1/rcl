// This code (and its parent process in changes.js) is a Node.JS listener 
//	listening to CouchDB's _changes feed, and is derived from
//	https://github.com/mikeal/node.couch.js and 
//	http://dominicbarnes.us/node-couchdb-api/api/database/changes.html
// It monitors when requests are submitted to:
//	(when configuring a directory's settings) get a url in general
//	(when a directory is already configured) download all cong data for a directory
// TODO: Could we use jquery.couch.js here instead of cradle, in order to use our 
//	CouchAppObject model here?

var buffer = '',
	http = require('http'),
	config = require('./rcl/config'),
	db = config.db,
	log = require('./rcl/lib').log;
	//$ = require('jquery');
//var model = require('model.js').model
	//stdin = process.openStdin();
if (config.debug)
	var longjohn = require('./rcl/node_modules/longjohn')

//stdin.setEncoding('utf8');

process.on('message', function(doc){
	// Handle all changes

	// Watch for requests to get the contents of a URL for a church directory
	// TODO: Check to see if the URL is valid
	if (doc.collection == 'directory' && doc.get_url_contents==true && doc.url){
		// E.g., when a user enters "opc.org/locator.html" into the church directory configuration page,
		// 	then go get the contents of that URL.
		http.get(doc.url, function(res){
			var pageData = ''
			res.on('data', function(chunk){
				pageData += chunk
			})
			res.on('end', function(){
				// TODO: Check to see if we got a 404 response
				// Write the contents of the html variable back to the database
				doc.url_html = pageData
				doc.get_url_contents = false
		        // TODO: Use Backbone here instead of cradle
				db.save(doc._id, doc._rev, doc, function(err, res){
					// TODO: Do anything more that needs to be done here
				});
			})
		});
	}
});
