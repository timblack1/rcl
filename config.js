// Configure application-wide configuration settings here

var fs = require('fs'),
	get_db = require('./lib').get_db;

// Export configuration settings
exports.debug = true; // true or false; turns log() on or off
exports.port = fs.readFileSync('./port.txt', 'ascii').trim();
exports.auth = fs.readFileSync('./auth.txt', 'ascii').trim();
exports.db = get_db(exports.port);