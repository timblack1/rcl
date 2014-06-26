function(doc) {
  if (doc.collection == 'directory') {
      emit(doc.url, doc)
  }
};