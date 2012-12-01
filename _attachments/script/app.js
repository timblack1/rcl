// Define require() from require.js using the standard AMD define
define(
   [
    'config',
    'model', 
    'views/view_loader',
    'lib/jquery.couchLogin'
    ], 
    function(config, model, views){

       // Make model, config global so they're available in tests
       window.model = model
       window.config = config
       
       // Create main application
        var App = Backbone.Router.extend({
            initialize : function(){
                // Run tests only if configured to do so
                if (config.run_jasmine_tests == true) {
                    $('head').append('<link rel="stylesheet" href="script/lib/jasmine/lib/jasmine-1.3.0/jasmine.css" type="text/css" />')
                    this.run_tests_view = new views.RunTestsView({ el: $("#tests") });
                }
                this.menu_view = new views.MenuView({ el: $("#mainmenu") });
                this.find_a_church_view = new views.FindAChurchView({ el: $("#content") });
                this.import_directory_view = new views.ImportDirectoryView({ el: $("#content") });
                $("#account").couchLogin({});
                // This renders the default view for the app
                // TODO:  If the page loaded from a different view's URL, load that view instead
                //    Maybe we can handle that in the router below.
                //  load-correct-view-from-url-on-first-load
                this.default_view = this[config.default_view]
                this.default_view.render()
            },
            // Set up URLs here
            // TODO: Set CouchDB routing for URLs it doesn't understand.  Is there a way to do this
            //    without duplicating what is written here?
            //    http://blog.couchbase.com/what%E2%80%99s-new-apache-couchdb-011-%E2%80%94-part-one-nice-urls-rewrite-rules-and-virtual-hosts
            //    Maybe in this.initialize we can dynamically get ddoc.rewrites, iterate through it, 
            //    and dynamically create this.routes in the correct data format, 
            //    which is {'url':'function_name',...}.
            //    (misunderstood_url)
            
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
                //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/decide-whether-to-hide-or-destroy-views
                this.find_a_church_view.render()
            },
            import_directory:function(){
                this.import_directory_view.render()
            }
        });
        // Instantiate App
        window.app = new App
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
        //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/example-of-vhosts-not-working-yet
        $(document).on("click", "a[href^='/']", function(event){
            var href = $(event.currentTarget).attr('href')
            // chain 'or's for other black list routes
            var passThrough = href.indexOf('sign_out') >= 0 || href.indexOf('delete') >= 0
            // Allow shift+click for new tabs, etc.
            if (!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey){
                event.preventDefault()
                // Instruct Backbone to trigger routing events
                app.navigate(href, { trigger: true })
                return false
            }
        })
        
        return {
            app:app
        }
});