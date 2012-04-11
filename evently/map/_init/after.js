function(){

	//TODO: We are trying to get the AJAX request to work on the "on key up" event; but no luck so far. 
	var geocoder;
	var map;
	function initialize() {
		geocoder = new google.maps.Geocoder();
		// TODO: Center the map on the viewer's country
		var latlng = new google.maps.LatLng(-34.397, 150.644);
		var myOptions = {
				zoom: 8,
				center: latlng,
				mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	}
	initialize();

	// TODO: Migrate the code below into Evently events
	
	// Attach events to search_the_map form elements
	$('#search').click(function() {
		codeAddress();
		return false;
	});
	$('#search_the_map').keypress(function(event) {
		if (event.which==13){ // The user pressed the enter key
			event.preventDefault();  // Prevent the default action of submitting the form
			codeAddress();
			return false; // This might help some browsers avoid submitting the form
		}
	});

}