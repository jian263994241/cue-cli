var Browserify = require('browserify');
var coffeeify = require('coffeeify');
var partialify = require('partialify/custom');
var path = require('path');
var fs = require('fs');


module.exports = function(content, file, conf) {

  var debug = fis.project.currentMedia() =='dev'? true:false ;

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

  if(file.useHash){
    deployPath = path.join(deployPath, file.getHashRelease());
  }else{
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
    if(dep.match(pRoot)){
      file.cache.addDeps(dep);
      file.addRequire(dep);
    };
  });

  process.nextTick(function() {
    b.bundle(function(err,buf){
      file.setContent(buf);
      file.cache.save(buf);
    }).pipe(fs.createWriteStream(deployPath));
    fis.time('\n[Browserify]');
  });

  return '';
}
