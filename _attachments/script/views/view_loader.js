define(
   [
            'views/MenuView',
            'views/ImportDirectoryView/main',
            'views/FindAChurch/main',
            'views/RunTestsView'
    ], 
    function(MenuView,ImportDirectoryView,FindAChurchView,RunTestsView){
       return {
           MenuView:MenuView,
           ImportDirectoryView:ImportDirectoryView,
           FindAChurchView:FindAChurchView,
           RunTestsView:RunTestsView
       }
    }
)