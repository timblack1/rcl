Overview of CouchObject

Since one didn't exist yet, we're beginning to make a simple CouchApp-specific ORM in JavaScript called CouchObject ( http://bazaar.launchpad.net/~caneypuggies/reformedchurcheslocator/couchapp/view/head:/model.js ) that lets you define model objects that 

1) have the CouchObject base object as their prototype, 
2) allow you to document your schema, 
3) allow you to define views in one place, and maybe 
4) auto-create (and auto-load on attribute access) default views and relationship views, and 
5) auto-persist data to CouchDB when the object changes, and auto-load data from the database when the object's underlying documents change in CouchDB.

EndTable provides a complex example of how to write most of the last two features, but EndTable requires Node.js, and CouchApps can't run in Node.

I don't mind if CouchApp remains simple.  It began as my attempt to write a question to the CouchApp discussion group about how to accomplish parts of 2)-4) above, so I'm really at a stage where I'd like feedback--even discouraging feedback like "Don't make a non-relational database relational all over again!!!" if that's what I really need to hear. :)  (It's just that our data is relational, and we need bidirectional peer-to-peer/master-to-master replication as a feature of our application.)