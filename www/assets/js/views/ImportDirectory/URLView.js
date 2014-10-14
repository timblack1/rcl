define([
        'config',
        'model',
        'mustache',
        'text!views/ImportDirectory/URL.html',
        './DirTypeView',
        './CGroupView',
        './GeocodeStatsView',
        'typeahead'
        ], 
        function(config, model, Mustache, template, DirTypeView, CGroupView, GeocodeStatsView){

    return Backbone.View.extend({
        initialize:function(){
            // Make it easy to reference this object in event handlers
            _.bindAll(this, 'changes_listeners', 'handle_404', 'got_url_data', 'got_batchgeo_map_html', 'got_json',
                'get_church_dir_from_url', 'notify_user_of_bad_url', 'get_cgroup', 
                'save_cgroup_and_dir', 'save_dir', 'parse_json', 'process_batch_geo', 'get_batchgeo_json', 
                'batchgeo_parse_json', 'report_url_is_valid', 'got_importio_auth',
                'importio_drop_target_dragover', 'importio_drop_target_drop', 'clicked_intial_radios');
        },
        render: function(){
            $('#steps').html(Mustache.render(template));
            this.delegateEvents()
            // Render typeahead for URL textbox
            // Render typeahead
            // TODO: Consider filtering and sorting by levenshtein distance
            var substringMatcher = function(strs) {
              return function findMatches(q, cb) {
                var matches, substrRegex;

                // an array that will be populated with substring matches
                matches = [];

                // regex used to determine if a string contains the substring `q`
                substrRegex = new RegExp(q, 'i');

                // iterate through the pool of strings and for any string that
                // contains the substring `q`, add it to the `matches` array
                $.each(strs, function(i, str) {
                  if (substrRegex.test(str)) {
                    // the typeahead jQuery plugin expects suggestions to a
                    // JavaScript object, refer to typeahead docs for more info
                    matches.push({ value: str });
                  }
                });

                cb(matches);
              };
            };
            // Get array of directories from model
            this.directories = new model.Directories()
            this.directories.fetch()
            this.$('#url').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            },{
                name: 'directories',
                displayKey: 'value',
                source: substringMatcher(this.directories.pluck('url'))
            })
            // On option selection event, get URL data
            this.$('#url').on('typeahead:selected', this.get_church_dir_from_url)
        },
        events: {
            'keyup #url':'get_church_dir_from_url',
            'change .user_guid': 'got_importio_auth',
            'change .api_key': 'got_importio_auth',
            'dragover .importio_drop_target': 'importio_drop_target_dragover',
            'dragenter .importio_drop_target': 'importio_drop_target_dragover',
            'dragleave .importio_drop_target': 'importio_drop_target_dragleave',
            'dragexit .importio_drop_target': 'importio_drop_target_dragleave',
            'drop .importio_drop_target': 'importio_drop_target_drop',
            'click .initial_radios': 'clicked_intial_radios',
            'change .cgroup_name': 'associate_cgroup',
            'keyup .cgroup_name': 'associate_cgroup'
        },
        changes_listeners:function(){
            // Different types of changes that need to be handled
            this.listenTo(this.model,{
                'change':this.handle_404,
                'change:get_batchgeo_map_html':this.got_batchgeo_map_html,
                'change:get_json':this.got_json
            })
        },
        clicked_intial_radios:function(){
            // Display whichever set of form elements fit with the radio button that was clicked
            var checked_val = this.$('.initial_radios input[name=optionsRadios]:checked').val()
            if (checked_val == 'importio_json'){
                this.$('.url-group').removeClass('show').addClass('hidden')
                this.$('.importio-group').removeClass('hidden').addClass('show')
                this.$('.cgroup_div').hide(1000)
            }else if (checked_val == 'url_or_guid'){
                this.$('.importio-group').removeClass('show').addClass('hidden')
                this.$('.url-group').removeClass('hidden').addClass('show')
                this.$('.cgroup_div').hide(1000)
            }
        },
        handle_404:function(model, value, options){
            // TODO: Don't load the new view yet if the status code returned from the URL is a 404;
            //  Instead after the delay, notify the user with
            //  "Is that URL correct?  It returns a '404 page not found' error."
        },
        importio_drop_target_dragover:function(event){
            event.stopPropagation()
            event.preventDefault()
            this.$('.importio_drop_target').addClass('dragover')
        },
        importio_drop_target_dragleave:function(event){
            event.stopPropagation()
            event.preventDefault()
            this.$('.importio_drop_target').removeClass('dragover')
        },
        importio_drop_target_drop:function(event){
            event.stopPropagation()
            event.preventDefault()
            // Report provisional status to user
            var delay = 6000
            this.$('.importio_drop_target')
                .removeClass('dragover')
                .addClass('dropped', 200)
                .text('Got the file!')
                .fadeOut(delay)
            var thiz = this
            window.setTimeout(function(){
                thiz.$('.importio_drop_target')
                    .removeClass('dropped')
                    .text('Drop JSON file here')
                    .fadeIn(2000)
                // TODO: Fire displaying next form fields here as needed
                // TODO: Get the directory's identity from the cong URLs
                // TODO: Display the form to edit the directory's name
                // TODO: Display a stats view to notify the user of the following stats:
                //  running total: X congs have been imported successfully
                //  event: All congs' data have been imported
                //  running total: X congs have been geocoded successfully
                //  event: All congs' data have been geocoded successfully
                //  event: X congs failed geocoding (offer link to view the details)
            }, delay)
            // Prepare dirs, cgroups for determining whether this file's dir, cgroup is already in the database
            this.cgroups = new model.CGroups
            this.cgroups.fetch()
            this.directories = new model.Directories
            this.directories.fetch()
            this.congs = new model.Congs
            this.congs.fetch()
            // Render stats view here
            this.geocode_stats_view = new GeocodeStatsView({
                collection:this.congs,
                el:this.$('.geocode_stats')
            })
            this.geocode_stats_view.render()
            this.geocode_stats_view.$el.removeClass('hidden').hide().show(1000)
            // Get file contents here
            var dt = event.originalEvent.dataTransfer;
            var files = dt.files;
            var reader = new FileReader()
            reader.addEventListener('load', function loadEnd(){
                json = reader.result
                var congs_obj = JSON.parse(json)
                // Determine if this import.io data source is already in a directory in the database
                var importio_guid = congs_obj.data[0]._source[0]
                thiz.dir = thiz.directories.where({importio_guid:importio_guid})[0]
                if (!thiz.hasOwnProperty('dir')){
                    // Create new dir
                    thiz.dir = thiz.directories.create({
                        importio_guid:importio_guid
                    })
                }
                // TODO: Does this fetch the related cgroup correctly?  Or do I need to call 
                //  thiz.dir.get('cgroup').fetch() as someone recommended on StackOverflow?
                $.when(thiz.dir.fetchRelated('cgroup')).done(function done_fetching_cgroup(){
                    // Handle case where this cgroup doesn't exist yet
                    thiz.cgroup = thiz.dir.get('cgroup');
                    if (!thiz.hasOwnProperty('cgroup') || thiz.cgroup == null){
                        thiz.cgroup = thiz.cgroups.create({})
                        // Associate this cgroup with this directory
                        thiz.dir.set('cgroup', thiz.cgroup)
                        thiz.dir.save()
                    }
                    // Create the CGroupView
                    thiz.cgroup_view = new CGroupView({
                        model:thiz.cgroup,
                        el:thiz.$('.cgroup_div')
                    })
                    // Display the associated cgroup for the user to edit
                    thiz.cgroup_view.render()
                    thiz.cgroup_view.$el.hide().show(2000)
                    // Fetch congs to compare them with the new cong data
                    thiz.congs.fetch({success:function(){
                        // Iterate through list of new cong data
                        // Note: The attribute which contains the list of cong data objects is called congs_obj.data
                        _.each(congs_obj.data, function(cong, index, list){
                            // Note: Most attributes contain lists.
                            // So if an attribute is a list is longer than 1 item, join the items together with <br />
                            var new_cong = {}
                            var cong_template = new model.Cong
                            // Import only the fields we want in our model
                            _.each(cong_template.default_attributes, function handle_attribute(value, key){
                                // Only join if it is of type = array
                                new_cong[key] = Array.isArray(cong[key]) ? cong[key].join('<br />') : cong[key]
                            })
                            new_cong.contact_email = (new_cong.hasOwnProperty('contact_email') && typeof new_cong.contact_email !== 'undefined') ?
                                new_cong.contact_email.replace('mailto:','') : ''
                            // data[n]._pageUrl contains the cong's unique database id in the URL.  Note that we save this attribute since
                            //  it is useful for identifying the cong and data source uniquely if we need to search for it or sync it.
                            new_cong.page_url = cong._pageUrl
                            // Get cong's database id from OPC.org
                            if (new_cong.page_url.indexOf('opc.org') !== -1){
                                new_cong.source_cong_id = new_cong.page_url.match(/=(\d+?)$/)[1]
                                // Note that data[n].name is in ALLCAPS!!  So change to capitalize only the first 
                                //  character of each word.
                                new_cong.name = new_cong.name.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
                            }
                            // Write this cong to a Backbone_hoodie model, and save to database
                            // Find out whether this model exists in the congs collection
                            var cong_model = thiz.congs.findWhere({page_url:new_cong.page_url})
                            if (typeof cong_model !== 'undefined'){
                                // Cong already exists in the collection, so write new attributes
                                cong_model.save(new_cong)
                            }else{
                                // Cong didn't exist in the collection, so create a new one
                                var cong_model = thiz.congs.create(new_cong)
                            }
                            // Associate this cong with its cgroup
                            cong_model.get('cgroups').add(thiz.cgroup)
                            cong_model.set('denomination_abbr', thiz.cgroup.get('abbreviation'))
                            cong_model.save()
                        })
                    }})                    
                })
            })
            reader.readAsText(files[0])
        },
        got_importio_auth:function(){
            // Check to see if both form fields have  been filled
            var user_guid = this.$('.user_guid').val()
            var api_key = this.$('.api_key').val()
            if (user_guid.length > 0 && api_key.length > 0){
                // Configure the library
                importio.init({
                    "auth": {
                        "userGuid": user_guid,
                        "apiKey": api_key
                    },
                    "host": "import.io"
                });
                // Execute the query
                var query = {"input":{"input":"query"},"connectorGuids":[this.$('#url').val()]};
                importio.query(query, {
                  "data": function(data) {
                    //console.log("Data received", data);
                  }
                });
                // TODO: Get the connector's metadata
//                 var auth_data = {
//                     "auth": {
//                         "userGuid": user_guid,
//                         "apiKey": api_key
//                     }
//                 }
                var auth_data = {
                    "userGuid": user_guid,
                    "apiKey": api_key
                }
                // TODO: It seems I'd have to get the cookies right to authorize this request.
                //  Here is info on how to get it right:  http://blog.import.io/tech-blog/download-data-over-the-api
                $.get('https://api.import.io/store/connector/' + this.$('#url').val(), auth_data, function(data){
                    // Get the _attachment/snapshot
                    $.get('https://api.import.io/store/connector/' + this.$('#url').val() + 
                        '/_attachment/snapshot/' + data.snapshot, auth_data, function(data_set){
                            console.log('data_set: ', data_set)
                        })
                })
            }
        },
        got_url_data:function(){
            // Handle directory's first page of content
            var data = this.model.get('url_data')

            // Determine whether this URL's data is HTML, RSS, KML, or JSON

            if (data.indexOf("</html>") > -1 || data.indexOf("</HTML>") > -1){
                console.log('We got HTML')
                this.model.set('pagetype', 'html')
                // Determine what type of directory this is
                // batchgeo
                if (this.uses_batch_geo(data) === true && 
                    typeof this.model.get('get_batchgeo_map_html') == 'undefined' &&
                    typeof this.model.get('get_json') == 'undefined'){
                    this.process_batch_geo(data)
                }else{
                    // TODO: If the other form fields are empty,
                    //     auto-populate them with info from this
                    //     directory's cgroup to help the user
                    // TODO: Maybe only display those fields after
                    //     the URL is filled in
                    //     https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cgroup-name-and-abbr-fields
                }
            }
            else if (data.indexOf("</rss>") > -1){
                console.log('We got RSS')
                // TODO: Display the right form controls for an RSS feed
                this.model.set('pagetype', 'rss')
            }
            else if (data.indexOf("<kml") > -1){
                console.log('We got KML')
                // TODO: Display the right form controls for a KML feed
                this.model.set('pagetype', 'kml')
            }
            else if (data.indexOf("per = {") === 0){
                // batchgeo format
                console.log('We got batchgeo JSON')
                this.model.set('pagetype', 'batchgeo_json')
            }
            else if (data.indexOf("{") === 0){
                console.log('We got JSON')
                this.model.set('pagetype', 'json')
                // TODO: The RPCNA's data is in a JSON file in RCL format already at http://reformedpresbyterian.org/congregations/json
                this.parse_json()
            }
            else { // We got an error code
                // TODO: Report this to the user, including what error code we got
                this.notify_user_of_bad_url('We got an error code from this URL:' + this.model.get('url'))
            }
            // TODO: Is this the right place to save the dir?
            //    https://blueprints.launchpad.net/reformedchurcheslocator/+spec/decide-whether-to-save-dir
            //this.model.save({_id:this.model.get('_id')})
        },
        got_batchgeo_map_html:function(model, value, options){
            // Handle batchgeo map page
            if (typeof this.model.get('batchgeo_map_html') !== 'undefined' && 
                this.model.get('get_batchgeo_map_html') == 'gotten'){
                this.get_batchgeo_json()
            }
        },
        got_json:function(model, value, options){
            // Handle JSON
            if (typeof this.model.get('json') !== 'undefined' && 
                this.model.get('get_json') == 'gotten'){
                var json = this.model.get('json')
                // Batchgeo JSON
                if (json.indexOf('per = {') === 0){
                    this.batchgeo_parse_json()
                }
            }
        },
        delay:(function(){
          var timer = 0;
          return function(callback, ms){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
          };
        })(),
        get_church_dir_from_url:function(event){
            var thiz = this
            // Delay this to run after typing has stopped for a bit, so we don't
            //  send too many requests
            this.delay(function(){
                
                // --------- Main code section begins here ----------
                
                    // TODO: Start here.  Decide what sub-views to create out of this view, and under what conditions
                    //  to display them.
                    /* Steps:
                        Event handler:  Wait for $('#url') to change
                        Enter URL.
                        Event handler:  Test URL to see if it is one of the following:
                                Regular HTML page > display directory name, abbreviation inputs
                                Batchgeo URL > import batchgeo JSON > report
                                RPCNA JSON feed > import feed > report
                                Arbitrary RSS or JSON > display field matching interface
                    */
                
                var page_url = thiz.$('#url').val()
                // TODO: Test for whether this is an import.io connector GUID
                if (page_url.indexOf('http') === -1 && page_url.length === 36){
                    // This is an import.io connector GUID, so display the form elements for entering 
                    //  login info
                    thiz.$('.importio_auth_div').show(1000)
                    thiz.report_url_is_valid()
                }else{
                    // Verify that the URL is in a correct format
                    var myRegExp =/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
                    if (!myRegExp.test(page_url)){
                        // URL is not valid, so don't create the dir
                        thiz.notify_user_of_bad_url('This GUID or URL is not valid')
                    }else{
                        // URL is valid, so
                        // Get HTML from URL and save it in the model
                        hoodie.task.start('http-get', { url: page_url }).done(function(task){
                            // If we have not already created a directory on this page, create it; else get the existing directory
                            thiz.model = thiz.directories.findWhere({url:page_url})
                            if (!thiz.hasOwnProperty('model')){
                                // The dir hasn't been created yet, so create it
                                thiz.model = new model.Directory({url:page_url})
                            }
                            // Create changes listeners on this.model
                            thiz.changes_listeners()
                            // TODO: If the cgroup's associated directory exists in the db, get it
                            thiz.get_cgroup()
                            // Add url_html to thiz.model, and save thiz.model
                            thiz.model.set('url_data', task.data)
                            thiz.model.save()
                            thiz.report_url_is_valid()
                            // Trigger next form elements to display
                            console.log('Start here')
                            thiz.got_url_data();
                            // TODO: If the other form fields are empty,
                             //     auto-populate them with info from this
                             //     directory's cgroup to help the user
                             // TODO: Maybe only display those fields after
                             //     the URL is filled in
                             //     https://blueprints.launchpad.net/reformedchurcheslocator/+spec/display-cgroup-name-and-abbr-fields
                        }).fail(function(error){
                            thiz.notify_user_of_bad_url('Is that URL correct?  It returns a "404 page not found" error.  Please enter a valid URL.')
                        })
                    }                    
                }
            }, 500)
        },
        report_url_is_valid:function(){
            // Report that this URL is valid
            this.$('.help-block')
                .text('')
                .fadeOut(2000)
                .removeClass('text-danger')
            this.$('.url-group')
                .removeClass('has-error')
                .addClass('has-success has-feedback');
        },
        notify_user_of_bad_url:function(msg){
            // Notify the user that we got a 404
            this.$('.url-group')
                .removeClass('has-success')
                .addClass('has-error has-feedback');
            this.$('.help-block')
                .addClass('text-danger')
                .text(msg)
                .fadeIn(2000)
        },
        get_cgroup:function(){
            var thiz = this
            this.$('.cgroup_div').removeClass('hidden').hide().show(2000)
            this.$('.cgroup_name').focus()
            console.log('Start here for hoodie integration')
            var cgroup_name = $('#cgroup_name').val()
            var abbr = $('#abbreviation').val()
            // Don't do anything if the CGroup info isn't entered yet
            if (cgroup_name !== '' && abbr !== ''){
                // Check if cgroup already exists in db
                var search_keys = [cgroup_name, abbr]
                var attrs = this.model.attributes
                model.CGroupsByAbbrOrName.get_or_create_one(search_keys, attrs, {success:function(cgroup){
                    thiz.cgroup = cgroup
                    thiz.save_cgroup_and_dir()
                }})
            }
        },
        save_cgroup_and_dir:function(){
            // Save the dir so if the URL has changed in the browser, it gets
            //  updated in the db too
            this.iterations = 0
            // Note this is a recursive function!
            this.save_dir()
        },
        save_dir:function(){
            console.log('Start here')
            // TODO: Start here.  Set up changes listener on this.model to handle responses from node_changes_listener.js
            //  Maybe put the changes listener up in this.get_cgroup() after refactoring this.save_dir() so it uses 
            //  that changes listener and so this.iterations isn't needed anymore.
            // Event: This function gets called when:
            //  Stack (last at top):
            //      save_dir
            //      save_cgroup_and_dir
            //      get_cgroup
            //      get_church_dir_from_url
            //      [URL entered]
            var thiz = this
            this.iterations++;
            // Make this function wait until this rev is not being saved anymore under any other event
            if (typeof window.app.import_directory_view.rev_currently_being_saved !== 'undefined' &&
                window.app.import_directory_view.rev_currently_being_saved === thiz.model.get('_rev')){
                setTimeout(function(){ thiz.save_dir() }, 1000)
                return;
            }
            this.model.fetch({success:function(model, response, options){
                var get_url_html = thiz.model.get('get_url_html')
                // Prevent import from running multiple times simultaneously
                if (get_url_html != 'getting'){
                    get_url_html = 'requested'
                }
                // Only save this revision if it's not currently being saved already
                if (typeof window.app.import_directory_view.rev_currently_being_saved === 'undefined' || 
                        window.app.import_directory_view.rev_currently_being_saved !== thiz.model.get('_rev')){
                    // console.log(iterations + ' 196 saving', dir.get('_rev'))
                    // Prevent saving the same revision twice simultaneously
                    if (typeof window.app.import_directory_view.rev_currently_being_saved === 'undefined'){
                        window.app.import_directory_view.rev_currently_being_saved = thiz.model.get('_rev')
                    }
                    thiz.model.save({
                            _id:thiz.model.get('_id'),
                            _rev:thiz.model.get('_rev'),
                            url:$('#url').val(),
                            get_url_html:get_url_html
                        },
                        {
                            success:function(){
                                // Report that it's OK for other calls to save_dir to run
                                delete window.app.import_directory_view.rev_currently_being_saved
                                // Append dir to CGroup
                                thiz.cgroup.get('directories').add([{_id:thiz.model.get('_id')}])
                                // Save cgroup to db
                                // TODO: Does the relation appear on the dir in the db also?
                                // This will trigger the Node changes listener's response
                                thiz.cgroup.fetch({success:function(){
                                    thiz.cgroup.save({_id:thiz.cgroup.get('_id'),_rev:thiz.cgroup.get('_rev')},{success:function(){
                                        // TODO: This isn't necessary on dirtypes other than HTML
                                        // Render DirTypeView
                                        $('#steps').hide()
                                        thiz.dir_type_view  = new DirTypeView({el: '#steps', model: thiz.model})
                                        thiz.dir_type_view.render()
                                        $('#steps').fadeIn(2000)
                                    }})
                                }})
                            },
                            error:function(model, xhr, options){
                                console.error('We got the 196 error '+ thiz.iterations)
                                thiz.save_dir()
                            }
                        }
                    )
                }
            }})
        },
        parse_json:function(){
            var thiz = this
            var json = this.model.get('url_data')
            // console.log(json)
            // If it starts with {"generated": then it's an import.io JSON file
            if (json.indexOf('{"generated":') === 0){
                // TODO: Parse import.io JSON here
            }
            // TODO: This handles the RPCNA data's current format, which does not yet
            //  perfectly match the RCL format.  So put this in a conditional if(){} block 
            //  to test if this is a JSON feed that has this format: {[]} (no "docs")
            window.app.json = json
            // TODO: Remove this when RPCNA's newly-corrected format comes out
            // TODO: There are 3 Beaver Falls congs in the JSON, but only 1 shows up on the map
            var new_json = json
                            // Add initial object property
                            .replace(/^{/gm, '{"docs":')
                            // Double-quote values
                            .replace(/:\s*?'(.*?)'\s*?,/gm, function(match, p1){
                                var output = ''
                                if (p1.indexOf('"') !== 0){
                                    output = p1.replace(/"/g, '\\"')
                                }else{
                                    output = p1
                                }
                                return ': "' + output + '",'
                            })
                            // Double-quote property names
                            .replace(/\s*?(\w+?)\s*?:\s*?["']/gm, ' "$1": "')
                            // Convert any remaining single quotes preceding a comma to double quotes
                            .replace(/',/gm, '",')
                            // Add newline after final object in list, and convert final single quote to double
                            .replace(/(.*?)('\s*?})/gm,'$1"\n}')
                            // Escape newlines in values
                            // .replace(/(".*?)\n(?=.*?")/g, '$1\\\\n')
                            // Since the above doesn't seem to work, try a different regex to do the same
                            .replace(/"([\s\S]*?)"/g, function(match, p1, offset, string){
                                var output = ''
                                if (p1.indexOf("\n") !== -1 || p1.indexOf("\r") !== -1){
                                    if (p1.indexOf("\n") !== -1){
                                        output = p1.replace(/\n/g, '\\\\n')
                                    }
                                    if (p1.indexOf("\r") !== -1){
                                        output = p1.replace(/\r/g, '\\\\r')
                                    }                                    
                                }else{
                                    output = p1
                                }
                                return '"' + output + '"'
                            })
                            // Remove comma after last item in list
                            .replace(/}(,)(?![\s\S]*?{)/g, function(match, p1){
                                return '}'
                            })
            // TODO: Put this into the correct template, once we get the state page selector template to stop displaying
            //  for this view
            $('#steps').append('<div class="status"></div>')
            function bulksave(congs){
                // See if all geocoding requests have finished
                var geocoding = _.countBy(congs, function(cong){
                    if (cong.geocoding == 'started'){
                        return 'count'
                    }
                })
                // Report to the user how many congs are left
                $('.status').html(geocoding.count + ' congregations left to geocode!')
                window.app.congs = congs
                if (geocoding.count === 0 || geocoding.count == thiz.errors){
                    // Write the JSON to the database
                    // It is easiest to bulk-save using jquery.couch.js rather than Backbone
                    config.db.bulkSave({"docs":congs},{success:function(){
                        console.log(new Date().getTime() + '\tb: All congs are saved!')
                    }})
                }
            }
            function geocode(address, congs, index){
                var now = new Date().getTime()
                if (typeof thiz.usecs == 'undefined'){
                    thiz.usecs = 100
                }
                if ((typeof thiz.geocode_end_time !== 'undefined') &&
                    (now - thiz.geocode_end_time) > thiz.usecs){
                    // This line should prevent two delayed geocode requests from running simultaneously
                    thiz.geocode_end_time = now
                    window.app.geocoder.geocode( { 'address': address }, function(results, status) {
                        // console.log(results, status)
                        // TODO: Handle when Google returns multiple possible address matches (results.length > 1, 
                        //  or status == 'ZERO_RESULTS'
                        if (status == google.maps.GeocoderStatus.OK) {
                            var loc = results[0].geometry.location
                            congs[index].loc = [loc.lat(), loc.lng()]
                            // Delay bulkSave until after asynchronous geocoding is done for all congs
                            congs[index].geocoding = 'done'
                            thiz.geocode_end_time = new Date().getTime()
                            bulksave(congs)
                        }else{
                            // === if we were sending the requests to fast, try this one again and increase the delay
                            if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
                                thiz.usecs += 100;
                                setTimeout(function(){
                                    geocode(address, congs, index)
                                },thiz.usecs)
                            }else{
                                var reason  =   "Code "+status;
                                var msg     = 'address="' + address + '" error=' +reason+ '(usecs='+thiz.usecs+'ms)';
                                if (typeof thiz.errors == 'undefined'){
                                    thiz.errors = 1
                                }else{
                                    thiz.errors++
                                }
                                console.error('Errors: ' + thiz.errors, msg)
                            }
                        }
                    })
                }else{
                    // Wait to avoid Google throttling the geocode requests (for there
                    //  being too many per second, as indicated by the 'OVER_QUERY_LIMIT' error code)
                    if (typeof thiz.geocode_end_time == 'undefined'){
                        // Set the first geocode_end_time
                        thiz.geocode_end_time = now
                    }
                    setTimeout(function(){
                        geocode(address, congs, index)
                    },thiz.usecs)
                }
            }
            var congs = JSON.parse(new_json).docs
            _.each(congs, function(cong, index, list){
                // TODO: Record cgroup id for this directory, by appending it to the list
                congs[index].cgroups = [thiz.model.get('cgroup')]
                // TODO: Record the denomination abbreviation for other denominations here too
                //  Get it from the cgroup.abbr
                congs[index].denomination_abbr = 'RPCNA'
                congs[index].collection = 'cong'
                if (cong.lat === '' || cong.lng === ''){
                    // Geocode the cong and put geocode in object for geocouch
                    // Note this is limited to 2500 requests per day
                    congs[index].geocoding = 'started'
                    // TODO: Refactor this into a general function
                    // Pick the meeting_address[1|2] which contains a number, else just use meeting_address1
                    var address_line = ''
                    if (cong.meeting_address1.search(/\d/) !== -1){
                        address_line = cong.meeting_address1
                    } else if (cong.meeting_address2.search(/\d/) !== -1){
                        address_line = cong.meeting_address2
                    }else{
                        address_line = cong.meeting_address1
                    }
                    var address =   address_line + ', ' + 
                                    (cong.meeting_city?cong.meeting_city: (cong.mailing_city?cong.mailing_city:'')) + ', ' + 
                                    (cong.meeting_state?cong.meeting_state:  (cong.mailing_state?cong.mailing_state:'')) + ' ' + 
                                    (cong.meeting_zip?cong.meeting_zip:  (cong.mailing_zip?cong.mailing_zip:''))
                    // TODO:  Consider how to refactor this to geocode only one cong at a time.
                    //  Currently the code tries all at once, then when it realizes it's getting errors,
                    //  it throttles back, but the effect of that throttling is probably to throttle back too
                    //  much, so the whole geocoding batch runs much slower than it has to.  So the way to refactor
                    //  this is to keep track of which cong is being handled, then only once one cong is geocoded,
                    //  move on to the next cong.
                    geocode(address, congs, index)
                } else {
                    // Use existing geocode data
                    congs[index].loc = [cong.lat, cong.lng]
                }
            })
        },
        // TODO: Consider moving these into a library
        uses_batch_geo:function(html){
            return ( html.indexOf('https://batchgeo.com/map/') !== -1 )
        },
        process_batch_geo:function(html){
            // Get the batchgeo map URL out of the HTML
            var map_url = html.match(/(https:\/\/batchgeo.com\/map\/.+?)['"]{1}/i)[1]
            // Get the batchgeo JSON URL out of the map's HTML
            console.log(new Date().getTime() + '\tb: ' + map_url)
            this.model.set('pagetype', 'batchgeo')
            this.model.set('batchgeo_map_url', map_url)
            this.model.set('get_batchgeo_map_html', 'requested')
            this.model.save()
        },
        get_batchgeo_json:function(){
            var thiz = this
            this.model.fetch({success:function(){
                thiz.model.unset('get_batchgeo_map_html')
                var html = thiz.model.get('batchgeo_map_html')
                // console.log(html)
                var json_url = html.match(/(https:\/\/.+?.cloudfront.net\/map\/json\/.+?)['"]{1}/i)[1]
                console.log(new Date().getTime() + '\tb: get_json for ' + json_url)
                // TODO: Request that the node script get this URL's contents
                thiz.model.set('json_url', json_url)
                thiz.model.set('get_json', 'requested')
                thiz.model.save()
             }})
         },
         batchgeo_parse_json:function(){
            this.model.unset('get_json')
            // The PCA has a KML file at http://batchgeo.com/map/kml/c78fa06a3fbdf2642daae48ca62bbb82
            //  Some (all?) data is also in JSON at http://static.batchgeo.com/map/json/c78fa06a3fbdf2642daae48ca62bbb82/1357687276
            //  The PCA directory's main HTML URL is http://www.pcaac.org/church-search/
            //  After trimming off the non-JSON, the cong details are in the obj.mapRS array
            //  You can pretty-print it at http://www.cerny-online.com/cerny.js/demos/json-pretty-printing
            //  Its format is as follows:
            //  per = {mapRS:[{
             // "accuracy":"ROOFTOP",
             // "postal":"30097", // mailing_zip?
             // "a":"9500 Medlock Bridge Road", // address
             // "c":"Johns Creek", // city
             // "s":"GA", // state
             // "z":"30097", // meeting_zip?
             // "t":"Perimeter Church", // name
             // "u":"www.Perimeter.org", // url
             // "i":"", // ?
             // "g":" ", // ?
             // "e":"Perimeter@Perimeter.org", // email
             // "lt":34.013179067701, // lat
             // "ln":-84.191637606647, // lng
             // "d":"<div><span class=\"l\">Church Phone:<\/span>&nbsp;678-405-2000<\/div><div><span class=\"l\">Pastor:<\/span>&nbsp;Rev. Randy Pope<\/div><div><span class=\"l\">Presbytery:<\/span>&nbsp;Metro Atlanta<\/div>", // phone, pastor_name, presbytery_name
             // "addr":"9500 Medlock Bridge Road Johns Creek GA 30097", // mailing_address (full, needs to be parsed)
             // "l":"9500 Medlock Bridge Road<br \/>Johns Creek, GA 30097", // mailing_address_formatted, easier to parse
             // "clr":"red"
             // }]}
            // Get the relevant JSON in a variable
            // This regex took forever
            // var json = this.model.get('json').replace(/.*?"mapRS":/, '{"congs":').replace(/,"dataRS":.*/, '}')
            // So although this could be unsafe, it is expedient!
            eval(this.model.get('json'))
            var congs = per.mapRS
            // Convert the JSON's fieldnames to RCL fieldnames
            var replacements = [
                {
                    old:'postal',
                    new:'mailing_zip'
                },
                {
                    old:'a',
                    new:'meeting_address1'
                },
                {
                    old:'c',
                    new:'meeting_city'
                },
                {
                    old:'s',
                    new:'meeting_state'
                },
                {
                    old:'z',
                    new:'meeting_zip'
                },
                {
                    old:'t',
                    new:'name'
                },
                {
                    old:'u',
                    new:'website'
                },
                {
                    old:'e',
                    new:'email'
                },
                {
                    old:'lt',
                    new:'lat'
                },
                {
                    old:'ln',
                    new:'lng'
                }
            ]
            // For each cong
            $.each(congs, function(index, cong){
                // For each key name
                $.each(replacements,function(index, repl){
                    // Replace each key name
                    cong[repl.new] = cong[repl.old];
                    delete cong[repl.old];
                })
                // Parse 'd' field into:
                //  phone, pastor_name, presbytery_name [, others?]
                // cong.d = <div><span class="l">Church Phone:</span>&nbsp;334-294-1226</div><div><span class="l">Pastor:</span>&nbsp;Rev. Brian DeWitt MacDonald</div><div><span class="l">Presbytery:</span>&nbsp;Southeast Alabama</div> 
                // Ignore errors if the match fails
                try { cong.phone = cong.d.match(/Church Phone:.*?&nbsp;(.*?)</)[1]} catch(e){}
                try { cong.pastor_name = cong.d.match(/Pastor:.*?&nbsp;Rev. (.*?)</)[1] } catch(e){}
                try { cong.presbytery_name = cong.d.match(/Presbytery:.*?&nbsp;(.*?)</)[1] } catch(e){}
                // Parse 'l' field into:
                //  mailing_address1, mailing_city, mailing_state, mailing_zip
                // cong.l = 6600 Terry Road<br />Terry, MS 39170
                // But note there are many other formats, particularly outside the US
                // TODO: compact this into a recursive function that iterates through a list of regexes to try for
                //  each field
                try{
                    cong.mailing_address1 = cong.l.match(/^(.*?)<br/)[1]
                    try{
                        cong.mailing_city = cong.l.match(/<br \/>(.*?),/)[1]
                    }catch(e){
                        try{
                            cong.mailing_city = cong.l.match(/<br \/>(.*?) [0-9]+/)[1]
                        }catch(e){
                            try{
                                cong.mailing_city = cong.l.match(/<br \/>[0-9]+ (.*?)/)[1]
                            }catch(e){
                                try{
                                    cong.mailing_city = cong.l.match(/<br \/>(.*?)/)[1]
                                }catch(e){
                                    console.log(cong.l)
                                }
                            }
                        }
                    }
                    try{
                        cong.mailing_state = cong.l.match(/<br \/>.*?, (.*?) /)[1]
                    }catch(e){
                        // The only ones missed here are not states, but cities, so this is commented out
                        // console.log(cong.l)
                    }
                    try{
                        cong.mailing_zip = cong.l.match(/<br \/>.*?, .*? (.*)$/)[1]
                    }catch(e){
                        try{
                            cong.mailing_zip = cong.l.match(/<br \/>.*? ([0-9- ]+)$/)[1]
                        }catch(e){
                            try{
                                cong.mailing_zip = cong.l.match(/<br \/>([0-9- ]+) .*/)[1]
                            }catch(e){
                                try{
                                    cong.mailing_zip = cong.l.match(/.*?[0-9]+?<br/)[1]
                                }catch(e){
                                    // The rest just don't have a zip, so this is commented out
                                    // console.log(cong.l)
                                }
                            }
                        }
                    }
                }catch(e){
                    // If this outputs data, create a new regex to fix the errors
                    console.log(cong.l)
                }
                // Convert geocode to geocouch format
                cong.loc = [cong.lat, cong.lng]
                // TODO: Set each model's cgroup_id.  What key name does backbone-relational use for the cgroup_id?
                // TODO: Record other denominations' abbreviations here too
                cong.denomination_abbr = 'PCA'
                cong.cgroups = []
                cong.collection = 'cong'
                congs[index] = cong
            })
            // Write the JSON to the database
            // It is easiest to bulk-save using jquery.couch.js rather than Backbone
            config.db.bulkSave({"docs":congs},{success:function(){
                // TODO: Notify the user
                console.log(new Date().getTime() + '\tb: All congs are saved!')
            }})
        }
    });
});


