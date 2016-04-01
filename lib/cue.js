var fs = require('fs');
var path = require('path');
var bf = require('./bf.js');
var template = require('./template.js');

var fis = module.exports = require('./core/fis');
fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('../package.json');

var srcFolder = 'src'
fis.project.setProjectRoot(path.join(process.cwd(),srcFolder));

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

//fis3-hook-relative
fis.hook('relative');

fis.cache.enable = false;

//相对路径
fis.match('**', {
  relative: true
});

//fis-parser-less2
fis.match('(*.css).less', {
  parser: fis.plugin('less2', {
    sourceMap: true
  }),
  rExt: '.css',
  release: '$1'
});
fis.match('*.html:less', {
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


// fis.on('compile:end', function(file) {
//   console.log('The file %s is gona compile.', file.subpath);
// });

//文件过滤
fis.match('*.inline.{html,css,less,dot}', {
  release: false
});
fis.match('third/**.{js,css,scss,less,svg,png,gif,jpg}', {
  useHash: false
});

var dot = path.basename(process.cwd()) == 'src' ? '..' : '.';
var releaseTo = dot + '/output';

var mediaArr = [];

mediaArr.push({
  name: 'build',
  rules: {
    'mod/**': {
      release: false
    },
    '*.map': {
      release: false
    },
    '*': {
      deploy: fis.plugin('local-deliver', {
        to: './build'
      })
    }
  }
});

mediaArr.push({
  name: 'dist',
  rules: {
    '*.js': {
      optimizer: fis.plugin('uglify-js')
    },
    '*.css': {
        optimizer: fis.plugin('clean-css')
    },
    '*': {
      deploy: fis.plugin('local-deliver', {
        to: './dist'
      })
    }
  }
});

mediaArr.forEach(function(media) {
  var fm = fis.media(media.name);
  for (var key in media.rules) {
    fm.match(key, media.rules[key]);
  }
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
  .match('**/(*).{svg,png,jpg,gif}', {
    release: '/i/$1'
  })
  .match('**/(*).{css,less}', {
    release: '/c/$1'
  })
  .match('**/(*.css).less', {
    release: '/c/$1'
  })
  .match('**/(*).js', {
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


fis.unhook('relative');

fis.cache.enable = true;
//配置domain
fis.media('prod').match('**',{
	domain:'https://img.99bill.com'
})
.match('*.html:css',{
    optimizer: fis.plugin('clean-css'),
})
.match('*.html:js',{
    optimizer: fis.plugin('uglify-js'),
})
.match('*/(*.css)', {
    optimizer: fis.plugin('clean-css'),
    useHash: true,
    release:'res/c/$1'
})
.match('*/(*.js)', {
    optimizer: fis.plugin('uglify-js'),
    useHash: true,
    release:'res/j/$1'
})
.match('*.inline.{js,css}',{
	optimizer:null,
	useHash:false,
	release:false
})
.match('*/(*.{jpg,png,gif})', {
    useHash: true,
    release:'res/i/$1'
})
.match('*', {
    deploy: fis.plugin('local-deliver', {
      to: '../ux-modify-prod'
    })
});
