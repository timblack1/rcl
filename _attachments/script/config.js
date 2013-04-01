define(
   [
    'lib/underscore'
    ],
    function(){
       // TODO: Dynamically get the database name
       //   https://blueprints.launchpad.net/reformedchurcheslocator/+spec/dynamically-get-db-name
       // TODO: Run unit tests on test copy of the database
       var db_name = 'rcl',
           db = $.couch.db(db_name),
           run_jasmine_tests = false,
           // Select view to load at root URL
           //default_view = 'find_a_church_view',
           default_view = 'import_directory_view',
           // After running tests,
           //   Display this in the address bar: (to facilitate manually refreshing the page by
           //   hitting F5)
           test_home_address = 'index.html';

        // TODO: Move these functions into a library
       function render_to_id(obj, id){
           var template = _.template( $(id).html(), {} );
           $(obj.el).html( template );
       }
       // Two options for getting the xpath of an element
       function getXPath( element ){
           var xpath = '';
           for ( ; element && element.nodeType == 1; element = element.parentNode ){
               var id = $(element.parentNode).children(element.tagName).index(element) + 1;
               id = id > 1 ? '[' + id + ']' : '';
               xpath = '/' + element.tagName.toLowerCase() + id + xpath;
           }
           return xpath;
       }
       // From http://home.arcor.de/martin.honnen/javascript/storingSelection1.html
        function makeXPath (node, currentPath) {
          /* this should suffice in HTML documents for selectable nodes, XML with namespaces needs more code */
          currentPath = currentPath || '';
          switch (node.nodeType) {
            case 3:
            case 4:
              return makeXPath(node.parentNode, 'text()[' + (document.evaluate('preceding-sibling::text()', node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']');
            case 1:
              return makeXPath(node.parentNode, node.nodeName + '[' + (document.evaluate('preceding-sibling::' + node.nodeName, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''));
            case 9:
              return '/' + currentPath;
            default:
              return '';
          }
        }
       function capitalize(str){
           return str.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
       }

       return {
           db_name:db_name,
           db:db,
           render_to_id:render_to_id,
           run_jasmine_tests:run_jasmine_tests,
           test_home_address:test_home_address,
           default_view:default_view,
           getXPath:getXPath,
           capitalize:capitalize
       }
    }
)