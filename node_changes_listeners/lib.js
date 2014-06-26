var cradle = require('cradle'),
    fs = require('fs'),
    config = require('./config');
    
var get_db = function(port) {
	var auth = config.auth;
	username = auth.split(':')[0],
	password = auth.split(':')[1];

	// Here is the main line that this whole function is for
	db = new(cradle.Connection)('http://'+ config.domain + ':' + port, {
		auth: { username: username, password: password }
	}).database(config.db_name);
	return db;
};

//Create log() function that only outputs if var debug==true
function log(msg){
	if (config.debug==true){
		console.log(msg);
	}
}

exports.get_db = get_db;
exports.log = log;
