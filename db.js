// Get the CouchDB port synchronously, and only then create a Cradle db connection
var port = require('./port').port,
    get_db = require('./lib').get_db;

exports.db = get_db(port);