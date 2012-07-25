function(doc) {
  if (doc.type == 'cgroup') {
      emit(doc.abbreviation, doc._rev)
  }
};