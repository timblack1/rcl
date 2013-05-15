define(
   [
    '../../config',
    '../../model',
    '../../vendor/mustache',
    './DirURLView',
    'text!views/ImportDirectory/main.html'
    ],
    function(config, model, Mustache, DirURLView, template){

        var ImportDirectoryView = Backbone.View.extend({
            initialize : function(){
                db = config.db
                wgxpath.install()
                
                // Make it easy to reference this object in event handlers
                _.bindAll(this)
                
                // Set up browser changes listener to watch for and handle Node changes
                //  listener's response
                var changes = db.changes();
                this.template = template;
                // Register necessary subviews
                this.DirURLView = DirURLView;
                var thiz = this
                // TODO: convert to this.watching_import_directory_view_changes
                if (typeof watching_import_directory_view_changes == 'undefined'){
                    changes.onChange(function(change){
                        var change_id = change.results[0].id
                        var rev = change.results[0].changes[0].rev
                        // Determine if the changed document is the dir we are editing
                        if (typeof dir != 'undefined' && change_id == dir.get('_id')){
                            // Fetch document's new contents from db
                            // TODO: Why doesn't backbone-couchdb automatically update the
                            //  model object for me when the associated doc changes in the db?
                            dir.fetch({success:function(model,response){
                                
                                // ----------------------------------------------------------
                                // These are the main cases - different types of changes that
                                //  need to be handled
                                
                                // Display directory's first page of content
                                if (dir.get('url_html') &&
                                        dir.get('get_url_html') == 'gotten'){
                                    var html = dir.get('url_html')
                                    // Determine whether this URL's data is HTML, RSS, or KML
                                    if (html.indexOf("</html>") > -1){
                                        $("#directory_type").show(1000);
                                        // This event handler needs to be attached here because otherwise it is
                                        //  unavailable in the tests
                                        $('#directory_type input').click(thiz.show_directory)
                                        $("#rss_feed").hide(1000);
                                        dir.set('pagetype', 'html')
                                    }
                                    else if (html.indexOf("</rss>") > -1){
                                        // TODO: Display the right form controls for an RSS feed
                                        $("#directory_type").hide(1000);
                                        $("#rss_feed").show(1000);
                                        dir.set('pagetype', 'rss')
                                    }
                                    else if (html.indexOf("</kml>") > -1){
                                        // TODO: Display the right form controls for a KML feed
                                        $("#directory_type").hide(1000);
                                        $("#rss_feed").show(1000);
                                        dir.set('pagetype', 'rss')
                                    }
                                    else { // We got an error code
                                    }
                                    dir.set('get_url_html', '')
                                    // TODO: Is this the right place to save the dir?
                                    //    https://blueprints.launchpad.net/reformedchurcheslocator/+spec/decide-whether-to-save-dir
                                    //dir.save({_id:dir.get('_id')})
                                }
                                
                                // ----------------------------------------------------------

                            }})
                        }
                    })
                    watching_import_directory_view_changes = true;
                }
            },
            render: function(){
                // TODO: Consider using assign() as described here:  http://ianstormtaylor.com/rendering-views-in-backbonejs-isnt-always-simple/
                //config.render_to_id(this, "#import_directory_template")
                // Render Mustache template
                $('#content').html(Mustache.render(this.template));
                // Render first subview
                this.DirURLView = new DirURLView({el: '#steps'})
                this.DirURLView.render()
                this.delegateEvents()
            },
            hide_dir_and_display_type:function(){
                $('#dir_and_display_type').hide(1000)
            },
            hide_subform:function(){
                $("#directory_type, #rss_feed, #cong_details, #state_page, #church_directory_page").hide(1000);
            }
        })
        return ImportDirectoryView

});
