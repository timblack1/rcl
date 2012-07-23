// Use cradle to watch the database's changes and stream them in

var longjohn = require('longjohn'), // for printing long stacktraces
	child_process = require('child_process'),
	util = require('util'),
	vm = require('vm'),
	fs = require('fs'),
	config = require('./config'),
	db = config.db,
	feed = db.changes(),
	changes_listeners_filename = '../changes_listeners_temp.js',
	log = require('./lib').log;

// TODO: Debug fs.writeFileSync / changes_listener loop

function write_new_changes_listener_file(doc){
	log('Before trying to read changes_listener_filename from filesystem');
	// Write changes listeners to the temp file if it doesn't exist yet
	if (fs.existsSync(changes_listeners_filename)){
		log('changes_listener_filename exists on filesystem')
		var fs_copy = fs.readFileSync(changes_listeners_filename, 'utf8');
		// Only write the new file to the filesystem if it is not the same as what is in the database
		if (fs_copy != doc){
			log('before writing changes_listeners_temp.js')
			fs.writeFileSync(changes_listeners_filename, doc);
			log('After writing changes_listeners_temp.js')
		}
	}else{
		log("changes_listener_filename didn't exist on the filesystem, so I will write it to the filesystem")
		fs.writeFileSync(changes_listeners_filename, doc);
	}
}
log('before declaring function')
function start_child_process(){
	db.get('_design/rcl', function(err, doc){
		log('After getting design document')
		write_new_changes_listener_file(doc.changes_listeners);
	});
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
		//log(doc, err)
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
				log('before write_new_changes_listener_file() in change event handler')
				// start up the process with the new design doc
				// TODO: Does this cause the error?  Is it trying to execute two 
				//			writes to the same file at the same time? 
				write_new_changes_listener_file(doc.changes_listeners);
				log('before spawning another child process')
				p = start_child_process();
				log_message(p);
				// TODO: This code doesn't even run to let me know whether the process's channel is connected
				//log(p.connected)
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
				//log(doc);
				// TODO: If I comment this out, the changes listener keeps looping
				//log(p)
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