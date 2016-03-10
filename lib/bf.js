var Browserify = require('browserify');
var coffeeify = require('coffeeify');
var brfs = require('brfs');

var path = require('path');
var fs = require('fs');

module.exports = function(content,file,conf){

  var deployPath;

  if(fis.project.getDistDir()){
    deployPath = fis.project.getDistDir();
  }else if(file.deploy){
    deployPath = path.join(fis.project.getProjectPath(),file.deploy.to);
  }else{
    deployPath = fis.project.getTempPath('www');
  };

  var _ = fis.util;

  deployPath =path.join(deployPath,file.release);

  var b = Browserify({
    extensions: ['.coffee','.js']
  });

  if(file.ext == '.coffee'){
    b.transform(coffeeify,{bare: false,header: true});
  };
  
  b.transform(brfs);


  b.add(conf.filename);
  b.bundle(function(err,buf){
    if(err) return console.log(err);
    fs.writeFileSync(deployPath,buf);
  });

  return '';
}
