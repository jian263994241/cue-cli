var Browserify = require('browserify');
var coffeeify = require('coffeeify')
var simplessy = require('simplessy');
var partialify = require('partialify/custom');
var path = require('path');
var fs = require('fs');
var uglifyify = require("uglifyify");
var dotify = require('dotify');
var babelify = require('babelify');


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
  b.transform(dotify);

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
    process.stdout.write('.');
  });


  var code = '',
    md5, omd5, bfw,
    result;
  bfw = path.join(pRoot, '.browserify');
  if (fis.util.isFile(bfw)) {
    omd5 = fis.util.read(bfw, 'utf8');
  }

  process.nextTick(function() {
    var timer = Date.now();
    b.bundle(function(err, buf) {
      console.log('bundle: ' + (Date.now() - timer) + 'ms');

      if (err) return console.log('\n' + err.toString());

      code = buf.toString();
      md5 = fis.util.md5(code);

      fs.writeFileSync(deployPath, code);
      file.setContent(code);
      file.cache.save(code);

      if (omd5 != md5) {
        fs.writeFileSync(bfw, md5);
      }
    });
  });



  return content;
}