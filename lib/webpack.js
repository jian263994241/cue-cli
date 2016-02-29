var webpack = require("webpack");
var MemoryFS = require("memory-fs");
var vfs = new MemoryFS();
var path = require('path');
var fs = require('fs');
var resolves = [];
var Browserify = require('browserify');

module.exports = function(content,file,conf){

  var projectPath = file.deploy?fis.project.getProjectPath():file.cache.cacheFile.match(/.*(?=cache)/)[0];
  var deployPath = file.deploy?file.deploy.to:'www';
  var _ = fis.util;

  deployPath =path.join(projectPath,deployPath,file.release);
  var compiler = webpack({
        // configuration
        context:projectPath,
        entry:file.rest,
        output:{
          filename:path.basename(file.release),
          path:path.dirname(deployPath)
        }

    });
    compiler.run(function(err,stats){
      if(err) throw err;

    });



  // var res = {id:file.getId()};
  //
  // var isResolved =  _.findIndex(resolves, {id : res.id});
  //
  // if(isResolved == -1){
  //
  //   res.startTime = _.now();
  //
  //   resolves.push(res);
  //
  //   var compiler = webpack({
  //       // configuration
  //       entry:file.rest,
  //       output:{
  //         filename:file.basename,
  //         path:'/'
  //       }
  //
  //   });
  //   compiler.outputFileSystem = vfs;
  //   compiler.run(function(err, stats) {
  //
  //     var fileContent = vfs.readFileSync('/'+file.basename,'utf8');
  //
  //     file.setContent(fileContent);
  //
  //     resolves = _.reject(resolves,{id : res.id});
  //     res.endTime = _.now();
  //     res.content = fileContent;
  //
  //     resolves.push(res);
  //
  //     return fis.compile(file);
  //   });
  // }else{
  //   resolves.every(function(rfile){
  //     if(rfile.id = file.getId()){
  //       content = rfile.content;
  //       fs.writeFileSync(deployPath,content);
  //       fis.log.info('webpack done: %s',file.fullname);
  //       return false;
  //     }else{
  //       return true;
  //     }
  //   })
  // }

  return '';

}
