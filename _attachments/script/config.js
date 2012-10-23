define(
   [
    ], 
    function(){
       // TODO: Dynamically get the database name
       var db_name = 'rcl',
           db = $.couch.db(db_name);

       return {
           db_name:db_name,
           db:db
       }
    }
)