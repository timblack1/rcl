// Use cradle to watch the database's changes and stream them in

// Call this file like this:
// node http://localhost:41002/rcl/_design/changes

var longjohn = require('longjohn'),
	child_process = require('child_process'),
	util = require('util'),
	vm = require('vm'),
	fs = require('fs'),
	db = require('./db.js').db,
	feed = db.changes(),
	changes_listeners_filename = './changes_listeners_temp.js',
	log = require('./lib').log;

// TODO: Debug fs.writeFileSync / changes_listener loop
//ap:23: push (db change)->
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
// loop here

//cl:23: db change->
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
// loop here

//ap:60: push (when fs changes -> db change)
//c:11: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
// loop here

//c:38: write changes_listeners_temp.js
//ap:60: push (when fs changes -> db change)
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
//loop here

//c:90: unlink changes_listeners_temp.js
//ap:60: push (when fs changes -> db change)
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
//loop here

//c:92: write changes_listeners_temp.js
//ap:60: push (when fs changes -> db change)
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//ap:60: push (when fs changes -> db change)
//loop here

//ncl:11: changes listener->
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
//cl:23: db change->
//cl:2: db->port:11 stdout.txt, sync.txt; port:21,22 unlink stdout.txt, sync.txt
// loop here

function write_new_changes_listener_file(doc){
	var fs_copy = fs.readFileSync(changes_listeners_filename, 'utf8');
	// Only write the new file to the filesystem if it is not the same as what is in the database
	if (fs_copy != doc){
		log('before writing changes_listeners_temp.js')
		fs.writeFileSync(changes_listeners_filename, doc);
	}
}
log('before declaring function')
function start_child_process(){
	// Write changes listeners to the temp file if it doesn't exist yet
	log('before getting changes_listeners.js')
	if (!fs.existsSync(changes_listeners_filename)){
		log('after checking if file exists')
		db.get('_design/rcl', function(err, doc){
			write_new_changes_listener_file(doc.changes_listeners);
		});
	}
	// Spawn changes listener process
	//var mode = 'spawn';
	var mode = 'fork';
	if (mode=='spawn'){
		// TODO: This is throwing errors
		log('before spawning child process the first time')
		p = child_process.spawn(process.execPath, [changes_listeners_filename]);
		log('after spawning child process the first time')
		// Log errors to stderr of this process (not the child process)
		p.stderr.on("data", function (chunk) {util.error(chunk.toString());});
		log('after setting up child process stderr handler callback')
	}else if (mode=='fork'){
		log('before forking new child process');
		p = child_process.fork(changes_listeners_filename);
		log('after forking new child process');
	}
	return p;
}
p = start_child_process();
log('after function that starts child process the first time');
//log(p)
p.send({test:'test'})
function log_message(p){
	p.on('message', function(msg){
		log('Parent got message:', msg);
	});
}
log_message(p);
log('After setting up log_message')

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
				write_new_changes_listener_file(doc.changes_listeners);
				log('before spawning another child process')
				p = start_child_process();
				log_message(p);
				// TODO: This code doesn't even run to let me know whether the process's channel is connected
				log(p.connected)
				log('after spawning another child process')
			}
		} else {
			// This is a change to a data document
			log('4.' + it)
			// Feed the new doc into the changes listeners
			log('A data (non-design) document changed');
			if (doc) { // Don't handle docs that have been deleted
				log('before sending doc to child process')
				// TODO: Here we get this error: channel closed
				// TODO: Start here
				// TODO: Why does the child process stop listening to the communication channel?
				// Maybe some part of our code sent a (an implicit?) end() command to the child process.
				// TODO: Try creating new clean couchapp directory, copy our code into it to see if that fixes the error
				log(doc);
				// TODO: If I comment this out, the changes listener keeps looping
				log(p)
				if (p.connected){
					p.send(doc);
				}else{
					log('not connected')
					p.send(doc)
				}
			}
			log('after sending the changed non-design doc to the child process');
			// TODO: The code stops working here, on the 8th (last? it's the 8th on Tim's 
			//	computer) change in the database
		}
	});
	log('after requesting doc from db asynchronously');
});