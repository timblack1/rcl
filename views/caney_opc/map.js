function(doc) {
  if (doc.type == 'congregation') {
      emit(doc.name, doc._rev)
  }
};