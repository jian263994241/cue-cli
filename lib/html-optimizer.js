
var htmlmin = require('htmlmin');

module.exports = function(content, file, conf) {
  content = htmlmin(content)
  return content;
}
