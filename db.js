var cradle = require('../node_modules/cradle'),
	port = require('./port').port,
	db = new(cradle.Connection)('http://localhost', port).database('rcl');

exports.db = db;