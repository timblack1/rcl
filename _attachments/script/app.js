// Define require() from require.js using the standard AMD define
define(
   [
    'config',
    'model', 
    'views/view_loader',
    'async!https://maps.googleapis.com/maps/api/js?sensor=false',
    'lib/jquery.couchLogin'
    ], 
    function(config, model, views){

        // Create main application
        var App = Backbone.Router.extend({
            initialize : function(){
                this.menu_view = new views.MenuView({ el: $("#mainmenu") });
                // This renders the default view for the app
                // TODO:  If the page loaded from a different view's URL, load that view instead
                //    Maybe we can handle that in the router below.
                this.find_a_church_view = new views.FindAChurchView({ el: $("#content") });
                //this.find_a_church_view.render()
                this.import_directory_view = new views.ImportDirectoryView({ el: $("#content") });
                this.import_directory_view.render()
                // TODO: Move tests into a View that displays in a suitable location on the page,
                //  and run them only if config.run_jasmine_tests == true
                $("#account").couchLogin({});
            },
            // Set up URLs here
            // TODO: Set CouchDB routing for URLs it doesn't understand.  Is there a way to do this
            //    without duplicating what is written here?
            //    http://blog.couchbase.com/what%E2%80%99s-new-apache-couchdb-011-%E2%80%94-part-one-nice-urls-rewrite-rules-and-virtual-hosts
            //    Maybe in this.initialize we can dynamically get ddoc.rewrites, iterate through it, 
            //    and dynamically create this.routes in the correct data format, 
            //    which is {'url':'function_name',...}.
            routes: {
                "index.html":                 "index.html",
                "find_a_church":                 "find_a_church",
                "import_directory":              "import_directory"
            },
            find_a_church:function(){
                // TODO: This destroys the old view, and renders a new view, in the #content div.
                //    But if the view has already been rendered, and has some state, it might 
                //    be better to HIDE other views, and DISPLAY this one, rather than render it,
                //    because this would preserve the rendered view's state.
                //    Con:  Preserving the rendered view's state is not what most users expect.
                //    Pro:  It might be what most users want
                //    So, do we want to preserve this view's state?
                this.find_a_church_view.render()
            },
            import_directory:function(){
                this.import_directory_view.render()
            }
        });
        // Instantiate App
        app = new App
        // Create SEF URLs and handle clicks
        Backbone.history.start({pushState: true, root: "/rcl/_design/rcl/"})
        // Globally capture clicks. If they are internal and not in the pass 
        // through list, route them through Backbone's navigate method.
        // TODO: Create vhosts entry to allow pages to load from direct access to the URL, like
        //  to http://localhost:5984/rcl/_design/rcl/import_directory.  Currently that URL returns:
        //  {"error":"not_found","reason":"Document is missing attachment"}
        // TODO: When I create a vhosts entry for /rcl2 and rewrites.json, then go to 
        //  http://localhost:5984/rcl2/find_a_church, it returns:
        //  {"error":"not_found","reason":"Document is missing attachment"}
        $(document).on("click", "a[href^='/']", function(event){
            var href = $(event.currentTarget).attr('href')
            // chain 'or's for other black list routes
            var passThrough = href.indexOf('sign_out') >= 0 || href.indexOf('delete') >= 0
            // Allow shift+click for new tabs, etc.
            if (!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey){
                event.preventDefault()
                // Instruct Backbone to trigger routing events
                app.navigate(href, { trigger: false })
                return false
            }
        })
        
        return {
            app:app
        }
});