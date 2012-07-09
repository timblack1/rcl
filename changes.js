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
	changes_listeners_filename = './changes_listeners_temp.js',
	debug = true; // turn log() on or off

// Overwrite the log() function with a new one that only outputs if var debug=='true'
var log = function(msg){
	if (debug==true){
		console.log(msg);
	}
}

log('before declaring function')
function start_child_process(){
	// Write changes listeners to the temp file if it doesn't exist yet
	log('before getting changes_listeners.js')
	if (!path.existsSync(changes_listeners_filename)){
		log('after checking if file exists')
		db.get('_design/rcl', function(err, doc){
			log('before writing changes_listeners_temp.js')
			fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
		});
	}
	// Spawn changes listener process
	//var mode = 'spawn';
	var mode = 'fork';
	// TODO: This is throwing errors
	if (mode=='spawn'){
		log('before spawning child process the first time')
		p = child.spawn(process.execPath, [changes_listeners_filename]);
		log('after spawning child process the first time')
		// Log errors to stderr of this process (not the child process)
		p.stderr.on("data", function (chunk) {sys.error(chunk.toString());});
		log('after setting up child process stderr handler callback')
	}else if (mode=='fork'){
		log('before forking new child process');
		p = child.fork(changes_listeners_filename);
		log('before forking new child process');
	}
	return p;
}
p = start_child_process();
log('after function that starts child process the first time');
function log_message(){
	p.on('message', function(m){
		log('Parent got message:', m);
	});
}
log_message();

it = 0;

feed.on('change', function (change) {
	it++;
	log('1.' + it); // 1 refers to which log message this is
	//log(change)
	log('before requesting doc from db asynchronously')
	db.get(change.id, function(err, doc){
		log('2.' + it)
		log(doc, err)
		if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
			log('3.' + it)
			// This is a change to the design document
			// If the rcl design document changed, then reload the changes listeners.
			log('A design document changed');
			// Get the new design doc
			if (doc.changes) {
				// take down the process with the old design doc
				log('before killing child process')
				p.kill();
				log('before unlinking changes_listeners_temp.js')
				fs.unlinkSync(changes_listeners_filename);
				log('before writing new changes_listeners_temp.js')
				// start up the process with the new design doc
				// TODO: Does this cause the error?  Is it trying to execute two 
				//			writes to the same file at the same time? 
				fs.writeFileSync(changes_listeners_filename, doc.changes_listeners);
				log('before spawning another child process')
				p = start_child_process();
				log_message();
				log('after spawning another child process')
			}
		} else {
			// This is a change to a data document
			log('4.' + it)
			// Feed the new doc into the changes listeners
			log('A non-design document changed');
			if (doc) { // Don't handle docs that have been deleted
				log('before sending doc to child process')
				// TODO: Here we get this error: channel closed
				// TODO: Start here
				p.send(doc);
			}
			log('after sending the changed non-design doc to the child process');
			// TODO: The code stops working here, on the 8th (last? it's the 8th on Tim's 
			//	computer) change in the database
		}
	});
	log('after requesting doc from db asynchronously');
});