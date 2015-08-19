// Use cradle to watch the database's changes and stream them in
// TODO: Could we use jquery.couch.js here instead of cradle, in order to use our 
//	CouchAppObject model here?

var ncl_dir = './_attachments/node_changes_listeners/',
	child_process = require('child_process.js'),
	util = require('util'),
	vm = require('vm'),
	fs = require('fs'),
	config = require(ncl_dir + 'config'),
	db = config.db,
	changes_listeners_filename = '../changes_listeners_temp.js',
	log = require(ncl_dir + 'lib').log;
	//$ = require('jquery');
if (config.debug)
	var longjohn = require(ncl_dir + 'node_modules/longjohn') // for printing long stacktraces

function write_new_changes_listener_file(doc){
	// Write changes listeners to the temp file if it doesn't exist yet
	if (fs.existsSync(changes_listeners_filename)){
		var fs_copy = fs.readFileSync(changes_listeners_filename, {encoding: 'utf8', flag:'rs'});
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
    p.on('error',function(err){
        // TODO: Replace this with the domain example at http://nodejs.org/api/domain.html
        console.log(err)
        console.log(err.stack)
        console.log('Killing child process')
        p.kill()
        // TODO: Could this cause a memory leak?
        delete p;
        p = start_child_process()
        console.log('Killing child process')
    })
	return p;
}
// TODO: When the child process is started the first time, the CPU goes to 100%.  When I save a file
//  and the changes listener below restarts the child process, then the CPU goes back to normal usage.
p = start_child_process();
console.log('Starting child process...')

// Only get changes after "update_seq"
db.get('', function(err,doc){
	console.log('doc: ' + doc)
    db.changes({since:doc.update_seq}).on('change', function (change) {
        db.get(change.id, change.changes[0].rev, function(err, doc){
            if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
                // This is a change to the design document
                // If the rcl design document changed, then reload the changes listeners.
                // Get the new design doc
				//console.log('Restarting because design doc changed...')
				//return;
				// TODO: Start here.  This throws:
				/*
				/home/tim/Documents/MyWebPages/CaneyPUGgies/code/rcl/_attachments/node_changes_listeners/node_modules/longjohn/index.js:111
					  throw e;
							^
				RangeError: Maximum call stack size exceeded
				*/
				// This may be due to my changing the filesystem location of changes.js, which is 
				//	referenced immediately below.
				console.log(doc.node_changes_listeners.changes)
                if (doc.node_changes_listeners.changes) {
					return;
					//console.log('Restarting because design doc changed...')
                    // take down the process with the old design doc
                    p.kill();
                    fs.unlinkSync(changes_listeners_filename);
                    // start up the process with the new design doc
                    write_new_changes_listener_file(doc.node_changes_listeners.changes_listeners);
                    p = start_child_process();
                }
            }
        });
    });
})
