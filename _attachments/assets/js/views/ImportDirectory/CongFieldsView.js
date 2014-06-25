define([
        'config',
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
            
            // Add a popover to the fields_container to notify user they should click on a field
            $('#fields_container').popover({
                placement:'top',
                content:"Please click on one field name below.",
                trigger:'manual'
            })
            // Give the rest of the page time to render so the popover is positioned correctly
            setTimeout(function(){
                $('#fields_container').popover('show')
            }, 2000)
        }
    });

});