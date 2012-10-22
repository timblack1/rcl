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
            // TODO: Make this test for an error on the page, or for the correct page content
            app.navigate('find_a_church', { trigger: true })
        });

    });

    describe("'Import a directory' page", function() {

        it("should not display an error", function() {
            // TODO: Create this test
            app.navigate('import_directory', { trigger: true })
        });

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
    }

  })();
