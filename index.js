var fs = require('fs');
var path = require('path');
var bf = require('./lib/bf.js');
var template = require('./lib/template.js');

var fis = module.exports = require('fis3');
fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('./package.json');

fis.project.setProjectRoot(process.cwd());

fis.project.getDistDir = function(){
  var argv = fis.argv;
  if(fis.util.isString(argv.d)){
    return path.join(this.getProjectPath(),argv.d);
  }else{
    return false;
  }
};

//ignore 覆盖设置
fis.set('project.ignore', ['c-conf.js', 'README.md', 'output/**', 'dist/**', 'dest/**', 'node_nodules/**', '.git/**', '.svn/**','src/**', '*.bak', 'fis-conf.js', '.idea']);

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
    parser: fis.plugin('scss2', {sourceMapEmbed: true}),
    rExt: '.css'
});
//fis-parser-less2
fis.match('*.{less,html:less}', {
    parser: fis.plugin('less2', {sourceMap:true}),
    rExt: '.css'
});
//css prefixer
fis.match('*.{css,scss,less,html:css,html:less,html:scss}', {
    postprocessor: fis.plugin('cssautoprefixer')
});


fis.match('*.jsx', {
    parser: fis.plugin('react-tools'),
    rExt: '.js'
});

fis.match('*.{coffee,html:coffee}', {
    parser: fis.plugin('coffee-react'),
    rExt: '.js'
});

fis.match('(**)/(*).entry.{js,coffee}', {
    postprocessor: bf,
    rExt: '.js',
    release:'$1/$2.js'
});

fis.match('*.{html:template,tpl.html}', {
    parser: template,
    rExt: '.html'
});


// 过滤include 模板文件
fis.match('*.inc.{html,css,less,scss,tpl}', {
    release: '/.include/$0', parser: null,postprocessor:null,optimizer:null
});
fis.match('_*.{html,css,less,scss,tpl}',{
    release: '/.include/$0', parser: null,postprocessor:null,optimizer:null
});
//label mod
fis.match('mod/**',{
  release:false
});

fis.match('::package', {
    postpackager: fis.plugin('loader')
});

global.ojs = fis.plugin('uglify-js');
global.ocss = fis.plugin('clean-css');


//发布生产
fis
    .media('qa')
    .match('*.{css,scss,less,html:css}',{
      optimizer:fis.plugin('clean-css', {keepBreaks:true})
    })
    .match('*.{js,css,png}', {
      useHash: true
    })
    .match('*', {
        deploy: fis.plugin('local-deliver', {
            to: './dist'
        })
    });

fis
    .media('rd')
    .match('*.{css,scss,less,html:css}',{
      optimizer:fis.plugin('clean-css', {keepBreaks:true}),
      useSprite: true
    })
    .match('*', {
        deploy: fis.plugin('local-deliver', {
            to: './dist'
        })
    })
    // .match('*.png', {
    //   optimizer: fis.plugin('png-compressor')
    // })
    .match('*.map',{
      release: '/.include/$0'
    });
