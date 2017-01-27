var proxyMiddleware = require('http-proxy-middleware');
var path = require('path');
// var serveWaterfall  = require('serve-waterfall');

// Configure proxy for Hoodie's api
var proxy = proxyMiddleware('/_api', {
//   target: 'http://localhost:3002/_api'
  target: 'http://localhost:3002'
//   target: {
//     port: 3002,
//     host: 'localhost'
//   }
});

var mapping = {};
var rootPath = (__dirname).split(path.sep).slice(-1)[0];

// Polymer app generator has:
// mapping['/components/' + rootPath  + '/app/bower_components'] = 'bower_components';
mapping['/components/' + rootPath + '/app/bower_components'] = '';

module.exports = {
  verbose: true,
  //root: 'app',
  suites: ['app/test'],
  plugins: {
    local: {
      browsers: ['firefox']
    }
  },
  registerHooks: function(wct) {
    wct.hook('prepare:webserver', function(app, done){
      app.use(proxy);
      done();
    });
  },
  webserver: {
    'pathMappings': [mapping]
  },
  environmentImports: [
    'test-fixture/test-fixture'
  ]
  // TODO: Are these needed, or do they need to be configured,
  //  to prevent the tests from using a different path on the command line
  //  vs. when run in the browser?
//   webserver: {
//     pathMappings: serveWaterfall.mappings.WEB_COMPONENT.concat([
//       {'/components': '../bower_components'},
// //       {'/bower_components': '../bower_components'},
// //       {'/components': 'bower_components'},
// //       {'/components': '../../bower_components'},
//     ]),
//   },
//   urlPrefix: '/components/<basename>'
};
