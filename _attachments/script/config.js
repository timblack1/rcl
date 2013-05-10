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
           run_jasmine_tests = true,
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
       // From http://ianstormtaylor.com/assigning-backbone-subviews-made-even-cleaner/
       //   Use this in a view to render initial subviews
       function assign(selector, view) {
            var selectors;
            if (_.isObject(selector)) {
                selectors = selector;
            }
            else {
                selectors = {};
                selectors[selector] = view;
            }
            if (!selectors) return;
            _.each(selectors, function (view, selector) {
                view.setElement(this.$(selector)).render();
            }, this);
        }
        function rewrite_urls(page_url, page_html_set, index){
            // Prepend the root URL to every partial URL in this HTML
            function replacer(match, p1, p2, offset, string){
                // Get root URL
                var a = document.createElement('a')
                a.href = page_url
                var base = a.origin + a.pathname
                var root_url = base.slice(0,base.lastIndexOf('/'))
                var output;

                // Cases:
                // Absolute, partial URL:  /locator.html
                if (p2.indexOf('/') === 0){
                    output = a.origin + p2
                }
                // Absolute, full URL:  http://opc.org/locator.html
                else if (p2.indexOf('http') === 0){
                    output = p2
                }
                // Relative, partial URL:  locator.html
                else{
                    output = root_url + '/' + p2
                }
                // Include the href='' or src='' portion in what goes back into the HTML
                return match.replace(p2, output)
            }
            if (typeof page_html_set[index] == 'string'){
                // Find the URLs to replace
                var regex = /(href|src)\s*=\s*['"]{1}(.*?)['"]{1}/g
                // In every page
                for (var i=0; i<page_html_set.length; i++){
                    // Replace the URLs
                    page_html_set[i] = page_html_set[i].replace(regex, replacer)
                }
                return page_html_set
            }else{
                console.error('the page_url was not defined, but should have been')
            }
        }
        

       return {
           db_name:db_name,
           db:db,
           render_to_id:render_to_id,
           run_jasmine_tests:run_jasmine_tests,
           test_home_address:test_home_address,
           default_view:default_view,
           getXPath:getXPath,
           capitalize:capitalize,
           assign:assign,
           rewrite_urls:rewrite_urls
       }
    }
)