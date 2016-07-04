var browserify = require('browserify');
var coffeeify = require('./coffeeify')
var partialify = require('partialify/custom');
var reactify = require('reactify');
var cssy = require('./cssy');
var resourcesy = require('./resourcesy');
var includify = require('includify');

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

    b.transform(resourcesy);

    b.transform(coffeeify, {
      bare: false,
      header: true,
      extensions: ['.coffee'],
      experimental: true
    });

    b.transform(reactify, {
      es6:true,
      target:'es5',
      extensions: ['.es6', '.jsx']
    });

    b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']));

    b.transform(cssy);

    // b.plugin(cssModulesify, {
    //   rootDir:fis.project.getProjectPath(),
    //   output:'mycss.css',
    //   global:true
    // });


    b.transform(includify);

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
    return content;
  }

}
