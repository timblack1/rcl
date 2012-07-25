function(doc) {
  if (doc.type == 'directory') {
      emit(doc.abbreviation, doc._rev)
  }
};