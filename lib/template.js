

module.exports = function(content,file,conf){

  function getQ(content){
    var spm = content.match(/<!--\s*?@name\s*?:\s*([\w\W-_]*?)[\s\n]*?-->/);
    return spm ? spm[1]:null;
  }

  var q = getQ(content);

  var compiled = fis.util.template(content);
  // content = compiled();

  if(q){

    content = compiled.source.replace(/^function??(?=\(obj\))/,'function '+q+' ');
  }else{
    content = compiled.source;
  }

  return content;
}
