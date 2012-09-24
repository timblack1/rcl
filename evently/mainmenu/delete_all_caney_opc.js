function(){
	// Delete all OPC directories
	var db = $$(this).app.require('db').db
	// Get all OPC congregations
	db.view('rcl/caney_opc',{
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
			db.bulkRemove({docs:docs}, {
				success:function(data){
					//console.log(data)
				}
			})
		}
	})
}