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
        function state_page_is_visible(){
            return $('#state_page').is(':visible') || ($('#state_page').css('display') != 'none')
        }
        describe('url field', function(){
            it('should display step 2 when a valid URL is entered', function(){
                // TODO: Because this test writes to the database, decide whether 
                //  the tests should run in a test copy of the database.
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML", 60000)
                runs(function(){
                    expect($('#directory_type').is(':visible')).toBe(true)
                    // Remove the docs we just created
                    // TODO: Figure out how to refactor this into a general function that can be used in all tests
//                    dir.destroy()
                    // TODO: Improve this to only remove the docs created by this test, rather
                    //  than all docs.
//                    $('#delete_all_docs').click()
                })
            })
        })

        describe('state section', function(){
            it('should display when radio button is clicked', function(){
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML")
                runs(click_state_radio_button)
                waitsFor(state_page_is_visible, 'state page to display', 20000)
                runs(function(){
                    expect($('#state_page').is(':visible')).toBe(true)
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
                waitsFor(state_page_is_visible, 'state page to display', 20000)
                runs(function(){
                    $('#state_drop_down_selector select[name=state]').click()
                })
                waitsFor(function(){
                    return $('#cong_details_url_selector').is(':visible')
                },'cong_details_url_selector to be visible', 20000)
                runs(function(){
                    expect($('#cong_details_url_selector').is(':visible')).toBe(true)
                    // Remove the docs we just created
//                    dir.destroy()
//                    $('#delete_all_docs').click()
                })
            })
        })
        // TODO: Write test to click on the element with this XPATH:
        //  //*[@id="churchListTable"]/tbody/tr[2]/td[1]/a
        describe('get congregation id', function(){
            it('should display when link is clicked', function(){
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML")
                runs(click_state_radio_button)
                waitsFor(state_page_is_visible, 'state page to display', 20000)
                runs(function(){
                    $('#state_drop_down_selector select[name=state]').click()
                })
                waitsFor(function(){
                    return $('#cong_details_url_selector').is(':visible')
                },'cong_details_url_selector to be visible', 60000)
                runs(function(){
                    expect($('#cong_details_url_selector').is(':visible')).toBe(true)
                    // Remove the docs we just created
//                    dir.destroy()
//                    $('#delete_all_docs').click()
                })
                waitsFor(function(){
                    return $('#cong_details_url_selector').html().indexOf('Step 4.5') != -1
                },'cong_details_url_selector to display step 4.5', 60000)
                runs(function(){
                    expect($('#cong_details_url_selector').html()).toMatch('Step 4.5')
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