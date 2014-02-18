define([
        'config',
        'mustache',
        'text!views/ImportDirectory/CongDetailsURL.html',
        './ConfirmCongIDView'
        ], 
        function(config, Mustache, template, ConfirmCongIDView){
    
    return Backbone.View.extend({
        initialize:function(){
        },
        render: function(){
            var thiz = this
            // Notify the user that we are downloading the requested data
            $('#steps').html('Getting state page data for ' +
                this.model.get('state_page_values').length + 
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
                                    // Handle the user's click on the congregation details link
                                    $('#cong_details_url_selector a').click(function(event){
                                        event.preventDefault()

                                        // TODO: Get the xpath of the anchor that was clicked
                                        var element = $(event.target)
                                        // TODO: This code is repeated elsewhere.  Refactor!
                                        // Get the XPath of the selected element
                                        // Note that you have to pass it a DOM element, not a JQuery element, hence the [0] index
                                        var element_xpath_local = config.getXPath(element[0]);
                                        // Replace the xpath of the div containing the remote page with the remote congregation directory's 
                                        //      xpath prefix, which should be '/html'.  The result is that we store the xpath as it would work
                                        //      in the remote page, and if we change RCL's page structure, our stored xpath does not become
                                        //      obsolete.
                                        var rcl_xpath_prefix = config.getXPath($('#cong_details_url_selector')[0])
                                        var xpath = element_xpath_local.replace(rcl_xpath_prefix, '/html/body');
                                        // TODO: Should I save the cong_details_url_xpath for later use?
                                        // Get the href out of the original HTML (before its URLs were made absolute)
                                        var dom = document.implementation.createHTMLDocument('temp document')
                                        try{
                                            // this avoids breaking on this error:  GControl is not defined
                                            dom.documentElement.innerHTML = window.app.dir.get('state_url_html')[0]
                                        }catch (e){}
                                        window.dom = dom
                                        window.xpath = xpath
                                        window.rcl_xpath_prefix = rcl_xpath_prefix
                                        // console.log($.xpath(xpath, dom), $.xpath(xpath, dom.documentElement))
                                        // var href = $.xpath(xpath, dom.documentElement).attr('href')
                                        var href = $(dom.evaluate(xpath, dom.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue).attr('href')
                                        console.log('original href: ' + href)
                                        console.log('start here')
                                        
                                        // Create a regex to find this kind of href
                                        // var href_regex = href.replace()
                                        // var url = window.app.dir.get('state_url_html')

                                        thiz.confirm_cong_id_view = new ConfirmCongIDView({el: $("#steps")})
                                        thiz.confirm_cong_id_view.render()
                                    });
                                }
                            }
                        }
                    }})
                }
            })
        }

    });

});
