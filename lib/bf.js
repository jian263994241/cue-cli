var Browserify = require('browserify');
var coffeeify = require('coffeeify');
var partialify = require('partialify/custom');
var path = require('path');
var fs = require('fs');
var UglifyJS = require("uglify-js");

module.exports = function(content, file, conf) {

  var debug = fis.isDebug(),
    uglify = file.optimizer;

  var deployPath;
  var pRoot = fis.project.getProjectPath();

  if (fis.project.getDistDir()) {
    deployPath = fis.project.getDistDir();
  } else if (file.deploy) {
    deployPath = path.join(pRoot, file.deploy.to);
  } else {
    deployPath = fis.project.getTempPath('www');
  };

  var _ = fis.util;

  if (file.useHash) {
    deployPath = path.join(deployPath, file.getHashRelease());
  } else {
    deployPath = path.join(deployPath, file.release);
  }


  var b = Browserify({
    extensions: ['.coffee', '.js'],
    debug: debug
  });
  b.add(conf.filename);

  if (file.ext == '.coffee') {
    b.transform(coffeeify, {
      bare: false,
      header: true
    });
  };

  b.transform(partialify.alsoAllow(['xml', 'csv', 'svg', 'less', 'scss']));

  b.on('file', function(dep, id, parent) {
    if (dep.match(pRoot)) {
      file.cache.addDeps(dep);
      file.addRequire(dep);
    };
  });

  process.nextTick(function() {
    var code,result;
    b.bundle(function(err, buf) {
      if(uglify){
        result = UglifyJS.minify(buf.toString(), {fromString: true});
        code = result.code;
      }else{
        code = buf.toString();
      }
      file.setContent(code);
      file.cache.save(code);
      fs.writeFileSync(deployPath, code);
    });
    fis.time('\n[Browserify]');
  });

  return '';
}
