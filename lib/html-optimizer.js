
var minify = require('html-minifier').minify;

module.exports = function(content, file, conf) {
  var content = minify(content, {
    removeAttributeQuotes: true
  });
  return content;
}
