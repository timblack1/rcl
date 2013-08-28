define(
   [
    '../config',
    'mustache', 
    'backbone',
    'text!views/Menu.html'
    ], 
    function(config, Mustache, Backbone, template){

    return Backbone.View.extend({
        initialize: function(){
        },
        render: function(){
            $('.navbar').html(Mustache.render(template));
            this.delegateEvents()
        },
        events: {
            "click a": "make_menu_item_active",
            "click #delete_all_docs": "delete_all_docs",
            "click #delete_all_opc_cgroups": "delete_all_opc_cgroups",
            "click #delete_all_directories": "delete_all_directories",
            "click #delete_all_caney_opc": "delete_all_caney_opc",
            "click #delete_all_opc_data": "delete_all_abbreviation_data",
            "click #delete_all_pca_data": "delete_all_abbreviation_data",
            "click #delete_all_rpcna_data": "delete_all_abbreviation_data"
        },
        make_menu_item_active:function(event){
            // Remove the 'active' class from all other menu items
            $('.navbar li.active').removeClass('active')
            // Add the "active" class to the menu item the user clicked
            $(event.target).parent('li').addClass('active')
        },
        delete_all_docs:function(){
            // Delete all docs except design doc
            // Get all docs
            config.db.view('rcl/byCollection',{
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value._rev
                        })
                    }
                    config.db.bulkRemove({docs:docs}, {})
                }
            })
        },
        delete_all_directories:function(){
            // Delete all directories
            // Get all directories
            config.db.view('rcl/directories',{
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    config.db.bulkRemove({docs:docs}, {})
                }
            })
        },
        delete_all_caney_opc:function(){
            // Delete all OPC directories
            // Get all OPC congregations
            config.db.view('rcl/caney_opc',{
                keys:['Caney OPC', 'Caney OPC, second version', 'Caney OPC, third version',
                      'Bartlesville OPC'],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    config.db.bulkRemove({docs:docs}, {})
                }
            })
        },
        delete_all_opc_cgroups:function(){
            // Delete all OPC cgroups
            // Get all OPC groups
            config.db.view('rcl/cgroup-by-abbreviation',{
                keys:['OPC'],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    config.db.bulkRemove({docs:docs}, {})
                }
            })
        },
        delete_all_abbreviation_data:function(event){
            var abbreviation = $(event.target).attr('id').match(/delete_all_(.+?)_data/)[1].toUpperCase()
            // Delete all data with this abbreviation
            // Get all OPC data
            config.db.view('rcl/denomination_abbr',{
                keys:[abbreviation],
                success:function(data){
                    var docs = []
                    for (var i=0;i<data.rows.length;i++){
                        docs.push({
                            _id:data.rows[i].id,
                            _rev:data.rows[i].value
                        })
                    }
                    config.db.bulkRemove({docs:docs}, {})
                }
            })
        }
     });

});