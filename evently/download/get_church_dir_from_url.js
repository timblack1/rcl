function(){

	var elem = $(this);
	
	// Delay this to run after typing has stopped for 2 seconds, so we don't send too many requests
	// TODO: Don't fire on every key event, but only once after delay.
	//setTimeout(function(){
	el = $('#url');
	// Create dir if it does not exist
	if (typeof dir === 'undefined'){
		directory = {};
	}
	directory.url = el.val();
	console.log(directory)
	$.ajax({
		type: "POST",
		url: "/cong/get_page_type",
		data: ({url : el.val()}),
        success: function(msg){
			// TODO: In the controller & output to form, handle whether this is an RSS feed or an HTML page
        	$("#url_result_div").innerHTML = msg;
        	if (msg == 'html'){
        		$("#directory_type").show(1000);
        		$("#rss_feed").hide(1000);
        		directory.page_type = 'html';
        	} else if (msg == 'rss'){
        		// TODO: Display the right form controls for an RSS page
        		$("#directory_type").hide(1000);
        		$("#rss_feed").show(1000);
        		directory.page_type = 'rss';
        	} else { // We got an error code
        		// Hide the form controls.
        		elem.trigger('hide_subform');
        	}
        },
        error: function(xhr, ajaxOptions, thrownError){
          $("#url_result_div").innerHTML = xhr.responseText;
        },
		statusCode: {
			500: function(data, textStatus, jqXHR){
				// TODO: Handle 500 errors here
				//alert(data);
				//alert(data.responseText)
				// TODO: Even though Chrome's developer tools says the server is returning a 500 error,
				//			This code does not seem to be running.
				console.log("The 500 error handler is running.");
				elem.trigger('hide_subform');
			},
			404: function(data, textStatus, jqXHR){
				// TODO: Handle 404 errors here
				elem.trigger('hide_subform');
			}
		}
	});

	//},2000);
	
}