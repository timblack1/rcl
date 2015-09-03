Compare the URLs at which the tests run.

yo:
CLI tests run them from this URL:
localhost:2000/components/tmp/ (maps to .)

rcl:
CLI tests run them from this URL:
localhost:2000/components/app/ (maps to app/ because wct.conf.js exports `root: 'app'`)
Browser tests run at this URL:
http://localhost:3000/test/ (maps to app/test/)


In my tests I'm having to duplicate imports with slightly different paths like this:
```html
  <link rel="import" href="../../bower_components/polymer/polymer.html">
  <!--  Needed for running the tests from the command-line  -->
  <link rel="import" href="../../../bower_components/polymer/polymer.html">
```
What can I do to avoid this duplication? The key difference I know of between my 
setup and that of the Polymer Starter Kit is that I've put my tests into my 
app/elements/element-name directories.

Hm...I put the tests back into the /test directory (not under /app/elements) and 
I still have the same problem. So the other difference between my setup and the 
Polymer Starter Kit is that I don't run gulp test because some of my tests require
 starting up Hoodie first, so instead I run
`node_modules/hoodie-server/bin/start --custom-ports=3002,3003,3004 & pid=$! && wct && kill $pid`
and have some customizations to wct.conf.js, specifically, I've added the following:
```javascript
var proxyMiddleware = require('http-proxy-middleware');

// Configure proxy for Hoodie's api
var proxy = proxyMiddleware('/_api', {
  // target: 'http://localhost:3002/_api'
  target: {
    port: 3002,
    host: 'localhost'
  }
});

module.exports = {
  // ...
  registerHooks: function(wct) {
    wct.hook('prepare:webserver', function(app, done){
      app.use(proxy);
      done();
    });
  },
  // ...
}
```
`gulp.task('serve')` is modified similarly, with the same proxy. I can't figure out why
the tests run correctly in the browser, but not from the command line.
