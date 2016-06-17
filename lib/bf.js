var browserify = require('browserify');
var coffeeify = require('./coffeeify')
var partialify = require('partialify/custom');
var path = require('path');
var babelify = require('babelify');

var lessify = require('node-lessify');
var includify = require('includify');
var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({
  browsers: ['last 3 versions']
});
var path = require('path');

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


    b.transform(includify);

    b.transform(coffeeify, {
      bare: false,
      header: true,
      extensions: ['.coffee'],
      experimental: true
    });

    b.transform(babelify, {
      presets: ["es2015", "react"],
      extensions: ['.es6', '.jsx']
    });

    b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json']));

    b.transform(lessify, {
      compileOptions: {
        plugins: [autoprefix]
      }
    });

    b.require(conf.filename, options);

    var asyncFix = _.asyncFix(file);

    fis.once('release:end', bundle);

    function bundle(e) {

      b.bundle(function(err, buf) {
        if (err) return fis.log.error(err);

        content = buf.toString();

        if (file.uglify) {
          content = file.uglify(buf.toString(), file, fis.get('uglifyjs.options'));
        };

        asyncFix(content, e.src);
      });

    };

    if (coffeeify.isCoffee(file.subpath)) {
      content = coffeeify.compile(file.subpath, content);
    }

    return content;
  }

}
