define(
   [
    '../config',
    '../model'
    ], 
    function(config, model){

        var ImportDirectoryView = Backbone.View.extend({
            initialize : function(){
                db = config.db
                // Set up browser changes listener to watch for and handle Node changes 
                //  listener's response
                var changes = db.changes();
                if (typeof watching_import_directory_view_changes == 'undefined'){
                    changes.onChange(function(change){
                        var change_id = change.results[0].id
                        var rev = change.results[0].changes[0].rev
                        // Determine if the changed document is the dir we are editing 
                        if (typeof dir != 'undefined' && change_id == dir.get('_id')){
                            // Fetch document's new contents from db
                            // TODO: Why doesn't backbone-couchdb automatically update the
                            //  model object for me when the asociated doc changes in the db?
                            dir.fetch({success:function(model,response){
                                
                                // Get directory's first page of content
                                if (dir.get('url_html') && 
                                        dir.get('get_url_html') == 'gotten'){
                                    var html = dir.get('url_html')
                                    // In the controller & output to form, handle whether this is an RSS feed or an HTML page
                                    // Determine whether url_html contains HTML or RSS
                                    if (html.indexOf("</html>") > -1){
                                        $("#directory_type").show(1000);
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
                                    $("#url_result_div").innerHTML = dir.get('pagetype');
                                    // TODO: Is this the right place to save the dir?
                                    //    https://blueprints.launchpad.net/reformedchurcheslocator/+spec/decide-whether-to-save-dir
                                    //dir.save({_id:dir.get('_id')})
                                }
                                
                                // Get state details page content
                                if (dir.get('state_url_html') && 
                                        dir.get('get_state_url_html') == 'gotten'){
                                    // Display the contents of the state page
                                    // TODO: This displays only one state's page.  Create a way
                                    //  to iterate through the other states' pages after getting
                                    //  a regex that works from this first state page.
                                    console.log(dir.get('state_url_html'))
                                    $('#cong_details_url_selector').html(dir.get('state_url_html')[0])
                                    // Show state details page div
                                    $("#cong_details_url, #cong_details_url_selector").show(1000);
                                    $('#cong_details_url_selector a').click(function(e){
                                        this.show_select_cong_details(e, this);
                                    });
                                    $("#url_result_div").innerHTML = dir.get('pagetype');
                                }
                            }})
                        }                                
                    })
                    watching_import_directory_view_changes = true;
                }
            },
            render: function(){
                config.render_to_id(this, "#import_directory_template")
            },
            events: {
                'keyup #url':"get_church_dir_from_url",
                'click #directory_type input': 'show_directory_type'
            },
            get_church_dir_from_url:function(){

                // Delay this to run after typing has stopped for 2 seconds, so we don't 
                //  send too many requests
                // TODO: Don't fire on every key event, but only once after delay.
                //  The way to do this is not via setTimeout, but probably something 
                //  like a while loop
                //setTimeout(function(){
    
                // Declare several utility functions for use further below
    
                function save_cgroup_and_dir(cgroup, dir){
                    // Save the dir so if the URL has changed in the browser, it gets 
                    //  updated in the db too
                    dir.save({
                                _id:dir.get('_id'), 
                                _rev:dir.get('_rev'),
                                url:$('#url').val(),
                                get_url_html:'requested'
                            },
                            {success:function(){
                        // Append dir to CGroup
                        cgroup.get('directories').add([{_id:dir.get('_id')}])
                        // Save cgroup to db
                        // TODO: Does the relation appear on the dir in the db also?
                        cgroup.save({_id:cgroup.get('_id'),_rev:cgroup.get('_rev')})
                        // This will trigger the Node changes listener's response
                    }})
                }
                
                function get_cgroup(dir){
                    // Make the dir available globally so it can be reused if the user causes
                    //  this function to be invoked again
                    window.dir = dir
                    var cgroup_name = $('#cgroup_name').val()
                    var abbr = $('#abbreviation').val()
                    // Don't do anything if the CGroup info isn't entered yet
                    if (cgroup_name != '' && abbr != ''){
                        // Check if cgroup already exists in db
                        // TODO: Consider whether this pattern can be refactored into a function,
                        //  because it seems we need to use it regularly.
                        //  - I put it into model.get_or_create_one()
                        // TODO: But in this case, the callback takes two arguments.  How can 
                        //  we handle different numbers of callback arguments?
                        // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/make-getorcreateone-handle-multiple-callback-args
                        model.get_one(model.CGroupsByAbbrOrName, 
                              [cgroup_name,abbr],
                              {success:function(cgroup){
                                  if (typeof(cgroup) === 'undefined'){
                                      // The cgroup didn't exist in the db, so create it
                                      // Create CGroup
                                      model.create_one(model.CGroups,
                                                       {
                                                           name:cgroup_name,
                                                           abbreviation:abbr
                                                       },
                                                       {success:function(cgroup){
                                                           save_cgroup_and_dir(cgroup, dir)
                                                       }}
                                      )
                                  }else{
                                      // The cgroup did exist in the db, so use it
                                      save_cgroup_and_dir(cgroup, dir)
                                  }
                              }})
                    }
                }
                
                // --------- Main code section begins here ----------
                
                // If we have already created a directory on this page, get it
                if (typeof(dir) === 'undefined'){
                    // The dir hasn't been created in the browser yet
                    // If the cgroup's associated directory exists in the db, get it
                    model.get_one(model.DirectoriesByURL, [$('#url').val()], {success:function(dir){
                        // If it does not exist in the db, then create it
                        if (typeof(dir) === 'undefined'){
                            // TODO: Don't create the dir if the URL is not valid.
                            //  Maybe mark the dir's URL as invalid in the node.js script (by
                            //  checking for a 404 response), and/or
                            //  just delete the dir from node.js in an asynchronous cleanup task.
                            // TODO: Provide a list of similar URLs in an autocompleter
                            // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/directoryimporter-url-autocompleter
                            model.create_one(model.Directories,
                                             {
                                                 url:$('#url').val(),
                                                 get_url_contents:'requested'
                                             },
                                             {success:function(dir){
                                                 // TODO: If the other form fields are empty, 
                                                 //     auto-populate them with info from this 
                                                 //     directory's cgroup to help the user
                                                 // TODO: Maybe only display those fields after 
                                                 //     the URL is filled in
                                                 //     https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cgroup-name-and-abbr-fields
                                                 get_cgroup(dir)
                                             }}
                            )
                        }else{
                            // It exists in the db, so use the existing dir
                            get_cgroup(dir)
                        }
                    }})
                }else{
                    // It already exists in the browser, so we're editing an already-created dir
                
                    get_cgroup(dir)
                }
                
                // TODO: Is this code needed anymore?
                // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/remove-cgroup-by-abbreviation-code
//                var cgroup = ''
//                // Query database by cgroup.abbreviation
//                // TODO: Turn this into a view in model.cgroup
//                // TODO: Run this when the abbreviation changes, rather than when the URL changes
//                //console.log(db)
//                db.view('rcl/cgroup-by-abbreviation', {
//                    keys:[$('#abbreviation').val()],
//                    include_docs:true,
//                    success:function(data){
//                        if (data.rows.length==1){
//                            // Get this cgroup from the db
//                            var cgroup = data.rows[0].doc
//                            // Populate page with this cgroup's data
//                            $('#cgroup_name').val(cgroup.name)
//                            $('#abbreviation').val(cgroup.abbreviation);
//                            create_dir(cgroup)
//                        }else if (data.rows.length > 1){
//                            // Report error
//                            console.log("Error:  More than one copy of this cgroup's settings are found in the database.")
//                        }else if (data.rows.length==0){
//                            // Otherwise, create that cgroup
//                            var cgroup = {
//                                          type:   'cgroup',
//                                          name:   $('#cgroup_name').val(),
//                                          abbreviation:   $('#abbreviation').val()
//                            }
//                            db.saveDoc(cgroup,{
//                                success:function(data){
//                                    cgroup.id = data._id
//                                    create_dir(cgroup)
//                                }
//                            })
//                        }
//                    }
//                })
            },
            hide_dir_and_display_type:function(){
                $('#dir_and_display_type').hide(1000)
            },
            hide_subform:function(){
                $("#directory_type, #rss_feed, #cong_details, #state_page, #church_directory_page").hide(1000);
            },
            show_directory_type:function(){
                var type = $('input:radio[name=type]:checked').val();
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
                    $('#state_drop_down_selector').html(dir.get('url_html'));
                    // We bind the event here because the select element didn't exist at this Backbone view's 
                    //  initialization
                    $('#state_drop_down_selector select').mousedown({this_ob:this},function(event){ event.data.this_ob.show_state_page(event)})
                }
                this.hide_dir_and_display_type()
            },
            show_state_page:function(event){
                // Get the list of state page URLS out of its option values
                // That is a bit challenging, because the format may be different for each directory.
                // So, I think we need a regular expression editor here.
                // TODO: Get the select box via a user's click, and record its xpath so it can be found later.
                // TODO: Get the user to confirm that this select box is found by that xpath
                // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/user-confirm-correct-select-box
                // TODO: Disable the select box immediately after the user clicks on it, so they can't 
                //          click on one of its options and fire a page load event.
                var el = $(event.target),
                    options = $(el).children(),
                    values = [];
                for (var i=0; i<options.length; i++){
                    values[i] = $(options[i]).val();
                }
                dir.set('state_page_values', values)
                // Get cong data from a URL like this:  http://opc.org/locator.html?state=WA&search_go=Y
                // TODO: But, this URL only works for the OPC site, so we'll have to generalize this code
                //          to work for other sites too.
                // https://blueprints.launchpad.net/reformedchurcheslocator/+spec/generalize-state-page-url-creation
                // TODO: Maybe the way to do that is to ask the user to confirm or enter what the URL is
                //          for an example state page ("To what URL does this link normally lead? 
                //          <input type='text' />")
                //          and to enter what other URL or POST parameters are necessary to make that page
                //          load a state correctly,
                //          and ask the user what the parameter name is for which the state drop-down box
                //          provides a value.
                // Get only the first state name for now
                for (var i=0; i<values.length; i++){

                    if (values[i] !== ""){
                        var state_name = values[i];
                        break;
                    }
                }
                dir.save({
                    state_url:'http://opc.org/locator.html?state={state_name}&search_go=Y',
                    get_state_url_html:'requested',
                    state_url_html:''
                    },
                    {
                        success:function(){
                            // Hide divs we don't need now
                            $("#state_page, #url_and_display_type, #directory_type, #cong_details_fields_selector").hide(1000);
                        }
                    }
                )
                //TODO else notify user that they did not click into a select element
            } 
        })
        return ImportDirectoryView

});