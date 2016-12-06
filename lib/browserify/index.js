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
var transformObjectAssign = require('babel-plugin-transform-object-assign');
var transformRegenerator = require('babel-plugin-transform-regenerator');
var transformFunctionBind = require('babel-plugin-transform-function-bind');
var transformRuntime = require('babel-plugin-transform-runtime');

var eslintify = require('eslintify');

var path = require('path');

module.exports = function(options) {

  options = options || {};

  return function(content, file, conf) {


    var debug = Boolean(fis.project.currentMedia() === 'dev');

    var _ = fis.util;

    var isDone = false;

    var cache = {},
      pkgCache = {};

    var b = browserify({
      debug: debug,
      extensions: ['.js', '.coffee', '.es6', '.jsx'],
      cache: cache,
      packageCache: pkgCache,
      browserField: false,
      // externalRequireName: "require2"
    });


    b.transform(eslintify, {
      baseConfig: path.join(__dirname, 'eslintrc.js'),
      formatter:'stylish', //codeframe,stylish
      continuous: true
    });

    var bExternal = file['b.external']||[];
    b.external(bExternal);

    //img 路径
    b.transform(resourcesy);
    //编译css
    b.transform(cssy);

    //编译 coffee
    b.transform(coffeeify, {
      bare: false,
      header: true,
      extensions: ['.coffee']
    });

    // 编译 es6 &&  react
    b.transform(babelify, {
      presets: [es2015, react],
      plugins: [
        transformFunctionBind,
        transformObjectAssign,
        transformRegenerator, [transformRuntime, {
          "polyfill": false,
          "regenerator": true
        }]
      ],
      extensions: ['.es6', '.jsx']
    });

    b.transform(includify);

    b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']));

    b.require(conf.filename, options);

    b.on('file', function(bfile, id, parent) {
      file.cache.addDeps(bfile);
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
