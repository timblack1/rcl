define(
   [
    '../../config',
    '../../model',
    '../../lib/mustache',
    './DirURLView',
    './ConfirmCongIDView',
    'text!views/ImportDirectory/main.html'
    ],
    function(config, model, Mustache, DirURLView, ConfirmCongIDView, template){

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
                                    // In the controller & output to form, handle whether this is an RSS feed or an HTML page
                                    // Determine whether url_html contains HTML or RSS
                                    if (html.indexOf("</html>") > -1){
                                        $("#directory_type").show(1000);
                                        // This event handler needs to be attached here because otherwise it is
                                        //  unavailable in the tests
                                        $('#directory_type input').click(thiz.show_directory)
                                        $("#rss_feed").hide(1000);
                                        dir.set('pagetype', 'html')
                                    }
                                    else if (html.indexOf("</rss>") > -1){
                                        // TODO: Display the right form controls for an RSS page
                                        $("#directory_type").hide(1000);
                                        $("#rss_feed").show(1000);
                                        dir.set('pagetype', 'rss')
                                    }
                                    else { // We got an error code
                                        // TODO: Finesse this condition to be consistent
                                        //  with the nested conditions above
                                        // Hide the form controls.
                                        elem.trigger('hide_subform');
                                    }
                                    dir.set('get_url_html', '')
                                    // TODO: Is this the right place to save the dir?
                                    //    https://blueprints.launchpad.net/reformedchurcheslocator/+spec/decide-whether-to-save-dir
                                    //dir.save({_id:dir.get('_id')})
                                }
                                
                                // Display state details page's content
                                if (dir.get('state_url_html')){
                                    console.log('get_state_url_html: ' + dir.get('get_state_url_html'))
                                    if (dir.get('get_state_url_html') == 'gotten'){
                                        // Notify user
                                        $('#cong_details_url #status').html('Downloaded data for all states!')
                                        $('#cong_details_url #status').delay(5000).fadeOut(1000).slideUp(1000)
                                        if (dir.get('state_url_html').length >0 &&
                                                typeof displayed_state_page == 'undefined'){
                                            // Display the contents of the state page
                                            // TODO: This displays only one state's page.  Create a way
                                            //  to iterate through the other states' pages to test them
                                            //  to see if the regex works on them, after getting
                                            //  a regex that works from this first state page.
                                            try{
                                                // It's best to catch and ignore errors
                                                //  generated from the web-scraped HTML
                                                var index = 0
                                                var new_html_set = thiz.rewrite_urls(dir.get('state_url'), dir.get('state_url_html'), index)
                                                $('#cong_details_url_selector').html(new_html_set[index])
                                                $('#cong_details_url_selector').show(1000)
                                            }catch(err){
                                                console.log("The remote site's code output the following error: " + err)
                                            }
                                            displayed_state_page = true
                                            // Handle the user's click on the congregation
                                            //  details link
                                            $('#cong_details_url_selector a').click(function(e){
                                                e.preventDefault()
                                                window.app.import_directory_view.show_select_cong_details(e);
                                            });
                                        }
                                    }
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
                this.DirURLView = new DirURLView
                this.DirURLView.render()
            },
            events: {
                'keyup #url':"get_church_dir_from_url"
            },
            rewrite_urls:function(page_url, page_html_set, index){
                // Prepend the root URL to every partial URL in this HTML
                function replacer(match, p1, p2, offset, string){
                    var output;
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
                // Get root URL
                var a = document.createElement('a')
                a.href = page_url
                var base = a.origin + a.pathname
                var root_url = base.slice(0,base.lastIndexOf('/'))
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
            },
            hide_dir_and_display_type:function(){
                $('#dir_and_display_type').hide(1000)
            },
            hide_subform:function(){
                $("#directory_type, #rss_feed, #cong_details, #state_page, #church_directory_page").hide(1000);
            },
            show_directory:function(){
                var type = $('input:radio[name=type]:checked').val();
                // TODO: The PCA has a KML file at http://batchgeo.com/map/kml/c78fa06a3fbdf2642daae48ca62bbb82
                //  Some (all?) data is also in JSON at http://static.batchgeo.com/map/json/c78fa06a3fbdf2642daae48ca62bbb82/1357687276
                //  After trimming off the non-JSON, the cong details are in the obj.mapRS array
                //  You can pretty-print it at http://www.cerny-online.com/cerny.js/demos/json-pretty-printing
                if (type=='one page'){
                    // Show the one page divs
                    $("#state_page").hide(1000);
                    // TODO: If "One Page" is selected, then show page containing list of all congs.
                    // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/show-one-page-directory
                    // TODO: For some reason, the global dir object is not avaiable in this scope
                    // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/get-global-dir-object-in-scope
                    dir.set('display_type', type)
                }
                //  If "One state per page" is selected, then drop down box showing state options.
                if (type=='one state per page'){
                    // Show the state page divs
                    $("#state_page").show(1000);
                    dir.set('display_type', type)
                    // Populate state_drop_down_selector div with contents of church directory page,
                    //  maybe in a scrollable div
                    var new_html_set = this.rewrite_urls(dir.get('url'), [dir.get('url_html')], 0)
                    $('#state_drop_down_selector').html(new_html_set[0]);
                    // We bind the event here because the select element didn't exist at this Backbone view's
                    //  initialization
                    $('#state_drop_down_selector select')
                        .click({this_ob:this},function(event){ event.data.this_ob.show_state_page(event)})
                }
                this.hide_dir_and_display_type()
            },
            show_state_page:function(event){
                // Get the list of state page URLS out of its option values
                // That is a bit challenging, because the format may be different for each directory.
                // So, I think we need a regular expression editor here.
                var el = $(event.target),
                    options = $(el).children(),
                    values = [];
                
                // Get the select box the user clicked, and record its xpath below so it can be found later.
                // Note this xpath is recorded relative to the container of the directory website's body element
                var xpath = config.getXPath($(el)[0]).replace(config.getXPath($('#state_page')[0]),'')
                
                // Disable the select box immediately after the user clicks on it, so they can't
                //  click on one of its options and fire a page load event.
                $(event.target).prop('disabled',true)
                event.preventDefault()
                var state_page_values = []
                for (var i=0; i<options.length; i++){
                    var val = $(options[i]).val()
                    if (val !== '' && val !== null && val !== 'null'){
                        state_page_values.push(val);
                    }
                }
                // Hide divs we don't need now
                $("#state_page, #url_and_display_type, #directory_type, #cong_details_fields_selector").hide(1000);
                // Get cong data from a URL like this:  http://opc.org/locator.html?state=WA&search_go=Y
                // TODO: Record whether to send a GET or POST
                // Display these bits of data to the user so they can edit them.
                // Show confirmation div
                $('#cong_details_url').show(1000)
                var form = el.closest('form')
                // Handle cases where there is or is not a final slash in base_url, or
                //  an initial slash in form.attr('action').
                var base_url = dir.get('url').replace(/\/+$/,'')
                var state_url = ''
                if (form.attr('action').indexOf('/') === 0){
                    // action is a partial absolute URL, so attach it to the domain name
                    var state_url_parts = base_url.split('/').slice(0,3)
                    state_url_parts.push(form.attr('action').replace(/^\//,''))
                    state_url = state_url_parts.join('/')
                }else if (form.attr('action').indexOf('http') === 0){
                    // action is a complete absolute URL
                    state_url = form.attr('action')
                }else{
                    // action is a relative URL
                    var base_url_shortened = base_url.slice(0,base_url.lastIndexOf('/'))
                    state_url = base_url_shortened + '/' + form.attr('action')
                }
                state_url += '?' + el.attr('name') + '=' + '{state_name}'
                // Append other form inputs
                $.each($(form).find('input'),function(index,element){
                    var input = $(element)
                    state_url += '&' + input.attr('name') + '=' + input.val()
                })
                var it = 0
                // Note this is a recursive function!  It tries to save until it succeeds.
                function save_dir(dir){
                    it++;
                    dir.fetch({success:function(model, response, options){
                        // TODO: There is a document update conflict here.  The local and remote copies appear to
                        //  have the same _rev from here.  But in the DB, the _rev is 2 beyond that detected
                        //  here.
                        var get_state_url_html = dir.get('get_state_url_html')
                        // Prevent import from running multiple times simultaneously
                        // TODO: Start here.  This seems to prevent the import from running at all.
                        console.log('get_state_url_html: ' + get_state_url_html)
                        if (get_state_url_html != 'getting'){
                            get_state_url_html = 'requested'
                        }
                        console.log('get_state_url_html: ' + get_state_url_html)
                        // Prevent this function from attempting to save the same revision twice simultaneously
                        if (typeof window.app.import_directory_view.rev_currently_being_saved !== 'undefined' &&
                            window.app.import_directory_view.rev_currently_being_saved === dir.get('_rev')){
                            // Wait 1 second and try again
                            setTimeout(function(){ save_dir(dir) }, 1000)
                            return;
                        }
                        // Only save this revision if it's not currently being saved already
                        if (window.app.import_directory_view.rev_currently_being_saved !== dir.get('_rev')){
                            // Prevent saving the same revision twice simultaneously
                            if (typeof window.app.import_directory_view.rev_currently_being_saved === 'undefined'){
                                window.app.import_directory_view.rev_currently_being_saved = dir.get('_rev')
                            }
                            console.log(it + ' 459', dir.get('_rev'))
                            dir.save({
                                state_url:state_url,
                                get_state_url_html:get_state_url_html,
                                state_url_html:'',
                                state_url_method:form.attr('method'),
                                select_element_xpath:xpath,
                                state_page_values:state_page_values
                            },
                            {
                                success:function(){
                                    // Allow other asynchronous calls to this same function to save to the db
                                    delete window.app.import_directory_view.rev_currently_being_saved
                                    // Notify the user that we are downloading the requested data
                                    $('#cong_details_url #status').html('Getting state page data for ' +
                                         state_page_values.length + ' state pages (this may take a while)...')
                                    // Show state details page div
                                    $("#cong_details_url").fadeIn(1000);
                                },
                                error:function(model, xhr, options){
                                    console.error('we got the 454 error')
                                    save_dir(dir)
                                }
                            })

                        }
                    }})
                }
                save_dir(dir)
            },
            show_select_cong_details:function(event){
                // Hide step 4's header, letting the status message continue to display
                $('#cong_details_url>h2').hide(1000)
                // Prevent the link from making the browser navigate away from this page
                event.preventDefault()
                // Display step 4.5 in a child view
                //this.confirm_cong_id_view = new ConfirmCongIDView({el:'#ConfirmID'})
                this.confirm_cong_id_view = new ConfirmCongIDView({el:'#cong_details_url_selector'})
            }
        })
        return ImportDirectoryView

});