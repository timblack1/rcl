// Configure application-wide configuration settings here

// Determine whether we're running in the browser or in Node.js
if (typeof window !== 'undefined'){
	// We're running in the client/browser (under Evently) rather than on the server in Node.js
	var env = 'client'
}else{
	// We're running in Node.js
	var env = 'server'
}

// Export configuration settings
exports.require = require
exports.env = env
exports.debug = true; // true or false; turns log() on or off
if (env=='client'){
	// TODO: Get db
	exports.db = require('db').db
}else if (env=='server'){
	var get_db = require('./lib').get_db,
		fs = require('fs');
    // exports.port = '5984';
    exports.port = '80';
    // exports.domain = 'localhost';
    exports.domain = 'arwd.iriscouch.com';
	exports.auth = fs.readFileSync('./login.txt', 'ascii').trim();
	exports.db = get_db(exports.port);
}