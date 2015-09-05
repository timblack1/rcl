/*
 * Currently this file is not executed, but is only used to document
 * the schema in the database.
 */

var model = {

  // Join docs

  cgroup_congregation: {
    cgroup_id: '',
    congregation_id: ''
  }

  // Regular docs

  cgroup: {
    default_attributes:{
       type: 'cgroup',
       name: '',
       abbreviaton: '',
       website: '',
       parent_cgroup_id: '', // relation; permits cgroups to be arranged hierarchically
    },
    relations:[
      congregations, // many-to-many, join docs are of type 'cgroup_congregation'
      people, // many-to-many, join docs are of type 'cgroup_person'
      roles, // many-to-many, join docs are of type 'cgroup_role'
      directories // many-to-one
    ]
  }

  directory: {
    default_attributes:{
      type: 'directory',
      url:'', // url of directory's main page. As an approximation
              //  of the directory's main page, extract the domain name from json.data[0]._pageUrl.
      directory_type:'', // options: ['importio', 'rss', 'html']
      importio_guid: ''  // found in json.data[0]._source[0]; should be the same 
                         //   for every cong from one import.io data source
      cgroup_id: ''  // relation. _id of the cgroup this directory represents. One directory represents 
                  // one cgroup.  But one cgroup can be represented by more than one directory.
    }
  }  

}