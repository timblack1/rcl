describe("Reformed Churches Locator", function() {

    afterEach(function() {
        // Returns the page to display the home page as it should
        app.navigate(config.test_home_page, {trigger:true})
        app.navigate(config.test_home_address, {trigger:true})
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
                runs(function(){
                    $('#url').val('http://opc.org/locator.html')
                    $('#url').focus().keyup()
//                    var press = $.Event('keypress')
//                    press.ctrlKey = false
//                    press.which = 37
//                    $('#url').trigger(press)
                })                
                waitsFor(function(){
                    // TODO: See if we can get the test to wait until the AJAX call completes
                    //  https://blueprints.launchpad.net/reformedchurcheslocator/+spec/use-jasmine-waitsfor-in-tests
                    // Check to see if the AJAX call returned here
                    console.log(window.app.status.got_url_html)
                    return window.app.status.got_url_html
                }, "Get URL HTML", 2000)
                runs(function(){
                    expect($('#directory_type').is(':visible')).toBe(true)
                })
            })
        })

    });

});

// General test-runner code
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