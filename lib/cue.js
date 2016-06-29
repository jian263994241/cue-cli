var fs = require('fs');
var path = require('path');
var bf = require('./bf');
var postcss = require('./postcss');

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

fis.set('uglifyjs.options', {
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
    drop_console: true
  }
});

Object.defineProperty(global, 'bf', {
  enumerable: true,
  writable: false,
  value: bf
});

//fis3-hook-relative
fis.hook('relative');

// fis.cache.enable = false;

//fis-parser-less2
fis.match('*.less', {
  isInline: true
});
fis.match('mod/**.less', {
  isInline: false
});
fis.match('*.css.less', {
  parser: postcss,
  isInline: false,
  rExt: '.css'
});
fis.match('*.{html:css,css}', {
  parser: postcss
});

fis.match('*.{js,coffee,es6,jsx}', {
  useCache: false
});

fis.match('*.entry.{js,coffee,es6,jsx}', {
  parser: bf({
    entry: true
  }),
  rExt: '.js'
});

// fis.match('::package', {
//   spriter: fis.plugin('csssprites-group')
// });

//文件过滤
fis.match('third/**', {
  useHash: false,
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

var mat = _.assignIn({

}, matBase);

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
        to: './build'
      })
    }
  }
});

mediaArr.push({
  name: 'dist',
  rules: {
    '(**/*).{js,html:js}': {
      optimizer: fis.plugin('uglify-js', fis.get('uglifyjs.options')),
      uglify: fis.require('optimizer-uglify-js'),
      release: '$1.min.js'
    },
    '*.{coffee,es6,jsx}': {
      optimizer: null,
      uglify: fis.require('optimizer-uglify-js')
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
        to: './build'
      })
    }
  }
});


mediaArr.push({
  name: 'prod2',
  rules: {
    '*.{js,html:js}': {
      optimizer: fis.plugin('uglify-js', fis.get('uglifyjs.options'))
    },
    '*.{coffee,es6,jsx}': {
      optimizer: null,
      uglify: fis.require('optimizer-uglify-js')
    },
    '*.{css,html:css}': {
      optimizer: fis.plugin('clean-css'),
      useHash: true
    },
    '*.css.less': {
      optimizer: fis.plugin('clean-css'),
      useHash: true
    },
    '(**/)(*).{css,less}': {
      release: 'res/c/$2'
    },
    '(**/)(*).{js,coffee,jsx,es6}': {
      release: 'res/j/$2',
      useHash: true,
      uglify: fis.require('optimizer-uglify-js')
    },
    '(**/)(*.{jpg,png,gif})': {
      release: 'res/i/$2',
      useHash: true
    },
    '*': {
      relative: false,
      domain: 'https://img.99bill.com',
      deploy: fis.plugin('local-deliver', {
        to: './build'
      })
    }
  }
});

fis.once('compile:start', function(file) {
  if (fis.project.currentMedia() != "dev") {
    _.del(file.getDeploy(true));
  };
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
