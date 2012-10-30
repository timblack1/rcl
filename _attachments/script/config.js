define(
   [
    'lib/underscore'
    ], 
    function(){
       // TODO: Dynamically get the database name
       //   https://blueprints.launchpad.net/reformedchurcheslocator/+spec/dynamically-get-db-name
       var db_name = 'rcl',
           db = $.couch.db(db_name),
           run_jasmine_tests = true;

       // Enables Mustache.js-like templating.
       _.templateSettings = {
         interpolate : /\{\{(.+?)\}\}/g
       };
       
       function render_to_id(obj, id){
           var template = _.template( $(id).html(), {} );
           $(obj.el).html( template );
       }

       return {
           db_name:db_name,
           db:db,
           render_to_id:render_to_id,
           run_jasmine_tests:run_jasmine_tests
       }
    }
)