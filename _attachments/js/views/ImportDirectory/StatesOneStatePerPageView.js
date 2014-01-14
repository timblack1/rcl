define([
        'config',
        'mustache',
        'text!views/ImportDirectory/StatesOneStatePerPage.html',
        './CongDetailsURLView'
        ], 
        function(config, Mustache, template, CongDetailsURLView){
    
    var StatesOneStatePerPageView = Backbone.View.extend({
        initialize:function(){
            _.bindAll(this,'show_state_page')
        },
        render: function(){
            $('#steps').html(Mustache.render(template));
            this.delegateEvents()

            var thiz = this
            function sub_render(){
                // TODO: Why is the second argument to rewrite_urls below undefined?
                var new_html_set = config.rewrite_urls(window.app.dir.get('url'), [window.app.dir.get('url_html')], 0)
                thiz.$('#state_drop_down_selector').html(new_html_set[0]);
                // We bind the event here because the select element didn't exist at this Backbone view's
                //  initialization
                thiz.$('#state_drop_down_selector select')
                    .click({thiz2:thiz},function(event){ event.data.thiz2.show_state_page(event)})
            }
            // We (sometimes?) have to wait for url_html to be available
            function fetch(){
                if (typeof window.app.dir.get('url_html') === 'undefined'){
                    setTimeout(function(){
                        window.app.dir.fetch({success:function(model,response,options){
                            fetch()
                        }})
                    },300)
                }else{
                    sub_render()
                }
            }
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
            
            // Get cong data from a URL like this:  http://opc.org/locator.html?state=WA&search_go=Y
            // TODO: Record whether to send a GET or POST
            // Display these bits of data to the user so they can edit them.
            // Show confirmation div
            var form = el.closest('form')
            // Handle cases where there is or is not a final slash in base_url, or
            //  an initial slash in form.attr('action').
            if(typeof window.app.dir.get('url') === 'undefined'){
                console.error('window.app.dir.get(url) is ' + window.app.dir.get('url'))
            }
            var base_url = window.app.dir.get('url').replace(/\/+$/,'')
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
                    if (get_state_url_html != 'getting'){
                        get_state_url_html = 'requested'
                    }
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
                                // Render next step's view
                                $('#steps').hide()
                                this.cong_details_url = new CongDetailsURLView({el:$('#steps')})
                                this.cong_details_url.render()
                                // Show state details page div
                                $("#steps").fadeIn(1000);
                            },
                            error:function(model, xhr, options){
                                console.error('we got the 454 error')
                                save_dir(dir)
                            }
                        })

                    }
                }})
            }
            save_dir(window.app.dir)
        }

    });
    return StatesOneStatePerPageView;

});
