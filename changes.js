// Use cradle to watch the database's changes and stream them in

// Call this file like this:
// node http://localhost:41002/rcl/_design/changes

// TODO:  When called from the commandline, this throws:
// Error: Cannot find module 'cradle'
var cradle = require('../node_modules/cradle'),
	child = require('child_process'),
	path = require('path'),
	sys = require('util'),
	vm = require('vm'),
	fs = require('fs');

//TODO: Get port from command line args
var db = new(cradle.Connection)('http://localhost', 60434).database('rcl');
var feed = db.changes();
var changes_listeners_filename = './changes_listeners_temp.js';

function start_child_process(){
	// Write to the temp file if it doesn't exist yet
	if (!path.existsSync(changes_listeners_filename)){
		db.get('_design/rcl', function(err, doc){
			fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
		});
	}
	// Spawn changes listener process
	// TODO: This is throwing errors
	//p = child.spawn(process.execPath, [changes_listeners_filename]);
	p = child.fork(changes_listeners_filename);
	// Log errors to stderr
	p.stderr.on("data", function (chunk) {sys.error(chunk.toString());});
	return p;
}
p = start_child_process();

feed.on('change', function (change) {
	db.get(change.id, function(err, doc){
		if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
			// If the rcl design document changed, then reload the changes listeners.
			console.log('A design document changed');
			// Get the new design doc
			if (doc.changes) {
				// take down the process with the old design doc
				p.kill();
				fs.unlinkSync(changes_listeners_filename);
				// start up the process with the new design doc
				fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
				p = start_child_process();
			}
		} else {
			// Feed the new doc into the changes listeners
			console.log('A non-design document changed');
			p.stdin.write(JSON.stringify(["ddoc", doc])+'\n');
		}
	});
});