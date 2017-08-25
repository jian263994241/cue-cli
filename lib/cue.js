var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var fis = module.exports = require('./core/fis');
var _ = fis.util;

fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('../package.json');


var projectName = path.basename(process.cwd());

// scaffold
fis.config.set('scaffold.type', 'github');
fis.config.set('scaffold.namespace', 'jian263994241');

fis.set('plugin.option.uglifyjs',{
  global: true,
  mangle: true,
  compress: {
    sequences: true,
    properties: true,
    dead_code: true,
    drop_debugger: true,
    conditionals: true,
    unused: true,
    booleans: true,
    if_return: true,
    join_vars: true,
    drop_console: true,
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

fis.set('preset', {
  'dev': {
    '*.css.less': {
      parser: fis.plugin('css',{
        option: fis.get('plugin.option.postcss')
      }),
      rExt: '.css'
    },
    '*.{html:css,css}': {
      parser: fis.plugin('css',{
        option: fis.get('plugin.option.postcss')
      })
    },
    '*.entry.{js,coffee,es6,jsx}': {
      parser: fis.plugin('browserify'),
      rExt: '.js'
    },
    '**.html:js': {
      parser: fis.plugin('babeljs', {
        runtime : false
      }),
      guard: false
    }
  },
  'build': {
    '*': {
      relative: true,
      deploy: fis.plugin('local-deliver', {
        to: './_build'
      })
    }
  },
  'dist': {
    '*.{js,es6,jsx}': {
      optimizer: fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs'))
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
    '**.min.{js,css}': {
      optimizer: false
    },
    '*': {
      relative: true,
      deploy: fis.plugin('local-deliver', {
        to: './dist'
      })
    }
  },
  'prod': {
    '*.html':{
      optimizer: fis.plugin('html', fis.get('plugin.option.htmlOptimizer')),
      release: '/seashell/webapp/cue-default/$0'
    },
    '(**/)(*).{css,css.less}': {
      release: 'res/c/$2',
      optimizer: fis.plugin('clean-css'),
      useHash: true,
      useMap: false
    },
    '(**/)(*).{js,jsx,es6}': {
      optimizer: [
        fis.plugin('uglify-js', fis.get('plugin.option.uglifyjs')),
        fis.plugin('obfuscator')
      ],
      release: 'res/j/$2',
      useHash: true,
      useMap: false
    },
    '(**/)(*.{jpg,png,gif})': {
      release: 'res/i/$2',
      useHash: true
    },
    '*.min.{js,css}': {
      optimizer: false
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

fis.createMedia = function(name, preset, append){
  var media = name != 'dev'? fis.media(name) : fis;
  var rules = fis.get(preset);
  if(append){
    rules =  _.extend(rules, append);
  }
  for (var key in rules) {
    media.match(key, rules[key]);
  }

  if(preset === 'preset.prod'){
    media.match('*', {
      deploy: [
        fis.plugin('zip', {
            filename: `${projectName}_${name}_${String(Date.now()).slice(6)}.zip`
        }),
        fis.plugin('local-deliver', {
          to: './_build'
        })
      ]
    });
  }

  var subFiles = [ '_*/**', '_*/_*/**', '**/_*.*'];
  var subjsFiles = [ '**/mod/**', 'mod/**' ];
  subFiles.forEach(function(reg){
    media.match(reg, {isInline: true});
  });
  subjsFiles.forEach(function(reg){
    media.match(reg, {release: false});
  });
};

fis.createMedia('dev', 'preset.dev');
fis.createMedia('build', 'preset.build');
fis.createMedia('dist', 'preset.dist');
fis.createMedia('prod2', 'preset.prod');
fis.createMedia('st02', 'preset.prod');
fis.createMedia('sandbox', 'preset.prod', {
  '*': {
    relative: false,
    domain: 'https://sandbox.99bill.com',
    deploy: fis.plugin('local-deliver', {
      to: './_sandbox'
    })
  }
});


fis.on('release:start', function(ret){
  if (fis.project.currentMedia() != "dev") {
    process.env.NODE_ENV = 'production';
  }else{
    process.env.NODE_ENV = 'development';
  }
})
.on('release:end', function(ret){
  var src = ret.src;
  console.log('\n');
  fis.util.each(src, function(res, i){
    var url = res.url || '';
    console.log(res.subpath.yellow + ' => ' + url.bold);
  });
});
