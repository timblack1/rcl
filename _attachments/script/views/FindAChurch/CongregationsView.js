define([
        'config'
        ], 
        function(config){

    var CongregationsView = Backbone.View.extend({
        initialize: function(){
            this.render();
            // Apply tablesorter widget to table containing congregation list
            $("#congregation_list")
            .tablesorter({widgets: ['zebra'], locale: 'us', useUI: true});
            // TODO: For some reason the pager doesn't display, its div wraps around the table and filter widgets,
            //       and it breaks the sorter so when you click on the table header the rows disappear.
            //.tablesorterPager({container: $("#pager")});
        },
        render: function(){
            config.render_to_id(this, "#congregations_template")
        }
    });
    return CongregationsView

});