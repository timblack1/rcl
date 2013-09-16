require.config({
  waitSeconds: 15000,
  paths: {
      "async": "vendor/requirejs-plugins/src/async",
      "backbone": "vendor/backbone/backbone",
      // Note this may import the .coffee instead of the .js file
      "backbone_couchdb": "vendor/backbone-couchdb/backbone-couchdb",
      "backbone_relational": "vendor/backbone-relational/backbone-relational",
      // Note this may import the .css instead of the .js file
      "backgrid":"vendor/backgrid/lib/backgrid",
      "bootstrap": "vendor/bootstrap/dist/js/bootstrap.min",
      "config": "config",
      "jquery": "vendor/jquery/jquery.min",
      "jquery_migrate": "vendor/jquery/jquery-migrate",
      // Commented out because it uses $.browser, which is deprecated
      // But this may break msie compatibility!
      //"jquery_couch": "/_utils/script/jquery.couch",
      "jquery_couch": "jquery.couch",
      "jquery_couchLogin": "vendor/jquery.couchLogin/jquery.couchLogin",
      "jquery_xpath": "vendor/jquery.xpath/jquery.xpath",
      "model": "model",
      "mustache": "vendor/mustache/mustache",
      "text": "vendor/requirejs-text/text",
      "underscore": "vendor/underscore/underscore"
  },
  shim: {
      backbone: {
          deps: ["jquery", "underscore"],
          exports: "Backbone"
      },
      backbone_relational: {
          deps: ["backbone"]
      },
      backbone_couchdb: {
          deps: ["backbone_relational", "jquery_couch"],
          init: function(){
              // TODO: Handle injecting Backbone.RelationalModel into backbone_couchdb here
              // return this.
          },
          exports: 'Backbone'
      },
      // TODO: Use require-css to inject the CSS as needed
      backgrid: {
          deps: ["jquery", "backbone", "underscore"],
          exports: 'Backgrid'
      },
      // TODO: Use require-css to inject the CSS as needed
      "bootstrap": {
          deps: ["jquery"],
          exports: "$.fn.typeahead"
      },
      jquery_couch: {
          deps: ["jquery", "jquery_migrate"]
      },
      jquery_couchLogin: {
          deps: ["jquery", "jquery_couch"]
      },
      jquery_migrate: {
          deps: ["jquery"]
      },
      jquery_xpath: {
          deps: ["jquery"]
      },
      model: {
          deps: ["jquery", "config", "backbone", "backbone_relational", "backbone_couchdb"]
      },
      mustache: {
          exports: ["Mustache"]
      },
      underscore: {
          exports: '_'
      }
  }
});
// Define require() from require.js using the standard AMD define

require(
   [
    'jquery_couch',
    'underscore',
    'backbone',
    'config',
    'model',
    'views/view_loader',
    'jquery_couchLogin'
    ], 
    function(
             $_couch,
             underscore,
             backbone,
             config,
             model,
             views
        ){

       // Create main application
        var App = Backbone.Router.extend({
            initialize : function(){
                // Make it easy to reference this object in event handlers
                _.bindAll(this, 'find_a_church', 'import_directory')
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
                "index.html":                    "index.html",
                "find_a_church":                 "find_a_church",
                "import_directory":              "import_directory"
            },
            render:function(){
                this.menu_view = new views.MenuView({ el: $(".navbar") });
                this.menu_view.render()
                this.find_a_church_view = new views.FindAChurchView({ el: $("#content") });
                this.import_directory_view = new views.ImportDirectoryView({ el: $("#content") });
                // TODO: Login doesn't work yet
                $("#account").couchLogin({});
                // This renders the default view for the app
                // TODO:  If the page loaded from a different view's URL, load that view instead
                //    Maybe we can handle that in the router below.
                //  load-correct-view-from-url-on-first-load
                this.default_view = this[config.default_view]
                this.default_view.render()
                // Run tests only if configured to do so
                var thiz = this
                if (config.run_jasmine_tests === true) {
                    $('head').append('<link rel="stylesheet" href="js/vendor/jasmine/lib/jasmine-core/jasmine.css" type="text/css" />')
                    // TODO: Is the setTimeout call necessary?  Its purpose is to fix the problem where the tests
                    //  don't run on page load, maybe because they are loaded too early.  But loading them late
                    //  doesn't fix the problem either.  They just sometimes run, and sometimes don't.
                    setTimeout(function(){
                        thiz.run_tests_view = new views.RunTestsView({ el: $("#tests") });
                    }, 3000)
                }
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
        // Instantiate & initialize App
        window.app = new App
        // Render after initializing, so window.app can be accessed by the views this app renders
        window.app.render()
        // Make model, config available in tests
        window.app.model = model
        window.app.config = config
       
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
