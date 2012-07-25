function(){
	// TODO: Get the menu item that is selected
	var path = unescape(document.location.pathname).split('/')
	var filename = path[path.length-1]
	// Add the "active" class to the menu item the user clicked
	$('#mainmenu a[href="' + filename + '"]').addClass('active')
}