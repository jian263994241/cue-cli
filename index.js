var fs = require('fs');
var path = require('path');
var bf = require('./lib/bf.js');
var template = require('./lib/template.js');

var fis = module.exports = require('fis3');
fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('./package.json');

fis.project.setProjectRoot(process.cwd());

fis.project.getDistDir = function() {
  var argv = fis.argv;
  if (fis.util.isString(argv.d)) {
    return path.join(this.getProjectPath(), argv.d);
  } else {
    return false;
  }
};
fis.isDebug = function() {
  return fis.project.currentMedia() == 'dev' ? true : false;
};
//ignore 覆盖设置
fis.set('project.ignore', ['c-conf.js', 'README.md', 'output/**', 'dist/**', 'dest/**', 'node_nodules/**', '.git/**', '.svn/**', 'src/**', '*.bak', 'fis-conf.js', '.idea']);

//fis3-hook-relative
fis.hook('relative');

// fis.cache.enable = false;

//相对路径
fis.match('**', {
  relative: true
});

// 语言能力增强
//fis-parser-sass2
fis.match('*.{scss,html:scss}', {
  parser: fis.plugin('scss2', {
    sourceMapEmbed: true
  }),
  rExt: '.css'
});
//fis-parser-less2
fis.match('*.{less,html:less}', {
  parser: fis.plugin('less2', {
    sourceMap: true
  }),
  rExt: '.css'
});
//css prefixer
fis.match('*.{css,scss,less,html:css,html:less,html:scss}', {
  postprocessor: fis.plugin('cssautoprefixer')
});


fis.match('*.{coffee,html:coffee}', {
  parser: fis.plugin('coffee-react'),
  rExt: '.js'
});

fis.match('(**)/(*).entry.{js,coffee,jsx,es6}', {
  postprocessor: bf,
  rExt: '.js',
  release: '$1/$2.js'
});

fis.match('*.{html:template,tpl.html}', {
  parser: template,
  rExt: '.html'
});


// 过滤include 模板文件

fis.match('::package', {
  postpackager: fis.plugin('loader')
});

global.ojs = fis.plugin('uglify-js');
global.ocss = fis.plugin('clean-css');



// fis.on('compile:start', function(file) {
//   console.log('The file %s is gona compile.', file.subpath);
// });

var releaseTo = './dist';
//发布

fis
  .media('qa')
  .match('*.inc.{html,css,less,scss,tpl}', {
    release: '/.include/$0',
    useHash: false,
    optimizer: null
  })
  .match('_*.{html,css,less,scss,tpl}', {
    release: '/.include/$0'
  })
  .match('mod/**', {
    release: '/.include/$0'
  })
  .match('*.map', {
    release: '/.include/$0'
  })
  // .match('*.{css,scss,less,html:css}', {
  //   optimizer: fis.plugin('clean-css', {
  //     keepBreaks: true
  //   })
  // })
  .match('*', {
    deploy: fis.plugin('local-deliver', {
      to: releaseTo
    })
  });

fis
  .media('md5')
  .match('*.{css,html:css,less,scss}', {
    optimizer: fis.plugin('clean-css'),
    useHash: true
  })
  .match('*.{js,html:js,coffee,jsx,es6}', {
    optimizer: fis.plugin('uglify-js'),
    useHash: true
  })
  .match('*.png', {
    useHash: true
  })
  .match('*.min.{js,css}', {
    useHash: true,
    optimizer:null
  })
  .match('res/**.{js,css,scss,less,svg,png,gif,jpg}', {
    useHash: false,
    optimizer:null
  })
  .match('*.inc.{html,css,less,scss,tpl}', {
    release: '/.include/$0',
    useHash: false,
    optimizer: null
  })
  .match('_*.{html,css,less,scss,tpl}', {
    release: '/.include/$0',
    useHash: false,
    optimizer: null
  })
  .match('mod/**', {
    release: '/.include/$0',
    useHash: false,
    optimizer: null
  })
  .match('*.map', {
    release: '/.include/$0'
  })
  .match('*', {
    deploy: fis.plugin('local-deliver', {
      to: releaseTo
    })
  });
