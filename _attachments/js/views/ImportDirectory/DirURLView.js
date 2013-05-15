define([
        '../../config',
        '../../model',
        '../../vendor/mustache',
        'text!views/ImportDirectory/DirURL.html',
        './DirTypeView'
        ], 
        function(config, model, Mustache, template, DirTypeView){
    
    var DirURLView = Backbone.View.extend({
        initialize:function(){
            // Make it easy to reference this object in event handlers
            _.bindAll(this)
        },
        render: function(){
            $('#steps').html(Mustache.render(template))
            this.delegateEvents()
        },
        events: {
            'keyup #url':'get_church_dir_from_url'
        },
        get_church_dir_from_url:function(event){
            // Delay this to run after typing has stopped for 2 seconds, so we don't
            //  send too many requests
            // TODO: Don't fire on every key event, but only once after delay.
            //  The way to do this is probably with a recursive function that checks 
            //  the time elapsed, then runs setTimeout
            //setTimeout(function(){

            // Declare several utility functions for use further below
            function save_cgroup_and_dir(cgroup, dir){
                // Save the dir so if the URL has changed in the browser, it gets
                //  updated in the db too
                var iterations = 0
                // Note this is a recursive function!
                // TODO: Consider refactoring this into a separate function
                function save_dir(cgroup, dir){
                    iterations++;
                    // Make this function wait until this rev is not being saved anymore under any other event
                    if (typeof window.app.import_directory_view.rev_currently_being_saved !== 'undefined' &&
                        window.app.import_directory_view.rev_currently_being_saved === dir.get('_rev')){
                        setTimeout(function(){ save_dir(cgroup, dir) }, 1000)
                        return;
                    }
                    dir.fetch({success:function(dir, response, options){
                        var get_url_html = dir.get('get_url_html')
                        // Prevent import from running multiple times simultaneously
                        if (get_url_html != 'getting'){
                            get_url_html = 'requested'
                        }
                        // Only save this revision if it's not currently being saved already
                        if (typeof window.app.import_directory_view.rev_currently_being_saved === 'undefined' || 
                                window.app.import_directory_view.rev_currently_being_saved !== dir.get('_rev')){
                            // console.log(iterations + ' 196 saving', dir.get('_rev'))
                            // Prevent saving the same revision twice simultaneously
                            if (typeof window.app.import_directory_view.rev_currently_being_saved === 'undefined'){
                                window.app.import_directory_view.rev_currently_being_saved = dir.get('_rev')
                            }
                            dir.save({
                                    _id:dir.get('_id'),
                                    _rev:dir.get('_rev'),
                                    url:$('#url').val(),
                                    get_url_html:get_url_html
                                },
                                {
                                    success:function(){
                                        // Report that it's OK for other calls to save_dir to run
                                        delete window.app.import_directory_view.rev_currently_being_saved
                                        // Append dir to CGroup
                                        cgroup.get('directories').add([{_id:dir.get('_id')}])
                                        // Save cgroup to db
                                        // TODO: Does the relation appear on the dir in the db also?
                                        // This will trigger the Node changes listener's response
                                        cgroup.save({_id:cgroup.get('_id'),_rev:cgroup.get('_rev')},{success:function(){
                                            // Render DirTypeView
                                            $('#steps').hide()
                                            this.dir_type_view  = new DirTypeView({el: '#steps'})
                                            this.dir_type_view.render()
                                            $('#steps').fadeIn(2000)
                                        }})
                                    },
                                    error:function(model, xhr, options){
                                        console.error('We got the 196 error '+ iterations)
                                        save_dir(cgroup, dir)
                                    }
                                }
                            )
                        }
                    }})
                }
                save_dir(cgroup, dir)
            }
            function get_cgroup(dir){
                // Make the dir available globally so it can be reused if the user causes
                //  this function to be invoked again
                // Reset status flag so the status messages will display
                dir.set('get_state_url_html', '')
                var cgroup_name = $('#cgroup_name').val()
                var abbr = $('#abbreviation').val()
                // Don't do anything if the CGroup info isn't entered yet
                if (cgroup_name !== '' && abbr !== ''){
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
                        }}
                    )
                }
            }
            
            // --------- Main code section begins here ----------
            
            // If we have already created a directory on this page, get it
            if (typeof(window.app.dir) === 'undefined'){
                // The dir hasn't been created in the browser yet
                // If the cgroup's associated directory exists in the db, get it
                var page_url = $('#url').val()
                model.get_one(model.DirectoriesByURL, [page_url], {success:function(dir){
                //model.get_one(model.DirectoriesByURL, [$('#url').val()], {success:function(dir){
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
                                             url:page_url,
                                             get_url_html:'requested'
                                         },
                                         {success:function(dir){
                                             // TODO: If the other form fields are empty,
                                             //     auto-populate them with info from this
                                             //     directory's cgroup to help the user
                                             // TODO: Maybe only display those fields after
                                             //     the URL is filled in
                                             //     https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cgroup-name-and-abbr-fields
                                             window.app.dir = dir
                                             get_cgroup(dir)
                                         },error:function(){
                                            console.error('Could not create_one')
                                         }}
                        )
                    }else{
                        // It exists in the db, so use the existing dir
                        window.app.dir = dir
                        get_cgroup(dir)
                    }
                },error:function(){
                    console.error('Could not get_one')
                }})
            }else{
                // It already exists in the browser, so we're editing an already-created dir
                get_cgroup(window.app.dir)
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
        }

    });
    return DirURLView;

});
