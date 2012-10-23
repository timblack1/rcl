define([
        ], 
        function(){

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
            var template = _.template( $("#congregations_template").html(), {} );
            $(this.el).html( template );
        }
    });
    return CongregationsView

});