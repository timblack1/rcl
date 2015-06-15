'use strict'

// Use cradle to watch the database's changes and stream them in
// TODO: Could we use jquery.couch.js here instead of cradle, in order to use our 
//  CouchAppObject model here?

var ncl_dir = './',
  child_process = require('child_process.js'),
  p,
  util = require('util'),
  fs = require('fs'),
  config = require(ncl_dir + 'config'),
  db = config.db,
  changes_listeners_filename = '../changes_listeners_temp.js',
  log = require(ncl_dir + 'lib').log;
//$ = require('jquery');
if (config.debug)
  var longjohn = require(ncl_dir + 'node_modules/longjohn'); // for printing long stacktraces

function write_new_changes_listener_file(doc) {
  // Write changes listeners to the temp file if it doesn't exist yet
  if (fs.existsSync(changes_listeners_filename)) {
    var fs_copy = fs.readFileSync(changes_listeners_filename, {
      encoding: 'utf8',
      flag: 'rs'
    });
    // Only write the new file to the filesystem if it is not the same as what is in the database
    if (fs_copy != doc) {
      fs.writeFileSync(changes_listeners_filename, doc);
    }
  } else {
    fs.writeFileSync(changes_listeners_filename, doc);
  }
}

function start_child_process() {
  db.get('_design/rcl', function(err, doc) {
    write_new_changes_listener_file(doc.node_changes_listeners.changes_listeners);
    // Spawn changes listener process
    //var mode = 'spawn';
    var mode = 'fork';
    if (mode == 'spawn') {
      p = child_process.spawn(process.execPath, [changes_listeners_filename]);
      // Log errors to stderr of this process (not the child process)
      p.stderr.on("data", function(chunk) {
        util.error(chunk.toString());
      });
    } else if (mode == 'fork') {
      p = child_process.fork(changes_listeners_filename);
    }
    p.on('error', function(err) {
      // TODO: Consider replacing this with the domain example at http://nodejs.org/api/domain.html
      console.log(err);
      console.log(err.stack);
      console.log('Killing child process');
      p.kill();
      p = start_child_process();
    });
    return p;
  });
}

p = start_child_process();
console.log('Starting child process...');

// Only get changes after "update_seq"
db.get('', function(err, doc) {
  db.changes({
    since: doc.update_seq
  }).on('change', function(change) {
    // TODO: Check whether change.id contains '_design/' here (before db.get() below) so as
    //  not to have to download the whole doc into memory, then use a direct HTTP call to 
    //  get the new version of the changes_listeners.js file.
    db.get(change.id, change.changes[0].rev, function(err, doc) {
      if (change.id && change.id.slice(0, '_design/'.length) === '_design/') {
        // This is a change to the design document
        // If the rcl design document changed, then reload the changes listeners.
        // Get the new design doc
        console.log('Restarting because design doc changed...')
        if (doc.node_changes_listeners.changes) {
          // take down the process running the old changes_listeners.js file
          p.kill();
          fs.unlinkSync(changes_listeners_filename);
          // start up the process with the new design doc
          write_new_changes_listener_file(doc.node_changes_listeners.changes_listeners);
          p = start_child_process();
        }
      }
    });
  });
});