function(doc) {
  if (doc.collection == 'cgroups') {
      emit(doc.abbreviation, doc._rev)
  }
};