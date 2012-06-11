// Use cradle to watch the database's changes and stream them in

// Call this file like this:
// node http://localhost:41002/rcl/_design/changes

var cradle = require('../node_modules/cradle'),
	child = require('child_process'),
	path = require('path'),
	sys = require('util'),
	vm = require('vm'),
	fs = require('fs');

//TODO: Get port from command line args
var db = new(cradle.Connection)('http://localhost', 60816).database('rcl');
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
	var mode = 'spawn';
	//var mode = 'fork';
	// TODO: This is throwing errors
	if (mode=='spawn'){
		console.log('before spawning child process the first time')
		p = child.spawn(process.execPath, [changes_listeners_filename]);
		console.log('after spawning child process the first time')
		// Log errors to stderr
		p.stderr.on("data", function (chunk) {sys.error(chunk.toString());});
		console.log('after setting up child process stderr handler callback')
	}else if (mode=='fork'){
		p = child.fork(changes_listeners_filename);
	}
	return p;
}
p = start_child_process();
console.log('after function that starts child process the first time')
// TODO: Start here - Here is where the error is thrown

it = 0;

feed.on('change', function (change) {
	it++;
	console.log('1.' + it)
	db.get(change.id, function(err, doc){
		console.log('2.' + it)
		if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
			console.log('3.' + it)
			// If the rcl design document changed, then reload the changes listeners.
			console.log('A design document changed');
			// Get the new design doc
			if (doc.changes) {
				// take down the process with the old design doc
				p.kill();
				fs.unlinkSync(changes_listeners_filename);
				// start up the process with the new design doc
				// TODO: Does this cause the error?  Is it trying to execute two 
				//			writes to the same file at the same time? 
				fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
				console.log('before spawning child process another')
				p = start_child_process();
				console.log('after spawning child process another')
			}
		} else {
			console.log('4.' + it)
			// Feed the new doc into the changes listeners
			console.log('A non-design document changed');
			// TODO: This throws the following error:
			// Error: This socket is closed.
			p.stdin.write(JSON.stringify(["ddoc", doc])+'\n');
		}
	});
});