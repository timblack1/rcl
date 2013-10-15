describe("Reformed Churches Locator", function() {
    
    // Set this to increase or decrease the tests' timeout
    var timeout = 40000
    
    afterEach(function() {
        // Remove the docs we just created
        // TODO: Figure out how to refactor this into a general function that can be used in all tests
        // dir.destroy()
        // TODO: Improve this to only remove the docs created by this test, rather
        //  than all docs.
        // $('#delete_all_docs').click()
        // Returns the page to display the home page as it should
        app.navigate(window.app.config.test_home_address, {trigger:true})
    });

    describe("'Find a church' page", function() {
        it("should not display an error", function() {
            app.navigate('find_a_church', { trigger: true })
            var content = $('#content').html()
            expect(content).toMatch('Find a church')
        });
    });

    // TODO: Get import a directory page working again
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
            return ($('#steps').html().indexOf('Step 2') !== -1)
        }
        function click_state_radio_button(){
            $("#one_state_per_page").prop("checked",true)
            $("#one_state_per_page").click()
        }
        function state_drop_down_selector(){
            $('#state_drop_down_selector select[name=state]').click()
        }
        function state_page_is_visible(){
            return ($('#steps').html().indexOf('Step 3') !== -1)
        }
        function click_cong_anchor(){
            // TODO: Write test to click on the element with this XPATH:
            //  //*[@id="churchListTable"]/tbody/tr[2]/td[1]/a
            // console.log($.xpath('//*[@id="churchListTable"]/tbody/tr[2]/td[1]/a'))
            // $.xpath('//*[@id="churchListTable"]/tbody/tr[2]/td[1]/a').click()
            $('a[class=lista]')[0].click()
        }
        function cong_details_url_selector_visible(){
            return $('#steps').html().indexOf('Directory of Congregations') != -1
        }
        function cong_details_id_selector_visible(){
            return $('#steps').html().indexOf('Step 4.5') != -1
        }
        function click_cong_id_yes_button(){
            console.log($('#cong_details_url_selector #yes'))
            $('#cong_details_url_selector #yes').click()
        }
        function step_5_visible(){
            return $('#steps').html().indexOf('Step 5') != -1
        }
        // These specs are nested because the later ones depend on the earlier ones
        describe('url field', function(){
            it('should display step 2 when a valid URL is entered', function(){
                // Note:  Because this test writes to the database, it runs in a test copy of the database
                runs(trigger_url_field)
                waitsFor(directory_type_is_visible, "AJAX call to get URL HTML", timeout)
                runs(function(){
                    expect($('#steps').html()).toContain('Step 2')
                })
            })
            describe('state section', function(){
                it('should display when radio button is clicked', function(){
                    runs(click_state_radio_button)
                    waitsFor(state_page_is_visible, 'state page to display', timeout)
                    runs(function(){
                        expect($('#steps').html()).toContain('Step 3')
                    })
                })
                describe('cong details', function(){
                    it('should display when select box is clicked', function(){
                        runs(state_drop_down_selector)
                        waitsFor(cong_details_url_selector_visible,'cong_details_url_selector to be visible', timeout)
                        runs(function(){
                            expect(cong_details_url_selector_visible()).toBe(true)
                        })
                    })
                    describe('get congregation id', function(){
                        it('should display when link is clicked', function(){
                            waitsFor(cong_details_url_selector_visible,'cong_details_url_selector to be visible', timeout)
                            runs(click_cong_anchor)
                            waitsFor(cong_details_id_selector_visible,'cong_details_url_selector to display step 4.5', timeout)
                            runs(function(){
                                expect($('#steps').html()).toMatch('Step 4.5')
                            })
                        })
                        describe('cong_details_selector_page', function(){
                            it('should display when button is clicked', function(){
                                console.log('After Cong Details ID Selector Visible')
                                runs(click_cong_id_yes_button)
                                waitsFor(step_5_visible,'cong_details_fields to display step 5', timeout)
                                runs(function(){
                                    // TODO: Start Here: modify this section to work in this test
                                    expect($('#steps').html()).toMatch('Step 5')
                                })
                            })
                        })
                    })
                })
            })
        })
    })
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
//     var currentWindowOnload = window.onload;
//     window.onload = function() {
//         if (currentWindowOnload) {
//             currentWindowOnload();
//         }
//         execJasmine();
//     };
    function execJasmine() {
        jasmineEnv.execute();
        // Move Jasmine's symbolSummary to top of page to make it easy to see if
        //    some tests are not passing
        $('body > .container').prepend('<div id="HTMLReporter" class="jasmine_reporter"><div class="banner"></div></div>')
        $('.banner').first().prepend($('.symbolSummary'))
    }
    execJasmine()
})();
