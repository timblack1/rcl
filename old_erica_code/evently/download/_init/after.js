function(){

	// ----------------- INITIALIZE PAGE --------------------------------

	var elem = $(this);
	// Hide subform
	elem.trigger('hide_subform');
	
	// TODO: Is this used anywhere?
	function test_regex_ajax(el){
		$.ajax({
			type: "POST",
			url: "/cong/test_regex_ajax",
			data: ({regex : el.val()}),
            success: function(msg){
              $("#result_div").innerHTML = msg;
            },
            error: function(xhr, ajaxOptions, thrownError){
              $("#result_div").innerHTML = xhr.responseText;
            },
			statusCode: {
				500: function(data, textStatus, jqXHR){
					// TODO: Handle 500 errors here
					//alert(data);
					//alert(data.responseText)
				}
			}
		});
	}
	
}