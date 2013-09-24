function(doc, req){
  // is the document part of a collection?
  if(doc.collection && req.query && req.query.collection && doc.collection == req.query.collection)
    return true;
  // has the document been deleted?
  else if (req.query && req.query.collection && doc._deleted)
    return true;
  else
    return false;
}