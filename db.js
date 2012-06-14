// Get the CouchDB port synchronously, and only then create a Cradle db connection
var cradle = require('../node_modules/cradle');

var get_db_sync = function() {

	var port = '';
	port = require('./port').port;

	while (true) {
        //consider a timeout option to prevent infinite loop
        //NOTE: this will max out your cpu too!
        try {
            if (port != ''){
            	// Here is the main line that this whole file is for
            	db = new(cradle.Connection)('http://localhost', 57122).database('rcl');
            	return db;
            }else{
            	throw e; // the port number has not yet been discovered
            }

        } catch(e) { } // get_port_sync will fail until the port number has been discovered
    }

};

exports.db = get_db_sync();