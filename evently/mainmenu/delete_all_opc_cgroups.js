function(){
	// Delete all OPC cgroups
	var db = $$(this).app.require('db').db
	// Get all OPC groups
	db.view('rcl/cgroup-abbreviation',{
		keys:['OPC'],
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