'use strict';
var deasync = require('deasync');
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

module.exports = function(options) {

  options = options || {};

  return function(content, file, conf) {


    var debug = Boolean(fis.project.currentMedia() == 'dev');

    var _ = fis.util;

    var isDone = false;

    var cache = {},
      pkgCache = {};

    var b = browserify({
      debug: debug,
      extensions: ['.js', '.coffee', '.es6', '.jsx'],
      cache: cache,
      packageCache: pkgCache,
      fullPaths: true,
      externalRequireName: "require2"
    });

    b.transform(resourcesy);

    b.transform(coffeeify, {
      bare: false,
      header: true,
      extensions: ['.coffee']
    });


    b.transform(babelify, {
      presets: [es2015, react],
      extensions: ['.es6', '.jsx']
    });

    b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']));

    b.transform(cssy);


    b.transform(includify);

    b.require(conf.filename, options);

    b.on('file', function(depFilePath) {
      // find dependences
      if (depFilePath !== file.realpath) {
        file.cache.addDeps(depFilePath);
      }
    });

    b.bundle(function(err, buf) {
      if (err) {
        console.log('\n', err.toString().red);
        fis.once('release:end', function() {
          _.del(file.cache.cacheInfo);
        });
      } else {
        content = buf.toString();
      }
      isDone = true;
    });

    // 使用 deasync 让 browserify 同步输出到 content
    deasync.loopWhile(function() {
      return !isDone;
    });

    return content;
  }

}
