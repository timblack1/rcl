function(doc) {
  if (doc.abbreviation == 'OPC') { // useful for deleting directories which don't have the correct type
      emit(doc.abbreviation, doc._rev)
  }
};