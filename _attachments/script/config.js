define(
   [
    'lib/underscore'
    ], 
    function(){
       // TODO: Dynamically get the database name
       //   https://blueprints.launchpad.net/reformedchurcheslocator/+spec/dynamically-get-db-name
       var db_name = 'rcl',
           db = $.couch.db(db_name),
           run_jasmine_tests = true,
           // Select view to load at root URL
           //default_view = 'find_a_church_view',
           default_view = 'import_directory_view',
           // After running tests,
           //   Display this in the address bar: (to facilitate manually refreshing the page by
           //   hitting F5)
           test_home_address = 'index.html';

       // Enables Mustache.js-like templating.
       _.templateSettings = {
         interpolate : /\{\{(.+?)\}\}/g
       };
       
       function render_to_id(obj, id){
           var template = _.template( $(id).html(), {} );
           $(obj.el).html( template );
       }
       
       function getXPath( element ){
           var xpath = '';
           for ( ; element && element.nodeType == 1; element = element.parentNode ){
               var id = $(element.parentNode).children(element.tagName).index(element) + 1;
               id = id > 1 ? '[' + id + ']' : '';
               xpath = '/' + element.tagName.toLowerCase() + id + xpath;
           }
           return xpath;
       }

       return {
           db_name:db_name,
           db:db,
           render_to_id:render_to_id,
           run_jasmine_tests:run_jasmine_tests,
           test_home_address:test_home_address,
           default_view:default_view,
           getXPath:getXPath
       }
    }
)