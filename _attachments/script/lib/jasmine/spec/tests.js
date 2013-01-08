describe("Reformed Churches Locator", function() {

    afterEach(function() {
        // Returns the page to display the home page as it should
        app.navigate(config.test_home_address, {trigger:true})
    });

    describe("'Find a church' page", function() {
        it("should not display an error", function() {
            app.navigate('find_a_church', { trigger: true })
            var content = $('#content').html()
            expect(content).toMatch('Find a church')
        });
    });

    describe("'Import a directory' page", function() {
        it("should not display an error", function() {
            app.navigate('import_directory', { trigger: true })
            var content = $('#content').html()
            expect(content).toMatch('downloading')
        });
        function trigger_url_field(){
            $('#url').val('http://opc.org/locator.html')
            $('#url').focus().keyup()
        }
        function directory_type_is_visible(){
            // The test should wait until the AJAX call completes
            // Check to see if the AJAX call returned here
            return $('#directory_type').is(':visible')
        }
        function click_state_radio_button(){
            $("#one_state_per_page").prop("checked",true)
            $("#one_state_per_page").click()
        }
        describe('url field', function(){
            it('should display step 2 when a valid URL is entered', function(){
                // TODO: Because this test writes to the database, decide whether 
                //  the tests should run in a test copy of the database.
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML")
                runs(function(){
                    expect($('#directory_type').is(':visible')).toBe(true)
                    // Remove the docs we just created
//                    dir.destroy()
                    // TODO: Improve this to only remove the docs created by this test, rather
                    //  than all docs.
//                    $('#delete_all_docs').click()
                })
            })
        })

        describe('state page', function(){
            it('should display when radio button is clicked', function(){
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML")
                runs(function(){
                    // TODO: For some reason this click's effect is not being detected in the waitsFor call below
                    // TODO: Is the problem that the click handler hasn't been set before the waitsFor call runs?
                    //  This may be the case.
                    $("#one_state_per_page").on('click',function(){
                        console.log($('#one_state_per_page').data('events').click)
                    })
                    $("#one_state_per_page").prop("checked",true)
                    $("#one_state_per_page").click()
                })
                waitsFor(function(){
                    //console.log($('#state_page').is(':visible'))
                    return $('#state_page').is(':visible') || ($('#state_page').css('display') != 'none')
                }, 'state page to display', 1000)
                runs(function(){
                    expect($('#state_page').is(':visible').toBe(true))
                    console.log('does this run?')
                    // Remove the docs we just created
//                    dir.destroy()
//                    $('#delete_all_docs').click()
                })
            })
        })
        describe('cong details', function(){
            it('should display when select box is clicked', function(){
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML")
                runs(click_state_radio_button)
                waitsFor(function(){
                    //console.log($('#state_page').is(':visible'))
                    return $('#state_page').is(':visible') || ($('#state_page').css('display') != 'none')
                }, 'state page to display', 1000)
                runs(function(){
                    expect($('#state_page').is(':visible').toBe(true))
                    console.log('does this run?')
                    // Remove the docs we just created
//                    dir.destroy()
//                    $('#delete_all_docs').click()
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