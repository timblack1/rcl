var cradle = require('cradle'),
    fs = require('fs');
    
var get_db = function(port) {
	var auth = fs.readFileSync('./auth.txt', 'ascii').trim(),
	username = auth.split(':')[0],
	password = auth.split(':')[1];

	// Here is the main line that this whole function is for
	db = new(cradle.Connection)('http://localhost:' + port, {
		auth: { username: username, password: password }
	}).database('rcl');
	return db;
};

//Create log() function that only outputs if var debug==true
function log(msg){
	if (require('./config').debug==true){
		console.log(msg);
	}
}

exports.get_db = get_db;
exports.log = log;