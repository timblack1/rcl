$(document).ready(function() 
    { 
        // Apply tablesorter widget to table containing congregation list
		$("#congregation_list")
        .tablesorter({widgets: ['zebra'], locale: 'us', useUI: true});
		// TODO: For some reason the pager doesn't display, its div wraps around the table and filter widgets,
		//		 and it breaks the sorter so when you click on the table header the rows disappear.
        //.tablesorterPager({container: $("#pager")});
    } 
); 
    