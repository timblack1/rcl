function(doc) {
  if (doc.type == 'directory') {
      emit(doc.url, doc._rev)
  }
};