

module.exports = function(content,file,conf){

  fis.util.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

  var compiled = fis.util.template(content);

  return compiled.source;
}
