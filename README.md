## cue-cli

基于fis3封装的前端解决方案

- css 集成less预编译编译 入口 `*.css.less`

- js 集成 react browserify 编译

- browserify 入口文件`*.entry.js`

### 模块化目录结构

- mod/**  放自有模块
打包完成后  dist目录里面不会出现 mod 文件夹
- res/**  放静态资源
- third/**  放第三方资源


### 安装cue-cli

```javascript
npm install -g cue-cli
```
## Web Server

内置 Web Server，可以方便调试构建结果。

##启动

通过

    c server start

- 来启动本地 Web Server，当此 Server 启动后，会自动浏览器打开 `http://127.0.0.1:8080`，默认监听端口 8080
- 增加了移动端调试 console



## 预览

启动 Web Server 以后，会自动打开浏览器，访问 `http://127.0.0.1:8080` URL，这时即可查看到页面渲染结果。正如所有其他 Web Server，FIS3 内置的 Server 是常驻的，如果不重启计算机或者调用命令关闭是不会关闭的。

所以后续只需访问对应链接即可，而不需要每次 release 就启动一次 server。

## 文件监听&自动刷新

    c release -L

添加 `-L`参数时，程序不会执行终止；停止程序用快捷键 `CTRL+c`

## 编译&打包

c release build

c release prod2

发布用, 在`build`的基础上 增加了 资源压缩  hash指纹 和 发布路径

*所有静态资源请用绝对路径*

## 在html中嵌入资源

- 嵌入图片(转base64 图片)
```html
<img title="logo" src="images/logo.gif?__inline"/>
```

- 嵌入样式
```html
<link rel="stylesheet" type="text/css" href="demo.css?__inline">
```
- 嵌入html
```html
 <link rel="import" href="demo.html?__inline">
```
- 嵌入js
```html
<script type="text/javascript" src="demo.js?__inline"></script>
```


## 在css中嵌入资源

- 嵌入图片
```css
.style {
      background: url(images/logo.gif?__inline);
  }
```
- 嵌入css
```css
@import url('demo.css?__inline');
```

## js,es6,jsx 中嵌入资源

```javascript

__uri();  //发布处理路径
__inline();  // 图片转 base64

```

## less
- 默认过滤`_`开头的less文件
- 自动`import`同目录下的 _variable.less,_mixinx.less,_vars.less
- html中内联less 执行编译
```css
<style type="text/x-less">
body{
	a{
		color:red;
	}
}
</style>
```
- 外链的less
```html
<link rel="stylesheet" href="css/ios/framework7.ios.less">
```

## cssautoprefixer

- 编译完后,默认开启autoprefixer

## 备注
- 所有资源必须放在项目目录下
- 互联网资源不能编译



## 模块化

让你使用类似于 node 的 require() 的方式来组织浏览器端的 Javascript 代码

- bowserify 模块方案 (less es6 jsx)
- `*.entry.js` 为入口文件
- 详细文档 [bowserify NPM](https://www.npmjs.com/package/bowserify "bowserify")
- 模块化 目录结构 `c init`


## 环境配置 __getConf

c release prod2 读取 conf-prod.json

其他 media 去读 conf.json

具体参考: [fis3-parser-get-conf](https://www.npmjs.com/package/fis3-parser-get-conf)
