define(
   [
            'views/MenuView',
            'views/ImportDirectoryView',
            'views/FindAChurch/main'
    ], 
    function(MenuView,ImportDirectoryView,FindAChurchView){
       return {
           MenuView:MenuView,
           ImportDirectoryView:ImportDirectoryView,
           FindAChurchView:FindAChurchView
       }
    }
)