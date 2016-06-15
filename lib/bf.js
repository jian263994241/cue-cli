var browserify = require('browserify');
var coffeeify = require('coffeeify')
var partialify = require('partialify/custom');
var path = require('path');
var babelify = require('babelify');
var lessify = require('node-lessify');
var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({
  browsers: ['last 3 versions']
});
var path = require('path');

module.exports = function(content, file, conf) {

  var debug = Boolean(fis.project.currentMedia() == 'dev');
  var _ = fis.util;


  var cache = {},
    pkgCache = {};

  var b = browserify({
    debug: debug,
    extensions: ['.js', '.coffee', '.es6', '.jsx'],
    cache: cache,
    packageCache: pkgCache,
    fullPaths: true
  });


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


  // b.add(conf.filename);

  b.require(conf.filename, {
    entry: true
  });

  fis.once('release:end', bundle);

  function bundle(e) {

    var asyncFix = _.asyncFix(file);

    b.bundle(function(err, buf) {
      if (err) return fis.log.error(err.stack);

      content = buf.toString();

      if (file.uglify) {
        content = file.uglify(buf.toString(), file, fis.get('uglifyjs.options'));
      };

      asyncFix(content, e.src);
    });

  };
  return content;
}
