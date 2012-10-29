describe("Reformed Churches Locator", function() {
    var home = 'index.html'

        afterEach(function() {
            // Returns the page to display the home page as it should
            //app.navigate('find_a_church', {trigger:true})
            app.navigate('import_directory', {trigger:true})
            app.navigate(home, {trigger:true})
        });

    describe("'Find a church' page", function() {

        it("should not display an error", function() {
            app.navigate('find_a_church', { trigger: true })
            var content = $('#content').html()
            expect(content).toMatch('Congregations')
            expect(content).not.toMatch('"error":"not_found"')
        });

    });

    describe("'Import a directory' page", function() {

        it("should not display an error", function() {
            app.navigate('import_directory', { trigger: true })
            var content = $('#content').html()
            expect(content).toMatch('downloading')
            expect(content).not.toMatch('"error":"not_found"')
        });
        
        describe('url field', function(){
            it('should display step 2 when a valid URL is entered', function(){
                $('#url').val('http://opc.org/locator.html')
                waitsFor(function(){
                    // TODO: Maybe this is failing because it doesn't wait until after the AJAX call
                    //  completes to run the expect() function below.  So try using a Jasmine
                    //  waitsFor() call.
                    // TODO: Check to see if the AJAX call returned here
                }, "Get URL contents never completed", 1000)
                runs(function(){
                    expect($('#directory_type').is(':visible')).toBe(true)
                })
            })
        })

    });

});

(function() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function(spec) {
        return htmlReporter.specFilter(spec);
    };

    var currentWindowOnload = window.onload;

    window.onload = function() {
        if (currentWindowOnload) {
            currentWindowOnload();
        }
        execJasmine();
    };

    function execJasmine() {
        jasmineEnv.execute();
        // Move Jasmine's symbolSummary to top of page to make it easy to see if 
        //    some tests are not passing
        $('body').prepend('<div id="HTMLReporter" class="jasmine_reporter"><div class="banner"></div></div>')
        $('.banner').first().prepend($('.symbolSummary'))
    }

})();