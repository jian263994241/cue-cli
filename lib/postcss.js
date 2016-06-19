
var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var postcssLess = require('postcss-less');
var path = require('path');

var less = require('less');


module.exports = function(content, file, conf) {

  var _ = fis.util;

  if(file.isCssLike){

    var postcssPlus = [autoprefixer({ browsers: ['last 3 versions'] })];

    var opts = {};

    opts.map = { annotation: false };

    if(file.ext===".less"){
      opts.syntax = postcssLess;
    };

    content = postcss(postcssPlus).process(content,opts).css;

    var nInfo = path.parse(file.filename);

    if(file.ext==".less"){
      conf = _.assign({
        syncImport: true,
        relativeUrls: true
      }, conf);

      var sourceMap = {};
      var sourceMapFile;

      var sourceMapPath = file.realpath + '.map';
      sourceMapFile = fis.file.wrap(sourceMapPath);

      sourceMapFile.setContent('');

      conf.sourceMap = _.assign({
        outputSourceFiles: true,
        sourceMapURL: sourceMapFile.subpath,
        sourceMapBasepath: fis.project.getProjectPath(),
        sourceMapRootpath: '/source',
        sourceMapFileInline: false
      }, sourceMap);

      // 初始化 less 查询路径
      var confPaths = conf.paths || [];
      [file.dirname, fis.project.getProjectPath()].forEach(function(item) {
        if (_.indexOf(confPaths, item) === -1) {
          confPaths.push(item);
        }
      });
      conf.paths = confPaths;

      less.render(content, conf, function(err, result) {
        if (err) {
          throw err;
        }
        content = result.css;

        if (sourceMapFile && result.map) {
          sourceMapFile.setContent(result.map.toString());
          file.derived.push(sourceMapFile);
        }

        result.imports.forEach(function(path) {
          file.cache.addDeps(path);
        });
      });

    };

  }

  return content;

}
