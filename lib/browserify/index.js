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

var shimixify = require('shimixify');

var path = require('path');

/*

调用
常量 B
fis.parser通道

options
{
external (String||array)  外部文件,不打包
shims  (object)兼容 cnd 引入 变量
entry  (booleen)入口 默认 true

requires (array)打包依赖
}

*/

// file.empty (booleen)标记空文件, 不包含输出到打包文件

module.exports = function(options) {

  var defaultOpt = {
    shims: {},
    external: '',
    entry: true,
    requires : undefined
  };

  options = Object.assign(defaultOpt, options || {});

  var _ = fis.util;

  var hash =  _.md5(process.cwd(), 8);

  var cachePath = fis.project.getCachePath('compile');

  var _shimixify = shimixify.configure({
    shims: options.shims
  });

  var _partialify = partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json', 'tpl']);

  var cacheDeps = {};

  return function(content, file, conf) {

    var debug = Boolean(fis.project.currentMedia() === 'dev');

    var isDone = false;

    var opts = Object.assign({}, options);

    if(!cacheDeps[file.origin]){
      cacheDeps[file.origin] = [];
    }

    var b = browserify({
      debug: debug ,
      extensions: ['.js', '.coffee', '.es6', '.jsx'],
      fullPaths: true,
      cache: {},
      packageCache: {},
      detectGlobals: true,
      insertGlobalVars: require('./gloabVars')
    });

    var cacheFile = path.join(cachePath, file.id + '-' + hash + '.json');

    b.external(options.external);

    if(options.requires){

      options.requires.forEach(function(dep){
        b.require(dep.path, {expose : dep.expose});
      });

    }

    b.pipeline.get('deps')
    .on('data', function(obj){
      file.cache.addDeps(obj.file);
    })
    .on('end', function(){
      //end
    });

    b.transform(eslintify, {
      baseConfig: require('./eslintrc'),
      formatter:'stylish', //codeframe,table,stylish
      continuous: true,
      useEslintrc: false
    });

    //编译css
    b.transform(cssy);

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
      // sourceMaps: false,
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

    b.transform(_partialify);

    b.transform(_shimixify);

    browserifyInc(b, {cacheFile: cacheFile});

    delete opts.external;
    delete opts.shims;
    delete opts.deps;

    if(!file.empty){
      b.require(conf.filename, opts);
    }

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
      console.log(err.stack.red);
      fis.once('release:end', function() {
        _.del(file.cache.cacheInfo);
      });
      isDone = true;
    }).pipe(stream);

    // 使用 deasync 让 browserify 同步输出到 content
    deasync.loopWhile(function() {
      return !isDone;
    });

    content = buffer;


    return content;
  }

}
