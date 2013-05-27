define([
        '../../config',
        './CongFieldView'
        ], 
        function(config, CongFieldView){
    
    return Backbone.View.extend({
        initialize:function(){
            _.bindAll(this)
            // List field names
            var field_names = [
                      'name',
                      'meeting_address1',
                      'meeting_address2',
                      'meeting_city',
                      'meeting_state',
                      'meeting_zip',
                      'meeting_country',
                      'mailing_address1',
                      'mailing_address2',
                      'mailing_city',
                      'mailing_state',
                      'mailing_zip',
                      'mailing_country',
                      'phone',
                      'fax',
                      'email',
                      'website',
                      'service_info',
                      'date_founded'
                    ]
            // Format field names
            var fields = []
            for (var i=0; i < field_names.length; i++){
                fields.push({
                    pretty_name:config.capitalize(field_names[i].replace('_', ' ')),
                    db_name:field_names[i]
                })
            }
            this.fields = fields
        },
        render: function(){
            // Render individual views for each field
            this.views = []
            var thiz = this
            _.each(this.fields,function(value, key, list){
                var db_name = value.db_name
                var view = thiz.views[db_name] = new CongFieldView({
                    el: value.db_name + '_el',
                    field:value,
                    parent:thiz
                })
                view.render()
            })
            this.delegateEvents()
            // TODO: Add a popover to the fields_container to notify user they should click
            //  on a field
            $('#fields_container').popover({
                placement:'top',
                html:'Testing',
                selector:'#fields_container'
            })
            $('#fields_container').popover('show')
            $('#fields_container').popover({
                placement:'top',
                content:"Please click on one field name below.",
                selector:'#fields_container' 	
            })
            $('#fields_container').popover({
                placement:'top',
                content:"Highlight that field's content where it appears in the page.",
                selector:'#fields_container' 	
            })
            $('#fields_container').popover({
                placement:'top',
                content:"Behind the scenes, this page will use your selected text to create a regular expression that will attempt to extract that field's data from the web page.  Then it will display the data it extracted in that field's text box.",
                selector:'#fields_container' 	
            })
            $('#fields_container').popover({
                placement:'top',
                content:"Once that data displays in the text box, please confirm whether the data is correct.",
                selector:'#fields_container' 	
            })
            $('#fields_container').popover({
                placement:'top',
                content:"If you would like to modify the regular expression yourself, you may do so in the 'Regular Expression' box at the bottom of the page." +
                	  "We encourage you to do so.  You can read documentation about the regular expression syntax at" +
                	  "<a href='http://www.w3schools.com/jsref/jsref_obj_regexp.asp' target='_blank'>W3Schools</a> and <a href='https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions' target='_blank'>Mozilla Developer Network</a>.",
                selector:'#fields_container' 	
                	})
        }
    });

});