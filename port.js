// Returns couchdb's port

var log = require('./lib').log,
	fs = require('fs');

var execSync = function(cmd) {

    var exec  = require('child_process').exec;
    
    //for linux use ; instead of &&
    //execute your command followed by a simple echo 
    //to file to indicate process is finished
    exec(cmd + " > stdout.txt ; echo done > sync.txt");

    while (true) {
        //consider a timeout option to prevent infinite loop
        //NOTE: this will max out your cpu too!
        try {
        	var status = fs.readFileSync('sync.txt', 'utf8');
        	
            if (status.trim() == "done") {
            	var res = fs.readFileSync("stdout.txt", 'utf8');
            	fs.unlinkSync("stdout.txt"); //cleanup temp files
                fs.unlinkSync("sync.txt");
                console.log(res)
                return res;
            }
        } catch(e) { } //readFileSync will fail until file exists
    }
};

function get_port(){
	return execSync("./get_port.sh").trim();
}

// Check to see if port in stdout.txt works, if so, return it without running execSync, 
//	which changes the filesystem and so triggers a couchapp push and creates a 
//	couchapp push/db changes feed loop.  So, this should create a loop the first time the port
//	is discovered, but so long as the port remains the same, the second time it runs it should
//	not create a loop anymore.
if (fs.existsSync('stdout.txt')){
	log('stdout.txt exists')
	var port = fs.readFileSync("stdout.txt", 'utf8'),
		cradle = require('cradle'),
		auth = fs.readFileSync('./auth.txt', 'ascii').trim(),
		username = auth.split(':')[0],
		password = auth.split(':')[1],
		get_db = require('./lib').get_db;
	try {
		// Check to see if that port works
		// TODO: This doesn't actually throw an error when the port is wrong
		db = get_db(port);
		var db_info = db.info()
	}catch(err){
		log("Cannot connect to the database: " + err + ", so I'm running the port discovery script.");
		var port = get_port();
	}
}else{
	log("stdout.txt does not exist, so I'm running the port discovery script.");
	var port = get_port();
	log('After running port discovery script')
}
	
exports.port = port;