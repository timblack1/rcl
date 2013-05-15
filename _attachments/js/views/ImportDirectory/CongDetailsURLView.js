define([
        '../../config',
        '../../vendor/mustache',
        'text!views/ImportDirectory/CongDetailsURL.html',
        './ConfirmCongIDView'
        ], 
        function(config, Mustache, template, ConfirmCongIDView){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            var thiz = this
            // Notify the user that we are downloading the requested data
            $('#steps').html('Getting state page data for ' +
                window.app.dir.get('state_page_values').length + 
                ' state pages (this may take a while)...')
            // Set up changes listener here to write first state page's HTML to cong_details_url_selector
            config.db.changes().onChange(function(change){
                var change_id = change.results[0].id
                var rev = change.results[0].changes[0].rev
                // Determine if the changed document is the dir we are editing
                if (typeof window.app.dir != 'undefined' && change_id == window.app.dir.get('_id')){
                    // Fetch document's new contents from db
                    // TODO: Why doesn't backbone-couchdb automatically update the
                    //  model object for me when the associated doc changes in the db?
                    window.app.dir.fetch({success:function(model,response){
                        
                        // ----------------------------------------------------------
                        // These are the main cases - different types of changes that
                        //  need to be handled
                        
                        // Display state details page's content
                        if (window.app.dir.get('state_url_html')){
                            if (window.app.dir.get('get_state_url_html') == 'gotten'){
                                // Notify user
                                $('#cong_details_url #status').html('Downloaded data for all states!')
                                $('#cong_details_url #status').delay(5000).fadeOut(1000).slideUp(1000)
                                if (window.app.dir.get('state_url_html').length >0 &&
                                        typeof displayed_state_page == 'undefined'){
                                    // Display the contents of the state page
                                    // TODO: This displays only one state's page.  Create a way
                                    //  to iterate through the other states' pages to test them
                                    //  to see if the regex works on them, after getting
                                    //  a regex that works from this first state page.
                                    var index = 0
                                    var new_html_set = config.rewrite_urls(window.app.dir.get('state_url'), window.app.dir.get('state_url_html'), index)
                                    $('#steps #status').fadeOut(1000)
                                    $('#cong_details_url_selector').fadeIn(1000)
                                    // Finally render the template here!
                                    $('#steps').html(Mustache.render(template));
                                    thiz.delegateEvents()
                                    try{
                                        // It's best to catch and ignore errors
                                        //  generated from the web-scraped HTML
                                        $('#cong_details_url_selector').html(new_html_set[index])
                                    }catch(err){
                                        console.log("The remote site's code output the following error: " + err)
                                    }
                                    displayed_state_page = true
                                    // Handle the user's click on the congregation
                                    //  details link
                                    $('#cong_details_url_selector a').click(function(e){
                                        e.preventDefault()
                                        thiz.confirm_cong_id_view = new ConfirmCongIDView({el: $("#steps")})
                                        thiz.confirm_cong_id_view.render()
                                    });
                                }
                            }
                        }
                    }})
                }
            })
        },
        events: {
        }

    });

});
