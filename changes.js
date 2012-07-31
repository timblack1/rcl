// Use cradle to watch the database's changes and stream them in
// TODO: Could we use jquery.couch.js here instead of cradle, in order to use our 
//	CouchObject model here?

var child_process = require('child_process'),
	util = require('util'),
	vm = require('vm'),
	fs = require('fs'),
	config = require('./config'),
	db = config.db,
	feed = db.changes(),
	changes_listeners_filename = '../changes_listeners_temp.js',
	log = require('./lib').log;
if (config.debug)
	var longjohn = require('longjohn') // for printing long stacktraces

function write_new_changes_listener_file(doc){
	// Write changes listeners to the temp file if it doesn't exist yet
	if (fs.existsSync(changes_listeners_filename)){
		var fs_copy = fs.readFileSync(changes_listeners_filename, 'utf8');
		// Only write the new file to the filesystem if it is not the same as what is in the database
		if (fs_copy != doc){
			fs.writeFileSync(changes_listeners_filename, doc);
		}
	}else{
		fs.writeFileSync(changes_listeners_filename, doc);
	}
}
function start_child_process(){
	db.get('_design/rcl', function(err, doc){
		write_new_changes_listener_file(doc.changes_listeners);
	});
	// Spawn changes listener process
	//var mode = 'spawn';
	var mode = 'fork';
	if (mode=='spawn'){
		p = child_process.spawn(process.execPath, [changes_listeners_filename]);
		// Log errors to stderr of this process (not the child process)
		p.stderr.on("data", function (chunk) {util.error(chunk.toString());});
	}else if (mode=='fork'){
		p = child_process.fork(changes_listeners_filename);
	}
	return p;
}
p = start_child_process();

var it = 0;

feed.on('change', function (change) {
	it++;
	db.get(change.id, function(err, doc){
		if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
			// This is a change to the design document
			// If the rcl design document changed, then reload the changes listeners.
			// Get the new design doc
			if (doc.changes) {
				// take down the process with the old design doc
				p.kill();
				fs.unlinkSync(changes_listeners_filename);
				// start up the process with the new design doc
				write_new_changes_listener_file(doc.changes_listeners);
				p = start_child_process();
			}
		} else {
			// This is a change to a data document
			// Feed the new doc into the changes listeners
			if (doc) { // Don't handle docs that have been deleted
				if (p.connected){
					p.send(doc);
				}
			}
		}
	});
});