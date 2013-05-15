define(
   [
    '../config',
    '../vendor/mustache', 
    'text!views/Menu.html'
    ], 
    function(config, Mustache, template){

    return Backbone.View.extend({
        initialize: function(){
        },
        render: function(){
            $('.navbar').html(Mustache.render(template));
            this.delegateEvents()
            this.$('a').on('click',this.make_menu_item_active)
        },
        events: {
            "click a": "make_menu_item_active",
            "click input[type=button]": "do_search",
            "click #delete_all_docs" : "delete_all_docs",
            "click #delete_all_opc_cgroups" : "delete_all_opc_cgroups",
            "click #delete_all_directories" : "delete_all_directories",
            "click #delete_all_caney_opc" : "delete_all_caney_opc",
            "click #delete_all_opc_data" : "delete_all_opc_data"
        },
        make_menu_item_active:function(event){
            // TODO: Get the menu item that is selected
            //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/get-selected-menu-item
            var path = unescape(document.location.pathname).split('/')
            var filename = path[path.length-1]
            console.log('filename:', filename)
            // Add the "active" class to the menu item the user clicked
            $('#mainmenu a[href="' + filename + '"]').addClass('active')
        },
        // TODO: Does this function belong here or in another view?
        do_search: function( event ){
            // Button clicked, you can access the element that was clicked with event.currentTarget
            alert( "Search for " + $("#search_input").val() );
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
        delete_all_opc_data:function(){
            // Delete all OPC directories
            // Get all OPC directories
            config.db.view('rcl/opc',{
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
        }
     });

});