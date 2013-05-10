define([
        'config',
        '../../lib/mustache', 
        'text!views/ImportDirectory/ConfirmCongID.html',
        "./CongDetailsView"
        ], 
        function(config, Mustache, template, CongDetailsView){
    
    var ConfirmCongIDView = Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
        },
        render: function(){
            // TODO: Tim start here
            $('#steps').html(Mustache.render(template));
            this.delegateEvents()
            // Ask the user which part of the URL that was clicked is the
            //  congregation ID.
            this.href = $(event.target).attr('href')
            var href = this.href
            // TODO: Handle the case where the href contains a javascript function call.  The
            //  PCA's directory works this way.
            // TODO: Handle the case where the href is empty and the click is handled
            //  by an onclick event.  This case is probably rare, so is a low priority.
            // Put href into div
            this.$('#href').html(href);
            // Try to guess the id with a regular expression, and display that id to 
            //  the user in a div.  Ask the user if it is the part of the URL that contains
            //  the congregation's id. Make it so the user only has to click a "Yes" button 
            //  to confirm if we got it right.
            this.regex = /([0-9])+/
            var href_underlined = href.replace(this.regex, '<u>$1</u>');
            this.$('#href_underlined').html(href_underlined)
        },
        events: {
            "click #yes": "yes",
            "click #no": "no",
            "click #fields_table_mustache button": "recreate_regex"
            
        },
        yes:function(){
            // Converts:
            //  church.html?church_id=3
            // into:
            //  church.html?church_id={cong_id}
            var url = this.href.replace(this.regex, '{cong_id}')
            this.record_id_format(url)

            // TODO: Display the pages' content here.
            // TODO: Fix this to display not one state's worth of congregations, but rather 
            //  the details of one congregation
            // TODO: Write first cong's URL to database, requesting Node to download its HTML
            // TODO: Write changes listener here
            
            // Set up browser changes listener to watch for and handle Node changes
            //  listener's response
            var changes = db.changes();
            changes.onChange(function(change){
                var change_id = change.results[0].id
                var rev = change.results[0].changes[0].rev
                // Determine if the changed document is the dir we are editing
                if (typeof dir != 'undefined' && change_id == dir.get('_id')){
                    // Fetch document's new contents from db
                    dir.fetch({success:function(model,response){
			        	//TODO: Doug START HERE
			        	//The model part on line 70 seems not to be working.
                        console.log (response)
			        	console.log (dir.get("cong_url_html"))
                        // TODO: Handle response here
                        // TODO: Write HTML to page here
                        $('#cong_details_fields_selector').html(dir.get("cong_url_html"))                   
			        },
			        	error:function(){console.error ("Could not fetch the directory")}
			        }
			        )
		    }})
                        
            // TODO: Write Node listener to catch & handle that request
            //  Get HTML from URL
            //  Write HTML back to db
        },
        no:function(){
            // TODO: Otherwise, ask the user to highlight the congregation's id
            // TODO: Display the above request
            // TODO: Put the below in an event listener
            // TODO: Get the id the user highlighted, and replace it in the URL with {cong_id}
            var url = this.href
            this.record_id_format(url)
        },
        //DOUG: START HERE
        recreate_regex:function(event){
            //test to see if this is a button which ends with _button
            if ($(event.target).attr("id").match(/_button$/)){
                //calculate the associated text boxes id from that button's id
                //http://stackoverflow.com/questions/12045675/clearing-the-entry-box-text-when-clicking-a-button
                // Clear the text box
                // Recreate the regex by including one more (HTML? space-separated string?)
                //  element of context on each side
                
             }
                
        },
        record_id_format:function(url){
            // If the URL is only partial, prepend the root of the URL
            var a = document.createElement('a')
            a.href = this.href
            var base = a.origin + a.pathname
            var root_url = base.slice(0,base.lastIndexOf('/'))
            // Cases:
            // Absolute, partial URL:  /locator.html
            if (url.indexOf('/') === 0){
                output_url = a.origin + url
            }
            // Absolute, full URL:  http://opc.org/locator.html
            else if (url.indexOf('http') === 0){
                output_url = url
            }
            // Relative, partial URL:  locator.html
            else{
                output_url = root_url + '/' + url
            }
            
            // Record the pattern of the URL the user clicked
            var thiz = this
            window.app.dir.fetch({success:function(dir, response, options){
                // Request download of all congregation pages
                dir.save({
                            _id:window.app.dir.get('_id'),
                            _rev:window.app.dir.get('_rev'),
                            cong_url:output_url,
                            get_cong_url_html:true
                        },
                        {
                            success:function(){
                                // Show step 5
                                thiz.$el.fadeIn(1000)
                                //This will show the table of congregation fields.
                                // TODO: Render step 5
                                thiz.cong_fields_view = new CongDetailsView({el: $("#steps")})
                                thiz.cong_fields_view.render();
                            },
                            error:function(model, xhr, options){
                                console.error('We got an error here')
                            }
                        })
            }})
        }
    });
    return ConfirmCongIDView

});