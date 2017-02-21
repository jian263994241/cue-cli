var fs = require('fs');
var path = require('path');

var fis = module.exports = require('./core/fis');
var _ = fis.util;

fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('../package.json');

var src = '/';

fis.project.setProjectRoot(path.join(process.cwd(), src));

fis.set('project.md5Length', 12);
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
    join_vars: true,
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

//fis-parser-less2
fis.match('*.less', {
  isInline: true
});

fis.match('mod/**', {
  isInline: true
});

fis.match('*.css.less', {
  parser: fis.plugin('css',{
    option: fis.get('plugin.option.postcss')
  }),
  isInline: false,
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
  'mod/**': {
    release: false
  },
  '*.min.{js,css}': {
    optimizer: false
  },
  '*.inline.{html,css,less,dot,js,coffee,es6,jsx}': {
    isInline: true,
    release: false
  }
}

var mat = _.assignIn({}, matBase);

var matProd = _.assignIn({
  '*.map': {
    isInline: true
  }
}, matBase);


var mediaArr = [];

mediaArr.push({
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

mediaArr.push({
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
      useSprite: true
    },
    '*': {
      relative: true,
      deploy: fis.plugin('local-deliver', {
        to: './dist'
      })
    }
  }
});


mediaArr.push({
  name: 'prod2',
  rules: {
    '*.html':{
      optimizer: fis.plugin('html', fis.get('plugin.option.htmlOptimizer'))
    },
    '*.{js,html:js,es6,jsx}': {
      optimizer: fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs'))
    },
    '*.{css,html:css}': {
      optimizer: fis.plugin('clean-css'),
      useHash: true
    },
    '*.css.less': {
      optimizer: fis.plugin('clean-css'),
      useHash: true
    },
    '(**/)(*).{css,css.less}': {
      release: 'res/c/$2'
    },
    '(**/)(*).{js,jsx,es6}': {
      release: 'res/j/$2',
      useHash: true
    },
    '(**/)(*.{jpg,png,gif})': {
      release: 'res/i/$2',
      useHash: true
    },
    '**.map':{
      isInline: true
    },
    '*': {
      relative: false,
      domain: 'https://img.99bill.com',
      deploy: fis.plugin('local-deliver', {
        to: './_build'
      })
    }
  }
});

mediaArr.push({
  name: 'sandbox',
  rules: {
    '*.html':{
      optimizer: fis.plugin('html', fis.get('plugin.option.htmlOptimizer'))
    },
    '*.{js,html:js,es6,jsx}': {
      optimizer: fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs'))
    },
    '*.{css,html:css}': {
      optimizer: fis.plugin('clean-css'),
      useHash: true
    },
    '*.css.less': {
      optimizer: fis.plugin('clean-css'),
      useHash: true
    },
    '(**/)(*).{css,css.less}': {
      release: 'res/c/$2'
    },
    '(**/)(*).{js,jsx,es6}': {
      release: 'res/j/$2',
      useHash: true
    },
    '(**/)(*.{jpg,png,gif})': {
      release: 'res/i/$2',
      useHash: true
    },
    '**.map':{
      isInline: true
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
mediaArr.forEach(function(media) {
  var fm = fis.media(media.name);
  var rules;
  if (media.name == 'prod2') {
    rules = _.assignIn(media.rules, matProd);
  } else {
    rules = _.extend(media.rules, mat);
  }

  for (var key in rules) {
    fm.match(key, rules[key]);
  }
});
