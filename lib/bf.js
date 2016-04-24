var Browserify = require('browserify');
var coffeeify = require('coffeeify')
var simplessy = require('simplessy');
var partialify = require('partialify/custom');
var path = require('path');
var babelify = require('babelify');

module.exports = function(content, file, conf) {

  var media = fis.project.currentMedia();
  var _ = fis.util;

  var b = Browserify({
    debug: media === 'dev',
    extensions: [file.ext]
  });

  switch (file.ext) {
    case '.coffee':
      b.transform(coffeeify, {
        bare: false,
        header: true,
        extensions: [file.ext],
        experimental: true
      });
      break;
    case '.es6':
      b.transform(babelify, {
        presets: ["es2015"],
        extensions: [file.ext]
      });
      break;
    case '.jsx':
      b.transform(babelify, {
        presets: ["es2015", "react"],
        extensions: [file.ext]
      });
      break;
  }
  b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json']));
  b.transform(simplessy, {
    global: true
  });

  // b.add(conf.filename);

  b.require(conf.filename, {
    entry: true
  });

  b.once('file', function(dep, id, parent) {
    if (dep.match(root)) {
      file.cache.addDeps(dep);
      file.addRequire(dep);
    };
  });

  var code = '',
    md5, omd5, bfw,
    result;

  var originHash = file.getHash();
  var cacheFile = fis.file(file.cache.cacheFile);

  file.browserify = b;


  return content;
}
