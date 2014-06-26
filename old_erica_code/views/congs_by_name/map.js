function(doc) {
    if (doc.collection == 'cong' && doc.name) {
        // TODO: Figure out how to avoid emitting the full doc here
        //  http://janmonschke.com/projects/backbone-couchdb.html#custom_views
        //  seems to indicate we have to emit the full doc.
        emit(doc.name, doc);
    }
}
