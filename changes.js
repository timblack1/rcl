// Use cradle to watch the database's changes and stream them in

// Call this file like this:
// node http://localhost:41002/rcl/_design/changes

var cradle = require('cradle'),
	child = require('child_process'),
	path = require('path'),
	sys = require('sys'),
	vm = require('vm'),
	fs = require('fs');

//TODO: Get port from command line args
var db = new(cradle.Connection)('http://localhost', 60434).database('rcl');
var feed = db.changes();

feed.on('change', function (change) {
	// TODO: Remove this log call
	console.log(change);
	db.get(change.id, function(err, doc){
		if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
			// If the rcl design document changed, then reload the changes listeners.
			console.log('A design document changed');
			// Get the new design doc
			if (doc.changes && listeners[doc._id]) {
				// take down the process with the old design doc
				p.kill();
				// TODO: Consider renaming this file and its db equivalent to be more easily understood
				var changes_listeners_filename = './changes_listeners_temp.js';
				fs.unlinkSync(changes_listeners_filename);
				// start up the process with the new design doc
				fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
				p = child.spawn(process.execPath, [changes_listeners_filename]);
				// Log errors to stderr
				p.stderr.on("data", function (chunk) {sys.error(chunk.toString());});
			}
		} else {
			// Feed the new doc into the changes listeners
			console.log('A non-design document changed');
			p.stdin.write(JSON.stringify(["ddoc", doc])+'\n');
		}
	})
	// TODO: Handle all other changes
	//console.log(change);
	// TODO: Watch for requests to get the contents of a URL
});