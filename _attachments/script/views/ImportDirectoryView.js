define(
   [
    '../config',
    '../model'
    ], 
    function(config, model){

        var ImportDirectoryView = Backbone.View.extend({
            initialize : function(){
                db = config.db
            },
            render: function(){
                config.render_to_id(this, "#import_directory_template")
            },
            events: {
                'keyup #url':"get_church_dir_from_url",
                'click #directory_type input': 'show_directory_type'
            },
            get_church_dir_from_url:function(){
                // TODO: Rewrite this for Backbone
                var elem = $('#url'),
                // TODO: do we need config here anymore?
                //          config = $$(this).app.require('config'),
                    CGroup = model.CGroup,
                    Directory = model.Directory,
                    Cong = model.Cong,
                    CGroup = model.CGroup
    
                // Delay this to run after typing has stopped for 2 seconds, so we don't send too many requests
                // TODO: Don't fire on every key event, but only once after delay.
                //          The way to do this is not via setTimeout, but probably something like a while loop
                //setTimeout(function(){
    
                // Declare several utility functions for use further below
    
                function populate_dir(cgroup){
                    // Populate directory with new data from page
                    if (dir.cgroup_id === undefined) {
                        dir.cgroup_id = cgroup.id
                    }
                    // Check to see whether any directory already uses the URL the user is entering, 
                    //  and if it is present, load its settings from the database and enter them into the form.
                    // TODO: Later, instantiate the CouchAppObject instance here, and have it load data from
                    //  the db automatically.
                    dir.url = $('#url').val();
                    dir.get_url_contents = true // triggers changes_listener.js
                    // TODO: Should we do a fuzzy search or autocomplete, to get the user to pick the 
                    //  right cgroup?
    
                    // Save request to get contents of URL to database
                    // TODO: Move the rev-checking and object syncing code below into CouchAppObject.js
                    // Get current object from db
                    //console.log(dir)
                    if (dir._id){
                        // We've already gotten this dir out the db
                        db.openDoc(dir._id, {
                            success:function(doc){
                                // Save rev for after merge
                                var rev = doc._rev
                                // Merge browser's copy of dir with db copy, retaining URL from browser
                                $.extend(doc, dir)
                                // restore rev
                                doc._rev = rev
                                dir = doc
                                // Save new doc to db
                                db.saveDoc(dir, {
                                    success:function(msg){
                                        // Set the local copy of the directory's new _rev
                                        dir._rev = msg.rev
                                        // Watch for Node changes listener's response
                                        var changes = db.changes();
                                        changes.onChange(function(change){
                                            // Determine if the changed document is the one we are editing 
                                            var change_id = change.results[0].id
                                            if (change_id == dir._id){
                                                // Get document by id
                                                db.openDoc(change_id, {
                                                    success:function(doc){
                                                        // Put new dir from db into memory
                                                        // TODO: This should set dir._rev to the rev in the db, but doesn't,
                                                        //  so it causes a doc update conflict in the browser
                                                        dir = doc;
                                                        // if the new doc has a value for url_html
                                                        if (dir.url_html){
                                                            // In the controller & output to form, handle whether this is an RSS feed or an HTML page
                                                            // Determine whether url_html contains HTML or RSS
                                                            if (dir.url_html.indexOf("</html>") > -1){
                                                                $("#directory_type").show(1000);
                                                                $("#rss_feed").hide(1000);
                                                                dir.pagetype = 'html';
                                                            }
                                                            else if (dir.url_html.indexOf("</rss>") > -1){
                                                                // TODO: Display the right form controls for an RSS page
                                                                $("#directory_type").hide(1000);
                                                                $("#rss_feed").show(1000);
                                                                dir.pagetype = 'rss';
                                                            }
                                                            else { // We got an error code
                                                                // Hide the form controls.
                                                                elem.trigger('hide_subform');
                                                            }
                                                            $("#url_result_div").innerHTML = dir.pagetype;
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                        // TODO:  I'm a little confused.  Because changes.onChange is asynchronous, do we need
                                        //  changes.stop() here?
                                        //changes.stop();
                                    }
                                })
                            }
                        })
                    }
                }
    
    
                function create_dir(cgroup){
                    // Create directory if it does not exist in the browser's memory
                    if (typeof dir === 'undefined'){
                        // Get directory doc from db if it exists there
                        var url = $('#url').val()
                        // TODO: Move this into model.cgroup
                        db.view('rcl/directories-by-url', {
                            startkey:url,
                            endkey:url,
                            include_docs:true,
                            success:function(data){
                                dir = {}
                                if (data.rows.length>1){
                                    // TODO: Throw an error or handle the problem that this
                                    // directory
                                    // has multiple entries
                                    console.log("Error:  More than one copy of this directory's settings are found in the database.")
                                }else if (data.rows.length==1){
                                    // We found the right directory
                                    // Populate dir object from db
                                    dir = data.rows[0].doc
                                }else{
                                    // Create new directory document from here
                                    dir = {type:'directory'};
                                }
                                dir.url = url
                                populate_dir(cgroup)
                            }
                        })
                    }else{
                        // Use existing directory object in browser's memory
                        populate_dir(cgroup)
                    }
                }
                function create_cgroup(dir){
                    console.log(dir)
                    // Start here
                    var cgroup_name = $('#cgroup_name').val()
                    var abbr = $('#abbreviation').val()
                    if (cgroup_name != '' && abbr != ''){
                        
                    }
                    // TODO: Don't do anything if the CGroup info isn't entered yet
                    // TODO: Create CGroup
                    // TODO: Append dir to CGroup
                }
                // If the associated directory exists in the db, get it
                model.get_one(model.DirectoriesByURL, [$('#url').val()], {success:function(dir){
                    // If it does not exist, then create it
                    if (typeof(dir) === 'undefined'){
                        // TODO: Don't create the dir if the URL is not valid.
                        //  Maybe mark the dir's URL as invalid in the node.js script, and/or
                        //  just delete the dir from node.js.
                        // TODO: Provide a list of similar URLs in an autocompleter
                        dir = directories.create({
                            url:$('#url').val()
                        }, {success:function(dir){
                            // TODO: If the other form fields are empty, auto-populate them
                            //  with info from this directory's cgroup to help the user
                            // TODO: Maybe only display those fields after the URL is filled in
                            create_cgroup(dir)
                        }})
                    }else{
                        create_cgroup(dir)
                    }
                }})
                var cgroup = ''
                    // Query database by cgroup.abbreviation
                    // TODO: Turn this into a view in model.cgroup
                    // TODO: Run this when the abbreviation changes, rather than when the URL changes
                    //console.log(db)
                    db.view('rcl/cgroup-by-abbreviation', {
                        keys:[$('#abbreviation').val()],
                        include_docs:true,
                        success:function(data){
                            if (data.rows.length==1){
                                // Get this cgroup from the db
                                var cgroup = data.rows[0].doc
                                // Populate page with this cgroup's data
                                $('#cgroup_name').val(cgroup.name)
                                $('#abbreviation').val(cgroup.abbreviation);
                                create_dir(cgroup)
                            }else if (data.rows.length > 1){
                                // Report error
                                console.log("Error:  More than one copy of this cgroup's settings are found in the database.")
                            }else if (data.rows.length==0){
                                // Otherwise, create that cgroup
                                var cgroup = {
                                              type:   'cgroup',
                                              name:   $('#cgroup_name').val(),
                                              abbreviation:   $('#abbreviation').val()
                                }
                                db.saveDoc(cgroup,{
                                    success:function(data){
                                        cgroup.id = data._id
                                        create_dir(cgroup)
                                    }
                                })
                            }
                        }
                    })
            },
            hide_dir_and_display_type:function(){
                $('#dir_and_display_type').hide(1000)
            },
            hide_subform:function(){
                $("#directory_type, #rss_feed, #cong_details, #state_page, #church_directory_page").hide(1000);
            },
            show_directory_type:function(){
                var type = $('input:radio[name=type]:checked').val();
                var elem = $(this)
                // TODO: Why doesn't this allow the other radio button to be selected once one button is selected?
                if (type=='one page'){
                    // Show the one page divs
                    $("#state_page").hide(1000);
                    // TODO: If "One Page" is selected, then show page containing list of all congs.
                    dir.display_type = type;
                }
                //  If "One state per page" is selected, then drop down box showing state options.
                if (type=='one state per page'){
                    // Show the state page divs
                    $("#state_page").show(1000);
                    dir.display_type = type;
                    // Populate state_drop_down_selector div with contents of church directory page, 
                    //  maybe in a scrollable div
                    $('#state_drop_down_selector').html(dir.url_html);
                    // We bind the event here because the select element didn't exist at this Evently widget's 
                    //  initialization
                    $('#state_drop_down_selector select').mousedown(function(){elem.trigger('show_state_page')})
                }
                elem.trigger('hide_dir_and_display_type')
            },
            show_state_page:function(){
                // Get the list of state page URLS out of its option values
                // That is a bit challenging, because the format may be different for each directory.
                // So, I think we need a regular expression editor here.
                // TODO: Get the select box via a user's click, and record its xpath so it can be found later.
                // TODO: Get the user to confirm that this select box is found by that xpath
                // TODO: Disable the select box immediately after the user clicks on it, so they can't 
                //          click on one of its options and fire a page load event.
                var el = $(this),
                db = $$(this).app.require('db').db,
                options = $(el).children(),
                values = [];
                for (var i=0; i<options.length; i++){
                    values[i] = $(options[i]).val();
                }
                dir.state_page_values = values;
                // Get cong data from a URL like this:  http://opc.org/locator.html?state=WA&search_go=Y
                // TODO: But, this URL only works for the OPC site, so we'll have to generalize this code
                //          to work for other sites too.
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
                dir.state_url = 'http://opc.org/locator.html?state=' + state_name + '&search_go=Y'
                db.saveDoc(dir, {
                    success:function(msg){
                        // Display the contents of the state page
                        db.openDoc(msg.id, {
                            success:function(doc){
                                // Hide divs we don't need now
                                $("#state_page, #url_and_display_type, #directory_type, #cong_details_fields_selector").hide(1000);
                                $('#cong_details_url_selector').html(doc.state_url_html)
                                // Show state details page div
                                $("#cong_details_url, #cong_details_url_selector").show(1000);
                                $('#cong_details_url_selector a').click(function(e){
                                    show_select_cong_details(e, this);
                                });
                            }
                        })
                    }
                })
                //TODO else notify user that they did not click into a select element
            } 
        })
        return ImportDirectoryView

});