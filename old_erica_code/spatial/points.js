function(doc){
    if (doc.loc) {
        emit({
            type: "Point",
            coordinates: [doc.loc[0], doc.loc[1]]
        }, [doc._id, doc.loc]);
    }
}