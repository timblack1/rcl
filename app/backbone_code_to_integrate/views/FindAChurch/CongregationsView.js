define([
        'config',
        'mustache',
		'backbone',
        'backgrid'
        ],
        function(config, Mustache, Backbone, Backgrid){

    return Backbone.View.extend({
        initialize: function(){
        },
        render: function(){
            // TODO: render() is being called twice!
            // TODO: Why do these custom cells not render anything?
            Backgrid.NamedenomCell = Backgrid.Cell.extend({
                className: "namedenom-cell",
                render:function(){
                    Backgrid.Cell.prototype.render.apply(this, arguments)
                    var model = this.model
                    var denomination = model.get('denomination_abbr') ? ' ('+model.get('denomination_abbr')+')' : ''
                    this.$el.text(this.formatter.fromRaw(model.get('name') + denomination));
                    return this;
                }
            });
            Backgrid.CitystateCell = Backgrid.Cell.extend({
                className: "citystate-cell",
                render:function(){
                    Backgrid.Cell.prototype.render.apply(this, arguments)
                    var model = this.model
                    this.$el.text(this.formatter.fromRaw(model.get('meeting_city') + ', ' + model.get('meeting_state')));
                    return this;
                }
            });
            Backgrid.ContactinfoCell = Backgrid.Cell.extend({
                className: "contactinfo-cell",
                render:function(){
                    Backgrid.Cell.prototype.render.apply(this, arguments)
                    var model = this.model
                    this.$el.html(this.formatter.fromRaw(model.get('contact_type') + ': ' + model.get('contact_name') + 
                        '<br />' + model.get('phone') + '<br /><a href="' + model.get('website') + '">' + model.get('website') + '</a>'));
                    return this;
                }
            });
            // Declare Backgrid columns
            // TODO: Once we have cgroup data related to each cong,
            //    Add the denomination abbreviation into the name column using a custom renderer
            var columns = [{
                name: "name",
                label: "Name",
                cell: "namedenom",
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
                collection: this.collection
            });
            
            // Render the grid and attach the root to the HTML document
            this.$el.append(grid.render().$el);
            
        }
    });
});