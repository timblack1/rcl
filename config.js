// Configure application-wide configuration settings here

// Use Node's require() function if we are running this in Node
if (require=='undefined'){
	// We're running in the client/browser (under Evently) rather than on the server in Node
	var env = 'client',
		require = $$(this).app.require
}else{
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
	exports.port = fs.readFileSync('./port.txt', 'ascii').trim();
	exports.auth = fs.readFileSync('./auth.txt', 'ascii').trim();
	exports.db = get_db(exports.port);
}
