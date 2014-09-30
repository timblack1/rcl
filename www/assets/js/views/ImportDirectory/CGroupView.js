define([
        'config',
        'model',
        'mustache',
        'text!views/ImportDirectory/CGroup.html',
        'typeahead'
        ], 
        function(config, model, Mustache, template){

    return Backbone.View.extend({
        initialize:function(){
            // Make it easy to reference this object in event handlers
            _.bindAll(this, 'update', 'save');
            this.listenTo(this.model, "change", this.update);
            // Get array of cgroups from model
            this.cgroups = new model.CGroups
            this.cgroups.fetch()
        },
        render: function(){
            this.$el.html(Mustache.render(template));
            this.delegateEvents()
            // Populate form fields with initial values found in the model, so user can edit them
            this.$('#cgroup_name').val(this.model.get('name'))
            this.$('#abbreviation').val(this.model.get('abbreviation'))
            // Render typeaheads for CGroup name, abbreviation textboxes
            // TODO: Consider filtering and sorting by levenshtein distance
            var substringMatcher = function(strs) {
              return function findMatches(q, cb) {
                var matches, substrRegex;

                // an array that will be populated with substring matches
                matches = [];

                // regex used to determine if a string contains the substring `q`
                substrRegex = new RegExp(q, 'i');

                // iterate through the pool of strings and for any string that
                // contains the substring `q`, add it to the `matches` array
                $.each(strs, function(i, str) {
                  if (substrRegex.test(str)) {
                    // the typeahead jQuery plugin expects suggestions to a
                    // JavaScript object, refer to typeahead docs for more info
                    matches.push({ value: str });
                  }
                });

                cb(matches);
              };
            };
            // CGroup name
            this.$('.cgroup_name').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            },{
                name: 'cgroups',
                displayKey: 'value',
                source: substringMatcher(this.cgroups.pluck('name'))
            })
            // CGroup abbreviation
            this.$('.abbreviation').typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            },{
                name: 'cgroups',
                displayKey: 'value',
                source: substringMatcher(this.cgroups.pluck('abbreviation'))
            })
            // On option selection event, save the model
            this.$('#cgroup_name').on('typeahead:selected', this.save)
            this.$('#abbreviation').on('typeahead:selected', this.save)
        },
        events: {
            'change #cgroup_name': 'save',
            'change #abbreviation': 'save'
        },
        update:function(){
            this.$('#cgroup_name').val(this.model.get('name'))
            this.$('#abbreviation').val(this.model.get('abbreviation'))
        },
        save:function(){
            this.model.save({
                'name': this.$('#cgroup_name').val(),
                'abbreviation': this.$('#abbreviation').val()
            })
        }
    });
});



