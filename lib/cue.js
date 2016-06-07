var fs = require('fs');
var path = require('path');
var bf = require('./bf.js');
var template = require('./template.js');

var fis = module.exports = require('./core/fis');
var _ = fis.util;

fis.require.prefixes.unshift('cue');
fis.cli.name = 'cue';
fis.cli.info = require('../package.json');

var src = '/';

fis.project.setProjectRoot(path.join(process.cwd(), src));

fis.project.getDistDir = function () {
	var argv = fis.argv;
	if (fis.util.isString(argv.d)) {
		return path.join(process.cwd(), argv.d);
	} else {
		return false;
	}
};
fis.isDebug = function () {
	return Boolean(fis.project.currentMedia() == 'dev');
};

fis.set('project.md5Length', 12);
// scaffold
fis.config.set('scaffold.type', 'github');
fis.config.set('scaffold.namespace', 'jian263994241');

fis.set('uglifyjs.options',{
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

//fis3-hook-relative
fis.hook('relative');

fis.cache.enable = false;

//fis-parser-less2
fis.match('*.css.less', {
	parser: fis.plugin('less2', {
		sourceMap: true
	}),
	rExt: '.css',
	postprocessor: fis.plugin('cssautoprefixer')
});
fis.match('*.html:less', {
	parser: fis.plugin('less2'),
	rExt: '.css'
});
//css prefixer
fis.match('*.css', {
	postprocessor: fis.plugin('cssautoprefixer')
});
fis.match('*.{html:css,html:less}', {
	postprocessor: fis.plugin('cssautoprefixer')
});

fis.match('?(**/)(*).entry.{js,coffee,es6,jsx}', {
	postprocessor: bf,
	rExt: '.js'
});

fis.match('::package', {
	spriter: fis.plugin('csssprites-group')
});

fis.set('settings.spriter.csssprites-group', {
	//图片缩放比例
	scale: 1,
	//1rem像素值
	rem: 50,
	//图之间的边距
	margin: 10,
	//使用矩阵排列方式，默认为线性`linear`
	layout: 'matrix',
	//合并图片存到/img/
	to: '../img'
});

//文件过滤
fis.match('third/**', {
	useHash: false,
	optimizer: false
});

// 公用文件生成规则
var matBase = {
	'*.less': {
		isInline: true,
		useSprite: true
	},
	'*.map': {
		isInline: true
	},
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
	'(**)/(*).css.less': {
		release: '$1/$2',
		isInline: false,
	},
	'(**)/(*).entry.{js,coffee,es6,jsx}': {
		release: '$1/$2'
	}
}, matBase);
var matProd = _.assignIn({
	'(**)/(*).css.less': {
		release: 'res/c/$2',
		isInline: false,
		useHash: true
	},
	'(**)/(*).entry.{js,coffee,es6,jsx}': {
		release: 'res/j/$2',
		useHash: true
	}
}, matBase);


// fis.on('compile:end', function(file) {
//   console.log('The file %s is gona compile.', file.subpath);
// });


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
		'*.{js,html:js}': {
			optimizer: fis.plugin('uglify-js', fis.get('uglifyjs.options'))
		},
		'*.{coffee,es6,jsx}': {
			optimizer: null
		},
		'*.{css,less,html:css,html:less}': {
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
	name: 'op',
	rules: {
		'*.{js,html:js}': {
			optimizer: fis.plugin('uglify-js')
		},
		'*.{coffee,es6,jsx}': {
			optimizer: null
		},
		'*.{css,less,html:css,html:less}': {
			optimizer: fis.plugin('clean-css'),
			useSprite: true
		},
		'*': {
			relative: true,
			deploy: fis.plugin('local-deliver', {
				to: './output'
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
			optimizer: null
		},
		'*.{css,less,html:css,html:less}': {
			optimizer: fis.plugin('clean-css'),
			useSprite: true
		},
		'(**/)(*).css': {
			release: 'res/c/$2',
			useHash: true,
			useSprite: true
		},
		'(**/)(*).{js,coffee,jsx,es6}': {
			release: 'res/j/$2',
			useHash: true
		},
		'(**/)(*.{jpg,png,gif})': {
			release: 'res/i/$2',
			useHash: true
		},
		'*': {
			relative: false,
			domain: 'https://img.99bill.com',
			deploy: fis.plugin('local-deliver', {
				to: './output'
			})
		}
	}
});

fis.once('compile:start', function (file) {
	var fk = fis.project.currentMedia();
	if (file.deploy) {
		_.del(file.deploy.to);
	};
});

mediaArr.forEach(function (media) {
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
