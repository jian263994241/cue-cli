var path = require('path');
module.exports = function(data) {
  var _ = fis.util;

  return function(content, file, conf){
    if(!_.isArray(data)) fis.log.error('htmlList 参数必须是  Array');
    var tempFn = _.template(content, {
      interpolate: /{{([\s\S]+?)}}/g
    });
    data.forEach(function(item){
      var subFileName = item.filename;
      var dir = path.dirname(conf.filename);
      var itemFile = new fis.file.wrap(path.join(dir, subFileName));
      itemFile.setContent(tempFn(item));
      itemFile.save();
    });

    file.release = false;

    return content;
  }
}
