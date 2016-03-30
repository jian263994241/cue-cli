var fs = require('fs');
var path = require('path');
var bf = require('./bf.js');
var template = require('./template.js');

var fis = module.exports = require('./core/fis');
fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('../package.json');

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
fis.set('project.md5Length', 16);
// scaffold
fis.config.set('scaffold.type', 'github');
fis.config.set('scaffold.namespace', 'jian263994241');
fis.set('project.ignore', [
  'output/**',
  'node_modules/**',
  '.git/**',
  '.svn/**',
  'c-conf.js'
]);
//fis3-hook-relative
fis.hook('relative');

fis.cache.enable = false;

//相对路径
fis.match('**', {
  relative: true
});

//fis-parser-less2
fis.match('*.{less,html:less}', {
  parser: fis.plugin('less2', {
    sourceMap: true
  }),
  rExt: '.css'
});
//css prefixer
fis.match('*.{css,less,html:css,html:less}', {
  postprocessor: fis.plugin('cssautoprefixer')
});

fis.match('(**)/(*).entry.{js,coffee,es6,jsx}', {
  postprocessor: bf,
  rExt: '.js',
  release: '$1/$2'
});

fis.match('*.{html:template,tpl.html}', {
  parser: template,
  rExt: '.html'
});


fis.match('::package', {
  postpackager: fis.plugin('loader')
});


// fis.on('compile:end', function(file) {
//   console.log('The file %s is gona compile.', file.subpath);
// });


var dot = path.basename(process.cwd()) == 'src' ? '..' : '.';
var releaseTo = dot + '/output';
//发布

fis
  .media('qa')
  .match('*.inc.{html,css,less,scss,tpl}', {
    release: '/.include/$0',
    useHash: false,
    optimizer: null
  })
  .match('_*.{html,css,less,tpl}', {
    release: '/.include/$0'
  })
  .match('mod/**', {
    release: '/.include/$0'
  })
  .match('*.map', {
    release: '/.include/$0'
  })
  .match('*.{css,less,html:css}', {
    optimizer: fis.plugin('clean-css', {
      keepBreaks: true
    })
  })
  .match('*', {
    deploy: fis.plugin('local-deliver', {
      to: releaseTo
    })
  });

fis
  .media('op')
  .match('*.{css,html:css,less}', {
    optimizer: fis.plugin('clean-css'),
    useHash: false
  })
  .match('*.{js,html:js,coffee}', {
    optimizer: fis.plugin('uglify-js'),
    useHash: false
  })
  .match('third/**.{js,css,scss,less,svg,png,gif,jpg}', {
    useHash: false
  })
  .match('*.min.{js,css}', {
    useHash: false,
    optimizer: null
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

fis
  .media('md5')
  .match('*.{css,html:css,less}', {
    optimizer: fis.plugin('clean-css'),
    useHash: true
  })
  .match('*.{js,html:js,coffee}', {
    optimizer: fis.plugin('uglify-js'),
    useHash: true
  })
  .match('*.{png,jpg,gif,svg}', {
    useHash: true
  })
  .match('third/**.{js,css,scss,less,svg,png,gif,jpg}', {
    useHash: false
  })
  .match('*.min.{js,css}', {
    useHash: false,
    optimizer: null
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
  .match('res/**/(*).{svg,png,jpg,gif}', {
    release: '/i/$1'
  })
  .match('res/**/(*).{css,less}', {
    release: '/c/$1'
  })
  .match('/*.js', {
    release: '/j/$0'
  })
  .match('(**)/(*).entry.{js,coffee,es6,jsx}', {
    release: '/j/$2'
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
