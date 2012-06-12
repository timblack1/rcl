// Returns couchdb's port

var execSync = function(cmd) {

    var exec  = require('child_process').exec;
    var fs = require('fs');

    //for linux use ; instead of &&
    //execute your command followed by a simple echo 
    //to file to indicate process is finished
    exec(cmd + " > stdout.txt && echo done > sync.txt");

    while (true) {
        //consider a timeout option to prevent infinite loop
        //NOTE: this will max out your cpu too!
        try {
            var status = fs.readFileSync('sync.txt', 'utf8');

            if (status.trim() == "done") {
                var res = fs.readFileSync("stdout.txt", 'utf8');
                fs.unlinkSync("stdout.txt"); //cleanup temp files
                fs.unlinkSync("sync.txt");
                return res;
            }
        } catch(e) { } //readFileSync will fail until file exists
    }

};

exports.port = execSync("./get_port.sh");