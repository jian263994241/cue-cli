'use strict';
var path = require("path");
var through = require('through2');

var _ = require('../core/util');

/**
 * fis 中间码管理器。
 * @namespace fis.compile.lang
 */
var map = exports.lang = (function() {
  var keywords = [];
  var delim = '\u001F'; // Unit Separator
  var rdelim = '\\u001F';
  var slice = [].slice;
  var map = {

    /**
     * 添加其他中间码类型。
     * @param {String} type 类型
     * @function add
     * @memberOf fis.compile.lang
     */
    add: function(type) {
      if (~keywords.indexOf(type)) {
        return this;
      }
      var stack = [];
      keywords.push(type);
      map[type] = {
        wrap: function(value) {
          return this.ld + slice.call(arguments, 0).join(delim) + this.rd;
        }
      };

      // 定义map.ld
      Object.defineProperty(map[type], 'ld', {
        get: function() {
          var depth = stack.length;
          stack.push(depth);
          return delim + type + depth + delim;
        }
      });

      // 定义map.rd
      Object.defineProperty(map[type], 'rd', {
        get: function() {
          return delim + stack.pop() + type + delim;
        }
      });
    }
  };

  /**
   * 获取能识别中间码的正则
   * @name reg
   * @type {RegExp}
   * @memberOf fis.compile.lang
   */
  Object.defineProperty(map, 'reg', {
    get: function() {
      return new RegExp(
        rdelim + '(' + keywords.join('|') + ')(\\d+?)' + rdelim + '([^' + rdelim + ']*?)(?:' + rdelim + '([^' + rdelim + ']+?))?' + rdelim + '\\2\\1' + rdelim,
        'g'
      );
    }
  });

  // 默认支持的中间码
  [
    'embed', // 内嵌其他文件
    'jsEmbed', // 内嵌 js 文件内容
    'uri', // 替换成目标文件的 url
  ].forEach(map.add);

  return map;
})();

/**
 * 内置的标准化处理函数，外部可以覆写此过程。
 *
 * - 对 html 文件进行 {@link fis.compile.extHtml} 处理。
 * - 对 js 文件进行 {@link fis.compile.extjs} 处理。
 * - 对 css 文件进行 {@link fis.compile.extCss} 处理。
 *
 * @param  {String} content 文件内容
 * @param  {File} file    文件对象
 * @param  {Object} conf    标准化配置项
 * @memberOf fis.compile
 * @inner
 */
function builtinStandard(content, file, conf) {
  if (typeof content === 'string') {
    fis.log.debug('builtin standard for [%s] start', file.realpath);
    var type;
    if (conf.type && conf.type !== 'auto') {
      type = conf.type;
    } else {
      type = file.isHtmlLike ? 'html' : (file.isJsLike ? 'js' : (file.isCssLike ? 'css' : ''));
    }

    switch (type) {
      case 'html':
        content = extHtml(content, null, file);
        break;

      case 'js':
        content = extJs(content, null, file);
        break;

      case 'css':
        content = extCss(content, null, file);
        break;

      default:
        // unrecognized.
        break;
    }
    fis.log.debug('builtin standard for [%s] end', file.realpath);
  }
  return content;
}

/**
 * 将中间码还原成源码。
 *
 * 中间码说明：（待补充）
 *
 * @inner
 * @memberOf fis.compile
 * @param  {file} file 文件对象
 */
function postStandard(content, file, conf) {

  if (typeof content !== 'string') {
    return;
  }

  var reg = map.reg;
  var urlMatch = /^(http|https)?(:\/\/([\w-]+\.)+[\w-]+\/)?([\w-.\/?%&=]*)?$/;
  // 因为处理过程中可能新生成中间码，所以要拉个判断。
  while (reg.test(content)) {
    reg.lastIndex = 0; // 重置 regexp
    content = content.replace(reg, function(all, type, depth, value, extra) {
      var ret = '',
        info, id;
      try {
        switch (type) {

          case 'uri':
            var releaseUrl;
            var pathInfo = _.stringQuote(value);

            if (!urlMatch.test(pathInfo.rest)) {
              ret = value;
            } else {

              info = fis.project.lookup(value, file);

              if (info.file && info.file.isFile()) {
                if (path.isAbsolute(pathInfo.rest)) {
                  value = path.join(fis.project.getProjectPath(), pathInfo.rest);
                } else {
                  value = path.join(file.dirname, pathInfo.rest);
                }

                info = fis.file.wrap(value);
                releaseUrl = (function() {
                  if (info.domain) {
                    return info.domain + info.getHashRelease();
                  }
                  return info.getHashRelease();
                })();
                ret = pathInfo.quote + releaseUrl + pathInfo.quote;
              }else{
                ret = value;
              }
              
            }
            // info = fis.project.lookup(value, file);
            // if (info.file && info.file.isFile()) {
            //
            //   file.addLink(info.file.subpath);
            //
            //   if (info.file.useHash) {
            //     var locked = lockedCheck(file, info.file);
            //     if (!locked) {
            //       lock(file, info.file);
            //       info.file.addLink(file.subpath);
            //       exports(info.file);
            //       unlock(info.file);
            //       addDeps(file, info.file);
            //     }
            //   }
            //   var query = (info.file.query && info.query) ? '&' + info.query.substring(1) : info.query;
            //   var url = info.file.getUrl();
            //   var hash = info.hash || info.file.hash;
            //   ret = info.quote + url + query + hash + info.quote;
            // } else {
            //   ret = value;
            // }

            break;

          case 'embed':
          case 'jsEmbed':
            var pathInfo = _.stringQuote(value);

            if (!urlMatch.test(pathInfo.rest)) {
              ret = value;
            } else if (_.realpathSafe(pathInfo.rest)) {

              if (path.isAbsolute(pathInfo.rest)) {
                value = path.join(fis.project.getProjectPath(), pathInfo.rest);
              } else {
                value = path.join(file.dirname, pathInfo.rest);
              }

              info = fis.file.wrap(value);
              if (info.isImage()) {
                ret = pathInfo.quote + info.getBase64() + _.base64(info.getContent()) + pathInfo.quote;
              } else {
                ret = pathInfo.quote + info.getContent() + pathInfo.quote;
              }

            } else {
              ret = value;
            }
            break;
            // 用来存信息的，内容会被移除。
          case 'info':
            ret = '';
            break;
          default:
            if (!map[type]) {
              fis.log.error('unsupported fis language tag [%s]', type);
            }
        }


      } catch (e) {
        console.log(e);
      }
      return ret;
    });
  }
  return content;
}

/**
 * 标准化处理 html 内容, 识别各种语法，并将其转换成中间码。
 *
 * - `<!--inline[path]-->` to embed resource content
 * - `<img|embed|audio|video|link|object ... (data-)?src="path"/>` to locate resource
 * - `<img|embed|audio|video|link|object ... (data-)?src="path?__inline"/>` to embed resource content
 * - `<script|style ... src="path"></script|style>` to locate js|css resource
 * - `<script|style ... src="path?__inline"></script|style>` to embed js|css resource
 * - `<script|style ...>...</script|style>` to analyse as js|css
 *
 * @param {String} content html 内容。
 * @param {Callback} callback 正则替换回调函数，如果不想替换，请传入 null.
 * @param {File} file js 内容所在文件。
 * @memberOf fis.compile
 */
function extHtml(content, callback, file) {
  var reg = /(<script(?:(?=\s)[\s\S]*?["'\s\w\/\-]>|>))([\s\S]*?)(?=<\/script\s*>|$)|(<style(?:(?=\s)[\s\S]*?["'\s\w\/\-]>|>))([\s\S]*?)(?=<\/style\s*>|$)|<(img|embed|audio|video|link|object|source)\s+[\s\S]*?["'\s\w\/\-](?:>|$)|<!--inline\[([^\]]+)\]-->|<!--(?!\[)([\s\S]*?)(-->|$)/ig;
  callback = callback || function(m, $1, $2, $3, $4, $5, $6, $7, $8) {
    if ($1) { //<script>
      var embed = '';
      $1 = $1.replace(/(\s(?:data-)?src\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value) {
        if (isInline(fis.util.query(value))) {
          embed += map.embed.wrap(value);
          return '';
        } else {
          return prefix + map.uri.wrap(value);
        }
      });
      if (embed) {
        //embed file
        m = $1 + embed;
      } else {
        // m = xLang($1, $2, file, rType.test($1) ? (RegExp.$3 === 'javascript' ? 'js' : 'html') : 'js');
      }
    } else if ($3) { //<style>
      // m = xLang($3, $4, file, 'css');
    } else if ($5) { //<img|embed|audio|video|link|object|source>
      var tag = $5.toLowerCase();
      if (tag === 'link') {
        var inline = '',
          isCssLink = false,
          isImportLink = false;
        var result = m.match(/\srel\s*=\s*('[^']+'|"[^"]+"|[^\s\/>]+)/i);
        if (result && result[1]) {
          var rel = result[1].replace(/^['"]|['"]$/g, '').toLowerCase();
          isCssLink = rel === 'stylesheet';
          isImportLink = rel === 'import';
        }
        m = m.replace(/(\s(?:data-)?href\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(_, prefix, value) {
          if ((isCssLink || isImportLink) && isInline(fis.util.query(value))) {
            if (isCssLink) {
              inline += '<style' + m.substring(5).replace(/\/(?=>$)/, '').replace(/\s+(?:charset|href|data-href|hreflang|rel|rev|sizes|target)\s*=\s*(?:'[^']+'|"[^"]+"|[^\s\/>]+)/ig, '');
            }
            inline += map.embed.wrap(value);
            if (isCssLink) {
              inline += '</style>';
            }
            return '';
          } else {
            return prefix + map.uri.wrap(value);
          }
        });
        m = inline || m;
      } else if (tag === 'object') {
        m = m.replace(/(\sdata\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value) {
          return prefix + map.uri.wrap(value);
        });
      } else {
        m = m.replace(/(\s(?:(?:data-)?src(?:set)?|poster)\s*=\s*)('[^']+'|"[^"]+"|[^\s\/>]+)/ig, function(m, prefix, value) {
          var key = isInline(fis.util.query(value)) ? 'embed' : 'uri';
          if (prefix.indexOf('srcset') != -1) {
            //support srcset
            var info = fis.util.stringQuote(value);
            var srcset = [];
            info.rest.split(',').forEach(function(item) {
              var p;
              item = item.trim();
              if ((p = item.indexOf(' ')) == -1) {
                srcset.push(item);
                return;
              }
              srcset.push(map['uri'].wrap(item.substr(0, p)) + item.substr(p));
            });
            return prefix + info.quote + srcset.join(', ') + info.quote;
          }
          return prefix + map[key].wrap(value);
        });
      }
    } else if ($6) {
      m = map.embed.wrap($6);
    } else if ($7) {
      m = '<!--' + analyseComment($7) + $8;
    }
    return m;
  };
  content = content.replace(reg, callback);

  var info = {
    file: file,
    content: content
  };


  return info.content;
}
/**
 * 标准化处理 javascript 内容, 识别 __inline、__uri 和 __require 的用法，并将其转换成中间码。
 *
 * - [@require id] in comment to require resource
 * - __inline(path) to embedd resource content or base64 encodings
 * - __uri(path) to locate resource
 * - require(path) to require resource
 *
 * @param {String} content js 内容
 * @param {Callback} callback 正则替换回调函数，如果不想替换，请传入 null.
 * @param {File} file js 内容所在文件。
 * @memberOf fis.compile
 */
function extJs(content, callback, file) {
  var reg = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]*?(?:\*\/|$))|\b(__inline|__uri|__require|__id|__moduleId|__hash)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*')\s*\)/g;
  callback = callback || function(m, comment, type, value) {
    if (type) {
      switch (type) {
        case '__inline':
          m = map.jsEmbed.wrap(value);
          break;
        case '__uri':
          m = map.uri.wrap(value);
          break;
        case '__id':
          m = map.id.wrap(value);
          break;
        case '__moduleId':
          m = map.moduleId.wrap(value);
          break;
        case '__require':
          m = 'require(' + map.jsRequire.wrap(value) + ')';
          break;
        case '__hash':
          m = map.hash.wrap(value);
          break;
      }
    } else if (comment) {
      m = analyseComment(comment);
    }
    return m;
  };
  content = content.replace(reg, callback);
  var info = {
    file: file,
    content: content
  };

  fis.emit('standard:js', info);
  return info.content;
}

/**
 * 标准化处理 css 内容, 识别各种外链用法，并将其转换成中间码。
 *
 * - [@require id] in comment to require resource
 * - [@import url(path?__inline)] to embed resource content
 * - url(path) to locate resource
 * - url(path?__inline) to embed resource content or base64 encodings
 * - src=path to locate resource
 *
 * @param {String} content css 内容。
 * @param {Callback} callback 正则替换回调函数，如果不想替换，请传入 null.
 * @param {File} file js 内容所在文件。
 * @memberOf fis.compile
 */
function extCss(content, callback, file) {
  var reg = /(\/\*[\s\S]*?(?:\*\/|$))|(?:@import\s+)?\burl\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^)}\s]+)\s*\)(\s*;?)|\bsrc\s*=\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|[^\s}]+)/g;
  callback = callback || function(m, comment, url, last, filter) {
    if (url) {
      var key = isInline(fis.util.query(url)) ? 'embed' : 'uri';
      if (m.indexOf('@') === 0) {
        if (key === 'embed') {
          m = map.embed.wrap(url) + last.replace(/;$/, '');
        } else {
          m = '@import url(' + map.uri.wrap(url) + ')' + last;
        }
      } else {
        m = 'url(' + map[key].wrap(url) + ')' + last;
      }
    } else if (filter) {
      m = 'src=' + map.uri.wrap(filter);
    } else if (comment) {
      m = analyseComment(comment);
    }
    return m;
  };
  content = content.replace(reg, callback);

  var info = {
    file: file,
    content: content
  };

  fis.emit('standard:css', info);

  return info.content;
}

/**
 * 判断info.query是否为inline
 *
 * - `abc?__inline` return true
 * - `abc?__inlinee` return false
 * - `abc?a=1&__inline'` return true
 * - `abc?a=1&__inline=` return true
 * - `abc?a=1&__inline&` return true
 * - `abc?a=1&__inline` return true
 * @param {Object} info
 * @memberOf fis.compile
 */
function isInline(info) {
  return /[?&]__inline(?:[=&'"]|$)/.test(info.query);
}

/**
 * 分析注释中依赖用法。
 * @param {String} comment 注释内容
 * @param {Callback} [callback] 可以通过此参数来替换原有替换回调函数。
 * @memberOf fis.compile
 */
function analyseComment(comment, callback) {
  var reg = /(@(require|async|require\.async)\s+)('[^']+'|"[^"]+"|[^\s;!@#%^&*()]+)/g;
  callback = callback || function(m, prefix, type, value) {
    type = type === 'require' ? type : 'async';

    return prefix + map[type].wrap(value);
  };

  return comment.replace(reg, callback);
}

/**
 * 处理type类型为 `x-**` 的block标签。
 *
 * ```css
 * <head>
 *   <style type="x-scss">
 *    &commat;import "compass/css3";
 *
 *    #border-radius {
 *      &commat;include border-radius(25px);
 *    }
 *   </style>
 * </head>
 * ```
 * @param  {String} tag        标签
 * @param  {String} content    the content of file
 * @param  {File} file         fis.file instance
 * @param  {String} defaultExt what is ?
 * @return {String}
 * @function
 * @memberOf fis.compile
 */
function xLang(tag, content, file, defaultExt) {
  var ext = defaultExt;

  if (file.pipeEmbed === false) {
    switch (ext) {
      case 'html':
        content = extHtml(content, null, file);
        break;

      case 'js':
        content = extJs(content, null, file);
        break;

      case 'css':
        content = extCss(content, null, file);
        break;
    }

    return tag + content;
  } else {
    var isXLang = false;

    var m = rType.exec(tag);
    if (m) {
      var lang = m[3].toLowerCase();

      switch (lang) {
        case 'javascript':
          ext = 'js';
          break;

        case 'css':
          ext = 'css';
          break;

        default:
          if (lang.substring(0, 2) === 'x-') {
            ext = lang.substring(2);
            isXLang = true;
          }
          break;
      }
    }

    if (isXLang) {
      var mime = _.getMimeType(ext);
      mime && (mime !== 'application/x-' + ext) && (tag = tag.replace(rType, function(all, quote) {
        return ' type=' + quote + mime + quote;
      }));
    }
  }

  return tag + map.xlang.wrap(content, ext);
}

module.exports = function(file, transformOptions) {


  var buffer = "";

  return through(write, end);

  function write(chunk, enc, next) {
    buffer += chunk.toString();
    next();
  }

  function end(done) {

    var info = fis.file.wrap(file);
    var content = "";

    var self = this;
    content = builtinStandard(buffer, info, {});
    content = postStandard(content, info);
    self.push(content);
    self.push(null);
    done();

  }
}
