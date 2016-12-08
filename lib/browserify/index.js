'use strict';
var through2  = require('through2');
var deasync = require('deasync');
var browserify = require('browserify');
var browserifyInc = require('browserify-incremental')

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
var fs = require('fs');


module.exports = function(options) {

  options = options || {};

  return function(content, file, conf) {


    var debug = Boolean(fis.project.currentMedia() === 'dev');

    var _ = fis.util;

    var isDone = false;

    var b = browserify({
      debug: debug ,
      extensions: ['.js', '.coffee', '.es6', '.jsx'],
      cache: {},
      packageCache: {},
      detectGlobals: true,
      insertGlobalVars: require('./gloabVars')
    });

    var cachePath = fis.project.getCachePath('browserify');

    if(!fs.existsSync(cachePath)){
      fs.mkdirSync(cachePath);
    }

    browserifyInc(b, {cacheFile: path.join(cachePath, file.moduleId+'.json')});

    b.transform(eslintify, {
      baseConfig: require('./eslintrc'),
      formatter:'codeframe', //codeframe,table
      continuous: true,
      useEslintrc: false
    });

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

    b.transform(require('shimixify').configure({
      shims: (file['b.shim'] || {})
    }));

    b.external(
      (file['b.external']||[])
    );

    b.add(conf.filename, options);

    b.on('file', function(bfile, id, parent) {
      file.cache.addDeps(bfile);
    });


    var buffer = '';

    var stream = through2(write,end);

    function write(chunk, enc, next){
      buffer += chunk.toString();
      next();
    }

    function end(done){
      isDone = true;
      done();
    }

    b.bundle().pipe(stream);

    // 使用 deasync 让 browserify 同步输出到 content
    deasync.loopWhile(function() {
      return !isDone;
    });

    content = buffer;

    // b.bundle(function(err, buf) {
    //   if (err) {
    //     console.log(err.toString().red);
    //     fis.once('release:end', function() {
    //       _.del(file.cache.cacheInfo);
    //     });
    //   } else {
    //     content = buf.toString();
    //   }
    //   console.log(true);
    //   isDone = true;
    // });

    return content;
  }

}
