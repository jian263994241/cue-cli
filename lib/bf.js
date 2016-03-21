var Browserify = require('browserify');
var coffeeify = require('coffeeify')
var simplessy = require('simplessy');
var partialify = require('partialify/custom');
var path = require('path');
var fs = require('fs');
var uglifyify = require("uglifyify");

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
    debug: debug,
    extensions: [file.ext]
  });

  switch (file.ext) {
    case '.coffee':
      b.transform(coffeeify, {
        bare: false,
        header: true,
        extensions: [file.ext],
        experimental:true
      });
      break;
    case '.es6':
    case '.jsx':
      break;
  }
  b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json']));
  b.transform(simplessy, {
    global: true
  });
  if (uglify) {
    b.transform(uglifyify, {
      global: true
    })
  }
  // b.add(conf.filename);

  b.require(conf.filename, {
    entry: true
  })

  b.on('file', function(dep, id, parent) {
    if (dep.match(pRoot)) {
      file.cache.addDeps(dep);
      file.addRequire(dep);
    };
  });


  var code = '',
    result;
  b.bundle(function(err, buf) {
   
    if (err) return console.log('\n' + err.toString());

    code = buf.toString();

    file.setContent(code);
    file.cache.save(code);
    fs.writeFileSync(deployPath, code);

  });



  return '';
}
