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
            _.each(this.fields,function(value, key, list){
                var db_name = value.db_name
                this.views[db_name] = new CongFieldView({
                    el: value.db_name + '_el',
                    field:value,
                    parent:this
                })
                view.render()
            })
            this.delegateEvents()
        }
    });

});