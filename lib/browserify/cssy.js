var path = require("path");
var through = require('through2');
var assign = require('lodash').assign;

var postcss = require('postcss');
var less = require('less');




var func_start = "(function() { var head = document.getElementsByTagName('head')[0]; var style = document.createElement('style'); style.type = 'text/css';",
  func_end = "if (style.styleSheet){ style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); } head.appendChild(style);}())";

var defaultOptions = {
  compileOptions: {
    compress: true
  }
};


var currentWorkingDir = process.cwd();
var packageConfig;
try {
  packageConfig = require(currentWorkingDir + "/package.json");
} catch (e) {
  packageConfig = undefined;
}

var packagePluginOptions = packageConfig &&
  packageConfig.browserify &&
  packageConfig.browserify["transform-packageConfig"] &&
  packageConfig.browserify["transform-packageConfig"]["node-lessify"];


module.exports = function(file, transformOptions) {
  var pathInfo = path.parse(file);

  if (!/\.css$|\.less$|\.cssm$|\.lessm$/.test(file)) {
    return through();
  }

  // set the curTransformOptions using the given plugin options
  var curTransformOptions = assign({}, defaultOptions, packagePluginOptions || {}, transformOptions || {});
  curTransformOptions._flags = undefined; // clear out the _flag property


  var buffer = "",
    myDirName = path.dirname(file);

  var compileOptions = assign({}, curTransformOptions.compileOptions || {}, {
    paths: [".", myDirName] // override the "paths" property
  });

  return through(write, end);

  function write(chunk, enc, next) {
    buffer += chunk.toString();
    next();
  }

  function end(done) {
    var self = this;

    var postcssPlus = [];
    var compiled = null,
      cssname = {};

    postcssPlus.push(require('autoprefixer')({
      browsers: ['last 3 versions']
    }));
    if (/\.cssm$|\.lessm$/.test(file)) {
      postcssPlus.push(require('postcss-modules')({
        getJSON: function(cssFileName, json) {
          cssname = json;
        }
      }));
    }

    content = postcss(postcssPlus).process(buffer, {
      annotation: false,
      syntax: (/\.less$|\.lessm$/.test(file) ? require('postcss-less') : null)
    }).then(function(result) {
      // CSS is LESS so no need to check extension
      less.render(result.css, compileOptions, function(err, output) {
        if (err) {
          var msg = err.message;
          if (err.line) {
            msg += ", line " + err.line;
          }
          if (err.column) {
            msg += ", column " + err.column;
          }
          if (err.extract) {
            msg += ": \"" + err.extract + "\"";
          }

          return done(new Error(msg, file, err.line));
        }

        // small hack to output the file path of the LESS source file
        // so that we can differentiate
        compiled = JSON.stringify(
          output.css +
          (curTransformOptions.appendLessSourceUrl ?
            '/*# sourceURL=' + path.relative(currentWorkingDir, file).replace(/\\/g, '/') + ' */' : '')
        );


        if (/\.css$|\.less$/.test(file)) {
          if (curTransformOptions.textMode) {
            compiled = "module.exports = " + compiled + ";";
          } else {
            compiled = func_start + "var css = " + compiled + ";" + func_end;
          }
        } else {
          compiled = func_start + "var css = " + compiled + ";" + "module.exports = " + JSON.stringify(cssname) + ";" + func_end;
        }

        output.imports.forEach(function(f) {
          self.emit('file', f);
        });

        self.push(compiled);
        self.push(null);
        done();


      });
    })

  }
};
