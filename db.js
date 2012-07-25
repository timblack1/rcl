var path = unescape(document.location.pathname).split('/'),
	db = $.couch.db(path[1]);

exports.db = db