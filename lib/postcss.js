
var postcss = require('postcss');
var path = require('path');
var less = require('less');

function writeMap(file, content, map){
  var sourceMapPath, sourceMapFile;
  if(map){
    sourceMapPath = file.realpath + '.map';
    sourceMapFile = fis.file.wrap(sourceMapPath);
    sourceMapFile.setContent(map);
    content = cssprocess.css + '/*# sourceMappingURL= '+ sourceMapFile.url +' */';
  }
  return content;
}


module.exports = function(content, file, conf) {

  var _ = fis.util;

  if(!file.isCssLike){
    return fis.log.warn(conf.filename + ' is not css file.');
  };

  var isLessLike = /\.less$|\.lessm$/.test(conf.filename);

  if (isLessLike) {

    conf = _.assign({
      syncImport: true,
      relativeUrls: true
    }, conf);

    var sourceMap = {};
    var sourceMapFile;

    conf.sourceMap = _.assign({
      // outputSourceFiles: true,
      // sourceMapURL: sourceMapFile.subpath,
      // sourceMapBasepath: fis.project.getProjectPath(),
      // sourceMapRootpath: '/source',
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
        content = writeMap(file, content, result.map.toString());
        file.derived.push(sourceMapFile);
      }
      result.imports.forEach(function(path) {
        file.cache.addDeps(path);
      });
    });

  };

  var safe = require('postcss-safe-parser');
  var sorting = require('postcss-sorting');
  var autoprefixer = require('autoprefixer');

  var postcssPlus = [
    sorting(),
    autoprefixer({ browsers: ['> 1%', 'iOS 7'] })
  ];


  var cssprocess = postcss(postcssPlus).process(content, {
    parser: safe
  });

  content = writeMap(file, content, cssprocess.map);

  return content;
};
