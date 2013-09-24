function(doc) {
    if (doc.denomination_abbr) {
        emit(doc.denomination_abbr, doc._rev);
    }
}
