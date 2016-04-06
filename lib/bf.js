var Browserify = require('browserify');
var coffeeify = require('coffeeify')
var simplessy = require('simplessy');
var partialify = require('partialify/custom');
var path = require('path');
var uglifyify = require("uglifyify");
var dotify = require('dotify');
var babelify = require('babelify');

module.exports = function(content, file, conf) {

  var debug = fis.isDebug();
  var _ = fis.util;

  var dest, deployFile;
  var root = fis.project.getProjectPath();

  if (fis.project.getDistDir()) {
    dest = fis.project.getDistDir();
  } else if (file.deploy) {
    dest = path.resolve(process.cwd(), file.deploy.to);
  } else {
    dest = fis.project.getTempPath('www');
  };

  var replacePath = function(filePath, b, a) {
    var str;
    if (_.isFile(filePath)) {
      str = _.read(filePath, 'utf8');
      str = str.replace(new RegExp(b, 'g'), a);
      _.write(filePath, str);
    }
  };

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

  if (file.optimizer) {
    b.transform(uglifyify, {
      global: true
    })
  }
  // b.add(conf.filename);

  b.require(conf.filename, {
    entry: true
  })

  b.on('file', function(dep, id, parent) {
    process.stdout.write('.');
    if (dep.match(root)) {
      file.cache.addDeps(dep);
      file.addRequire(dep);
    };
  });

  var code = '',
    md5, omd5, bfw,
    result;

  var originHash = file.getHash();

  // bfw = path.join(root, '.browserify');
  // if (_.isFile(bfw)) {
  //   omd5 = _.read(bfw, 'utf8');
  // }

  // fis.on('release:end', bundle);
  process.nextTick(bundle);

  function bundle() {
    var rFile = path.join(dest, file.getHashRelease());
    file.useHash && _.del(rFile);

    var timer = Date.now();

    console.log('\n\n [INFO] '.cyan + 'Browserify is running (%s)\n', __filename);
    process.stdout.write(' Ω '.green.bold);

    b.on('bundle', function(bundle) {
      bundle.on('data', function() {
        process.stdout.write('.');
      })
    });

    b.bundle(function(err, buf) {

      if (err) return fis.emit('live:reload')&&console.log('\n' + err.toString());

      code = buf.toString();
      md5 = _.md5(code, originHash.length);

      var bname = path.basename(file.release, file.ext);

      if (file.useHash) {
        deployFile = rFile.replace(/(.*_).*(\.js)/, '$1' + md5 + '$2');
        _.find(dest, ['*.html'], ['res/**', 'third/**', 'mod/**', 'output/**'], dest).forEach(function(filePath) {
          replacePath(filePath, path.basename(rFile), path.basename(deployFile))
        });
      } else {
        deployFile = path.join(dest, file.release);
      }

      file.setContent(code);
      file.cache.save(code);

      _.write(deployFile, code);

      fis.emit('live:reload');
      console.log(' %dms'.green.bold, Date.now() - timer);
    });

  };

  return content;
}
