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
var path = require('path');

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


  var cache = {},
    pkgCache = {};

  var b = browserify({
    debug: debug,
    extensions: ['.js', '.coffee', '.es6', '.jsx'],
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

  fis.once('release:end', bundle);

  function bundle(e) {

    var rFile = path.join(dest, file.getHashRelease());
    var rUrl = file.getUrl();
    _.del(rFile);

    var timer = Date.now();
    b.bundle(function(err, buf) {
      if (err) return console.log('\n' + err.toString());

      file.setContent(buf);

      deployFile = path.join(dest, file.getHashRelease());
      var nUrl = file.getUrl();

      var files = e.src;
      var _file, info, rHtmlPath;

      var convert = function(_file, b, a) {
        var savePath = path.join(dest, _file.getHashRelease());
        var content = _file.getContent();
        if (file.relative) {
          b = path.relative(_file.subpath, b);
          a = path.relative(_file.subpath, a);
        }
        content = content.replace(new RegExp(b, 'g'), a);
        _.write(savePath, content);
      };

      for (key in files) {
        info = path.parse(key);
        _file = files[key];
        if (info.ext != '.html') continue;
        if (_file.links.length > 0) {
          _file.links.forEach(function(item) {
            if (item == file.subpath) {
              convert(_file, rUrl, nUrl);
            };
          })
        }
      };

      _.write(deployFile, file.getContent());
      console.log('.');
    });

  };
  return '';
}

function getRelativeUrl(file, host) {
  var url;

  if (typeof file === 'string') {
    url = file;
  } else {
    var url = file.getUrl();

    if (file.domain) {
      return url;
    }
  }

  var relativeFrom = typeof host.relative === 'string' ? host.relative : host.release;
  if (rFile.test(relativeFrom)) {
    relativeFrom = path.dirname(relativeFrom);
  }

  url = path.relative(relativeFrom, url);
  return url.replace(/\\/g, '/');
}
