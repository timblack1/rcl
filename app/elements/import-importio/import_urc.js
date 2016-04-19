// Import URC data from URLs in page at https://www.urcna.org/1651/family/urcna_report?public=1

// Convert nodelist of URLs to array
var data = Array.from(document.querySelectorAll('.thickbox')).map(function(a){
  var ob = {};
  // Insert each key-value pair into the object
  a.href.split('?')[1].split('&').forEach(function(pair){
    var arr = pair.split('=');
    // NOTE: This is a shortcut to importing the data.  We convert the data into
    //  import.io's output format, so we can just load the data using our
    //  import.io interface.
    // Map URC's keys to import.io keys
    var keys = {
      church: 'name',
      classis: 'presbytery',
      addr: 'mailing_address1',
      city: 'mailing_city',
      state: 'mailing_state',
      zip: 'mailing_zip',
      addr2: 'meeting_address1',
      city2: 'meeting_city',
      state2: 'meeting_state',
      zip2: 'meeting_zip',
      phone: 'phone',
      email: 'contact_email/_text',
      web: 'website',
      serv: 'service_info',
      min1: 'contact_name',
      lat: 'lat',
      lng: 'lng',
      loc: 'loc'
    };
    ob[keys[arr[0]]] = [decodeURIComponent(arr[1])];
  });
  ob.contact_type = ['Pastor'];
  ob._source = ['URC'];
  ob._pageUrl = a.href;
  return ob;
});

data._source = ['URC'];

// TODO: Map URC's keys to RCL keys, then insert into database
// Note: Some values need to be parsed into separate values

console.log(JSON.stringify({data: data}));


