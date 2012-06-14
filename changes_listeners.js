var buffer = '',
	db = require('./db.js').db,
	stdin = process.openStdin();

stdin.setEncoding('utf8');

// TODO: This doesn't print yet
//console.log('in changes_listeners.js');  // This throws "This socket is closed."
stdin.on('data', function (chunk) {
	buffer += chunk.toString();
	while (buffer.indexOf('\n') !== -1) {
		line = buffer.slice(0, buffer.indexOf('\n'));
		buffer = buffer.slice(buffer.indexOf('\n') + 1);  
		var obj = JSON.parse(line);
		if (obj[0] === "change") {
			var doc = obj[1];
			//console.log(doc);
			// Handle all other changes
			// TODO: Get the changed document from the database
			doc = db.get(obj._id);
			
			// TODO: Watch for requests to get the contents of a URL
			if (doc.type = 'cgroup' && doc.get_url_contents==true && doc.url){
				// Like when a user enters "opc.org/locator.html" into the church directory configuration page,
				// 	then go get the contents of that URL.
				doc.url_html = http.get(doc.url);
				doc.get_url_contents = false;
				// TODO: Decide whether to process the data more here, or just Write the contents of 
				//	the html variable back to the database from here.
				db.write(doc);
			}
			
		}
	}
});
