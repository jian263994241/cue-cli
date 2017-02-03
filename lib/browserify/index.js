'use strict';
var path = require('path');

var through2  = require('through2');
var deasync = require('deasync');
var browserify = require('browserify');
var browserifyInc = require('browserify-incremental')
var builtins = require('./lib/builtins');

var coffeeify = require('./coffeeify')
var partialify = require('partialify/custom');

var cssy = require('./cssy');
var resourcesy = require('./resourcesy');
var includify = require('includify');
var eslintify = require('eslintify');
var shimixify = require('shimixify');
var derequire = require('derequire');

var babelify = require('babelify');
var es2015 = require('babel-preset-es2015');
var react = require('babel-preset-react');
var transformObjectAssign = require('babel-plugin-transform-object-assign');
var transformRegenerator = require('babel-plugin-transform-regenerator');
var transformFunctionBind = require('babel-plugin-transform-function-bind');
var transformRuntime = require('babel-plugin-transform-runtime');
var transformClassProperties = require('babel-plugin-transform-class-properties');

var collapser = require('./lib/bundle-collapser/plugin');
/*

调用
常量 B
fis.parser通道

options
{
externals (String||array)  外部文件,不打包
shims  (object)兼容 cnd 引入 变量
entry  (booleen)入口 默认 true

requires (array)打包依赖
}

*/

module.exports = function(options) {

  var defaultOpt = {
    shims: {},
    externals: '', //str or array
    expose: null,
    requires : null,
    standalone: false
  };

  options = Object.assign(defaultOpt, options || {});

  var _ = fis.util;

  var _shimixify = shimixify.configure({
    shims: options.shim
  });

  var _partialify = partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']);

  return function(content, file, conf) {

    var _bID = _.md5(file.origin, 8);

    var currentMedia = fis.project.currentMedia();

    var debug = Boolean(currentMedia === 'dev');

    var cachePath = path.join(fis.project.getCachePath('compile'), 'release-' + currentMedia);

    var cacheFile = path.join(cachePath, 'browserifyInc' + _bID + '.json');

    var isDone = false;

    var bConfig = {
      debug: debug ,
      extensions: ['.js', '.coffee', '.es6', '.jsx'],
      fullPaths: debug,
      cache: {},
      packageCache: {},
      builtins: builtins,
      insertGlobalVars: require('./gloabVars'),
      plugin: [collapser]
    };

    if(options.standalone){
      bConfig.standalone = options.standalone;
    }

    var b = browserify(bConfig);

    browserifyInc(b, {cacheFile: cacheFile});

    if(!options.expose){
      b.add(file.realpath);
    }else{
      b.require(file.realpath, {expose: options.expose});
    }

    if(options.requires){
      options.requires.forEach(function(r){
        if(typeof r === 'string'){
          b.require(r);
        }else{
          b.require(Object.keys(r)[0], {expose : Object.values(r)[0]});
        }
      });
    }

    b.external(options.externals);

    b.pipeline.get('deps')
    .on('data', function(obj){
      file.cache.addDeps(obj.file);
    });

    b.transform(eslintify, {
      baseConfig: require('./eslintrc'),
      formatter:'codeframe', //codeframe,table,stylish
      continuous: true,
      useEslintrc: false
    });

    //编译css
    b.transform(cssy, {
      global: true
    });

    //img 路径
    b.transform(resourcesy);

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
        transformClassProperties,
        transformRegenerator, [transformRuntime, {
          "polyfill": false,
          "regenerator": true
        }]
      ],
      extensions: ['.es6', '.jsx']
    });

    b.transform(includify);

    b.transform(_partialify);

    b.transform(_shimixify);

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

    b.bundle().on('error', function(err){
      isDone = true;
      console.log(err.stack? err.stack : err);
      fis.once('release:end', function() {
        _.del(file.cache.cacheInfo);
      });
    }).pipe(stream);

    // 使用 deasync 让 browserify 同步输出到 content
    deasync.loopWhile(function() {
      return !isDone;
    });

    content = buffer;

    if(options.standalone){
      content = derequire(content, [ { from: 'require', to: '_dereq_' }, { from: 'define', to: '_defi_' } ]);
    }

    return content;
  }

}
