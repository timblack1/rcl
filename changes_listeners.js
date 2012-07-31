// This code (and its parent process in changes.js) is a Node.JS listener 
//	listening to CouchDB's _changes feed, and is derived from
//	https://github.com/mikeal/node.couch.js and 
//	http://dominicbarnes.us/node-couchdb-api/api/database/changes.html
// It monitors when requests are submitted to:
//	(when configuring a directory's settings) get a url in general
//	(when a directory is already configured) download all cong data for a directory

var buffer = '',
	http = require('http'),
	config = require('./rcl/config'),
	db = config.db,
	log = require('./rcl/lib').log;
	//stdin = process.openStdin();
if (config.debug)
	var longjohn = require('./rcl/node_modules/longjohn')

//stdin.setEncoding('utf8');

process.on('message', function(doc){
	// Handle all changes

	// Watch for requests to get the contents of a URL for a church directory
	if (doc.type == 'directory' && doc.get_url_contents==true && doc.url){
		// Like when a user enters "opc.org/locator.html" into the church directory configuration page,
		// 	then go get the contents of that URL.
		http.get(doc.url, function(res){
			var pageData = ''
			res.on('data', function(chunk){
				pageData += chunk
			})
			res.on('end', function(){
				// Write the contents of the html variable back to the database
				console.log(pageData)
				// TODO: Start here.  Debug Node error:  TypeError: Object.keys called on non-object
				// TODO: It seems this code isn't writing the doc fields to their correct locations;
				//	instead, it writes them all to a new field named 'doc'
				// TODO: Also, it doesn't write the pageData variable's HTML contents to the url_html field. 
				db.merge(doc._id, doc._rev, {
					url_html:pageData,
					get_url_contents:false
				});
			})
		});
	}
});
