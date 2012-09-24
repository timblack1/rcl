function(doc) {
  if (doc.collection == 'cgroup') {
      emit(doc.abbreviation, doc._rev)
  }
};