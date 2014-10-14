Backgrid.CitystateCell = Backgrid.Cell.extend({
    className: "citystate-cell",
    formatter: Backgrid.StringFormatter,
    render: function () {
        var model = this.model
        this.$el.val(model.get('meeting_city') + ', ' + model.get('meeting_state'));
        return this;
    }
});
Backgrid.ContactinfoCell = Backgrid.Cell.extend({
    className: "contactinfo-cell",
    formatter: Backgrid.StringFormatter,
    render: function () {
        var model = this.model
        this.$el.val(model.get('pastor_name') + '<br />' + model.get('phone') + '<br />' + model.get('website'));
        return this;
    }
});

var Congs = Backbone.Collection.extend()

Congs.add([{
    "_id": "e51896517bc3adfa7acd96d0f231d9a6",
    "_rev": "1-91c12e5951f5097617b55c1759fa9b80",
    "accuracy": "ROOFTOP",
    "i": "",
    "g": " ",
    "d": "<div><span class=\"l\">Church Phone:</span>&nbsp;646-642-3533</div><div><span class=\"l\">Pastor:</span>&nbsp;Rev. Stephen T. Kim</div><div><span class=\"l\">Presbytery:</span>&nbsp;Korean Northeastern</div>",
    "addr": "144-80 Barclay Avenue Flushing NY 11355",
    "l": "144-80 Barclay Avenue<br />Flushing, NY 11355",
    "clr": "red",
    "mailing_zip": "11355",
    "meeting_address1": "144-80 Barclay Avenue",
    "meeting_city": "Flushing",
    "meeting_state": "NY",
    "meeting_zip": "11355",
    "name": "The Lord's Community Church",
    "website": "",
    "email": "",
    "lat": 40.760349887526999169,
    "lng": -73.817909006058002319,
    "phone": "646-642-3533",
    "pastor_name": "Stephen T. Kim",
    "presbytery_name": "Korean Northeastern",
    "mailing_address1": "144-80 Barclay Avenue",
    "mailing_city": "Flushing",
    "mailing_state": "NY",
    "loc": [40.760349887526999169, -73.817909006058002319],
    "denomination_abbr": "PCA",
    "cgroups": [],
    "collection": "cong"
}])

console.log(Congs.models)

var columns = [{
    name: "name",
    label: "Name",
    cell: "string",
    editable: false
}, {
    name: "city_state",
    label: "City, State",
    cell: 'citystate',
    editable: false
}, {
    name: "contact_info",
    label: "Contact info",
    cell: 'contactinfo',
    editable: false
}];

// Initialize a new Grid instance
var grid = new Backgrid.Grid({
    columns: columns,
    collection: Congs
});

// Render the grid and attach the root to your HTML document
$(".grid").append(grid.render().$el);
