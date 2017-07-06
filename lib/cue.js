var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var fis = module.exports = require('./core/fis');
var _ = fis.util;

fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('../package.json');

var src = '/';

fis.project.setProjectRoot(path.join(process.cwd(), src));


// scaffold
fis.config.set('scaffold.type', 'github');
fis.config.set('scaffold.namespace', 'jian263994241');

fis.set('plugin.option.uglifyjs',{
  global: true,
  mangle: true,
  compress: {
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    // join_vars: true,
    drop_console: true,
    booleans: true,
    loops: true,
    hoist_funs: true,
    cascade: true
  }
});

fis.set('plugin.option.htmlOptimizer',{
  removeAttributeQuotes: true,
  collapseWhitespace: true,
  removeComments: true
});

fis.set('plugin.option.postcss',{
  autoprefixer:{
    browsers: ['> 1%', 'iOS 7']
  }
});

//fis3-hook-relative
fis.hook('relative');

// fis.cache.enable = false;

// fis.match('mod/**', {
//   release: false
// });

//fis-parser-less2
// fis.match('*.less', {
//   release: false
// });

fis.match('*.css.less', {
  parser: fis.plugin('css',{
    option: fis.get('plugin.option.postcss')
  }),
  release: true,
  rExt: '.css'
});

fis.match('*.{html:css,css}', {
  parser: fis.plugin('css',{
    option: fis.get('plugin.option.postcss')
  }),
});

fis.match('*.entry.{js,coffee,es6,jsx}', {
  parser: fis.plugin('browserify'),
  rExt: '.js'
});

//文件过滤
fis.match('**.min.{js,css}', {
  optimizer: false
});


// 公用文件生成规则
var matBase = {
  '*.inline.{html,css,less,dot,js,coffee,es6,jsx}': {
    isInline: true,
    release: false
  }
}


var mediaList = [];

mediaList.push({
  name: 'build',
  rules: {
    '*': {
      relative: true,
      deploy: fis.plugin('local-deliver', {
        to: './_build'
      })
    }
  }
});

mediaList.push({
  name: 'dist',
  rules: {
    '(**/*).{js,html:js,coffee,es6,jsx}': {
      optimizer: fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs')),
      release: '$1.js'
    },
    '*.{css,html:css}': {
      optimizer: fis.plugin('clean-css'),
      useSprite: true
    },

    '*.css.less': {
      optimizer: fis.plugin('clean-css'),
      useSprite: true,
      isInline: false
    },
    '*': {
      relative: true,
      deploy: fis.plugin('local-deliver', {
        to: './dist'
      })
    }
  }
});


mediaList.push({
  name: 'prod2',
  rules: {
    '*.html':{
      optimizer: fis.plugin('html', fis.get('plugin.option.htmlOptimizer'))
    },
    '*.{js,html:js,es6,jsx}': {
      optimizer: fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs'))
    },
    '(**/)(*).{css,css.less,less}': {
      release: 'res/c/$2',
      optimizer: fis.plugin('clean-css'),
      useHash: true,
      useMap: false
    },
    '(**/)(*).{js,jsx,es6}': {
      release: 'res/j/$2',
      useHash: true,
      useMap: false
    },
    '(**/)(*.{jpg,png,gif})': {
      release: 'res/i/$2',
      useHash: true
    },
    '*': {
      relative: false,
      domain: 'https://img.99bill.com',
      deploy: [
        fis.plugin('local-deliver', {
          to: './_build'
        })
      ]
    }
  }
});


mediaList.push({
  name: 'sandbox',
  rules: {
    '*.html':{
      optimizer: fis.plugin('html', fis.get('plugin.option.htmlOptimizer'))
    },
    '*.{js,html:js,es6,jsx}': {
      optimizer: fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs'))
    },
    '(**/)(*).{css,css.less,less}': {
      release: 'res/c/$2',
      optimizer: fis.plugin('clean-css'),
      useHash: true,
      useMap: false
    },
    '(**/)(*).{js,jsx,es6}': {
      release: 'res/j/$2',
      useHash: true,
      useMap: false
    },
    '(**/)(*.{jpg,png,gif})': {
      release: 'res/i/$2',
      useHash: true
    },
    '*': {
      relative: false,
      domain: 'https://sandbox.99bill.com',
      deploy: fis.plugin('local-deliver', {
        to: './_sandbox'
      })
    }
  }
});

fis.once('compile:start', function(file) {
  if (fis.project.currentMedia() != "dev") {
    process.env.NODE_ENV = 'production';
    _.del(file.getDeploy(true));
  }else{
    process.env.NODE_ENV = 'development';
  }
});


// 增加dedia
mediaList.forEach(function(media) {

  var fm = fis.media(media.name);
  var rules =  _.extend(media.rules, matBase);

  for (var key in rules) {
    fm.match(key, rules[key]);
  }
});
