define([
        'config',
        '../../lib/mustache', 
        "./Cong_Fields"
        ], 
        function(config, Mustache, Cong_Fields){
    
    var ConfirmCongIDView = Backbone.View.extend({
        initialize:function(){
            this.render()
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
        render: function(){
            var id = "#confirm_cong_id_template"
            $(id).hide()
            config.render_to_id(this, id)
            $(id).show(3000)
        },
        events: {
            "click #yes": "yes",
            "click #no": "no"
            
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
			// TODO: This code goes in ConfirmCongIDView.js
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
					    $('#cong_details_fields_selector').html(model.get("cong_url_html"))				    
			        },
			        	error:function(){console.error ("Could not fetch the directory")}
			        }
			        )
		    }})
						
			 var url=this.href
			dir.fetch({success:function(dir, response, options){
				dir.save({
			                _id:dir.get('_id'),
			                _rev:dir.get('_rev'),
			                //TODO: Fill in URL to get here
			                cong_url:url,
			                get_cong_url_html:"requested"
			            },
			            {
			                success:function(){
			                },
			                error:function(model, xhr, options){
			                    console.error('We got an error here')
			                }
			            })
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
       
        record_id_format:function(url){
            // TODO: start here
            // TODO: Record the pattern of the URL the user clicked
            // TODO: If the URL is only partial, prepend the root of the URL
            var href = this.href
            if (href.indexOf('/') == 0){
                // TODO: Prepend the root of the URL
            }
            if(!href.match(/^http/)){
                // TODO: Prepend the root of the URL relative to the directory's URL
            }
            this.$el.hide(1000)
            // TODO: Make this into its own Backbone view
            // Show step 5
            $('#cong_details_fields').show(1000)
            //This will show the table of congregation fields.
            this.cong_fields = new Cong_Fields({el: $("#fields_table_container")})
            this.cong_fields.render();
        }     
    });
    return ConfirmCongIDView

});