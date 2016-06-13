var browserify = require('browserify');
var coffeeify = require('coffeeify')
var partialify = require('partialify/custom');
var path = require('path');
var uglifyify = require("uglifyify");
var dotify = require('dotify');
var babelify = require('babelify');
var lessify = require('node-lessify');
var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({
  browsers: ['last 3 versions']
});


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


  var cache = {},
      pkgCache = {};

  var b = browserify({
    debug: debug,
    extensions: ['.js', '.coffee','.es6','.jsx'],
    // cache: cache,
    // packageCache: pkgCache,
    fullPaths: true
  });


  b.transform(coffeeify, {
    bare: false,
    header: true,
    extensions: ['.coffee'],
    experimental: true
  });

  b.transform(babelify, {
    presets: ["es2015"],
    extensions: ['.es6']
  });

  b.transform(babelify, {
    presets: ["es2015", "react"],
    extensions: ['.jsx']
  });

  b.transform(partialify.onlyAllow(['xml', 'csv', 'html', 'svg', 'json']));
  b.transform(lessify, {
      compileOptions: {
        plugins: [autoprefix]
      }
    });

  if (file.optimizer) {
    b.transform(uglifyify, fis.get('uglifyjs.options'));
  };
  // b.add(conf.filename);

  b.require(conf.filename, {
    entry: true
  });


  var code = '',
    md5, omd5, bfw,
    result;

  var originHash = file.getHash();


  b.once('bundle', function(bundle) {
    bundle.on('data', function() {
      process.stdout.write('.');
    })
  });

  fis.once('release:end',bundle);

  function bundle() {
    var rFile = path.join(dest, file.getHashRelease());
    file.useHash && _.del(rFile);

    var timer = Date.now();
    b.bundle(function(err, buf) {
      if (err) return console.log('\n' + err.toString());
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

      console.log(' %dms'.green.bold, Date.now() - timer);
    });

  };

  return 'console.log("live reload...")';
}
