#!/usr/bin/env node

var Liftoff = require('liftoff');
var argv = require('minimist')(process.argv.slice(2));
var path = require('path');
var cli = new Liftoff({
  name: 'cue', // 命令名字
  processTitle: 'cue',
  moduleName: 'cue',
  configName: 'c-conf',

  // only js supported!
  extensions: {
    '.js': null
  }
});

cli.launch({
  cwd: argv.r || argv.root,
  configPath: argv.f || argv.file
}, function(env) {

  var fis;
  if (!env.modulePath) {
    fis = require('../');
  } else {
    fis = require(env.modulePath);
  }

  process.title = this.name +' ' + process.argv.slice(2).join(' ') + ' [ ' + env.cwd + ' ]';

  fis.require.paths.unshift(path.join(env.cwd, 'node_modules'));
  fis.require.paths.push(path.join(path.dirname(__dirname), 'node_modules'));
  fis.argv = argv;
  fis.cli.run(argv, env);
});
