function(doc) {
  if (doc.collection == 'cgroup') {
      emit(doc.abbreviation, doc)
      emit(doc.name, doc)
  }
};