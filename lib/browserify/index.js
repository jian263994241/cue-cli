var browserify = require('browserify');
var coffeeify = require('./coffeeify')
var partialify = require('partialify/custom');

var cssy = require('./cssy');
var resourcesy = require('./resourcesy');
var includify = require('includify');

var babelify = require('babelify');
var es2015 = require('babel-preset-es2015');
var react = require('babel-preset-react');

var path = require('path');

var _ = require('../core/util');
var last;
var time = _.debounce(function() {
  console.log(' %sms'.green.bold, (Date.now() - last));
  last = Date.now();
}, 300, {
  'leading': true,
  'trailing': false
});

module.exports = function(options) {

  options = options || {};

  return function(content, file, conf) {


    var debug = Boolean(fis.project.currentMedia() == 'dev');
    var _ = fis.util;

    var cache = {},
      pkgCache = {};

    var b = browserify({
      debug: debug,
      extensions: ['.js', '.coffee', '.es6', '.jsx'],
      cache: cache,
      packageCache: pkgCache,
      fullPaths: true,
      externalRequireName: "$require"
    });

    b.transform(resourcesy);

    b.transform(coffeeify, {
      bare: false,
      header: true,
      extensions: ['.coffee'],
      experimental: true
    });


    b.transform(babelify, {
      presets: [es2015, react],
      extensions: ['.es6', '.jsx']
    });

    b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']));

    b.transform(cssy);


    b.transform(includify);

    b.require(conf.filename, options);

    var asyncFix = _.asyncFix(file);

    fis.once('release:end', bundle);

    function bundle(e) {

      last = Date.now();
      b.bundle(function(err, buf) {
        if (err) return console.log('\n'+err.stack);

        content = buf.toString();

        if (file.uglify) {
          content = file.uglify(buf.toString(), file, fis.get('uglifyjs.options'));
        };

        asyncFix(content, e.src);
        time();
      });

    };
    return content;
  }

}
