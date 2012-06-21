// Use cradle to watch the database's changes and stream them in

// Call this file like this:
// node http://localhost:41002/rcl/_design/changes

var child = require('child_process'),
	path = require('path'),
	sys = require('util'),
	vm = require('vm'),
	fs = require('fs'),
	db = require('./db.js').db,
	feed = db.changes(),
	changes_listeners_filename = './changes_listeners_temp.js';

console.log('before declaring function')
function start_child_process(){
	// Write changes listeners to the temp file if it doesn't exist yet
	console.log('before getting changes_listeners.js')
	if (!path.existsSync(changes_listeners_filename)){
		console.log('after checking if file exists')
		db.get('_design/rcl', function(err, doc){
			console.log('before writing changes_listeners_temp.js')
			fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
		});
	}
	// Spawn changes listener process
	//var mode = 'spawn';
	var mode = 'fork';
	// TODO: This is throwing errors
	if (mode=='spawn'){
		console.log('before spawning child process the first time')
		p = child.spawn(process.execPath, [changes_listeners_filename]);
		console.log('after spawning child process the first time')
		// Log errors to stderr of this process (not the child process)
		p.stderr.on("data", function (chunk) {sys.error(chunk.toString());});
		console.log('after setting up child process stderr handler callback')
	}else if (mode=='fork'){
		console.log('before forking new child process');
		p = child.fork(changes_listeners_filename);
		console.log('before forking new child process');
	}
	return p;
}
p = start_child_process();
console.log('after function that starts child process the first time');
function log_message(){
	p.on('message', function(m){
		console.log('Parent got message:', m);
	});
}
log_message();

it = 0;

feed.on('change', function (change) {
	it++;
	console.log('1.' + it); // 1 refers to which log message this is
	//console.log(change)
	console.log('before requesting doc from db asynchronously')
	db.get(change.id, function(err, doc){
		console.log('2.' + it)
		console.log(doc, err)
		if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
			console.log('3.' + it)
			// This is a change to the design document
			// If the rcl design document changed, then reload the changes listeners.
			console.log('A design document changed');
			// Get the new design doc
			if (doc.changes) {
				// take down the process with the old design doc
				console.log('before killing child process')
				p.kill();
				console.log('before unlinking changes_listeners_temp.js')
				fs.unlinkSync(changes_listeners_filename);
				console.log('before writing new changes_listeners_temp.js')
				// start up the process with the new design doc
				// TODO: Does this cause the error?  Is it trying to execute two 
				//			writes to the same file at the same time? 
				fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
				console.log('before spawning another child process')
				p = start_child_process();
				log_message();
				console.log('after spawning another child process')
			}
		} else {
			// This is a change to a data document
			console.log('4.' + it)
			// Feed the new doc into the changes listeners
			console.log('A non-design document changed');
			if (doc) { // Don't handle docs that have been deleted
				console.log('before sending doc to child process')
				// TODO: Here we get this error: channel closed
				// TODO: Start here
				p.send(doc);
			}
			console.log('after sending the changed non-design doc to the child process');
		}
	});
	console.log('after requesting doc from db asynchronously');
});