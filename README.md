# cue-cli

基于fis3封装的前端解决方案

- css 集成scss,less预编译编译

- js 集成 react coffee browserify 编译

- browserify 入口文件`*.entry.js`

过滤 `.inc.{html,css,js}` 文件

Node 版本要求 4.x

**node 5.0 会出现兼容问题,部分功能可用**

### 安装cue-cli

```javascript
npm install -g cue-cli
```
## Web Server

内置 Web Server，可以方便调试构建结果。

##目录

构建时不指定输出目录，即不指定 `-d` 参数时，构建结果被发送到内置 Web Server 的根目录下。此目录可以通过执行以下命令打开。

    c server open

##发布

    c release

- 默认被发布到内置 Web Server的根目录下，当启动服务时访问此目录下的资源。

##启动

通过

    c server start

- 来启动本地 Web Server，当此 Server 启动后，会自动浏览器打开 `http://127.0.0.1:8080`，默认监听端口 8080



## 预览

启动 Web Server 以后，会自动打开浏览器，访问 `http://127.0.0.1:8080` URL，这时即可查看到页面渲染结果。正如所有其他 Web Server，FIS3 内置的 Server 是常驻的，如果不重启计算机或者调用命令关闭是不会关闭的。

所以后续只需访问对应链接即可，而不需要每次 release 就启动一次 server。

## 文件监听

为了方便开发，cue 支持文件监听，当启动文件监听时，修改文件会构建发布。而且其编译是增量的，编译花费时间少。

FIS3 通过对 `release` 命令添加 `-w `或者 `--watch` 参数启动文件监听功能。

    c release -w

添加 `-w `参数时，程序不会执行终止；停止程序用快捷键 `CTRL+c`

##浏览器自动刷新

文件修改自动构建发布后，如果浏览器能自动刷新，这是一个非常好的开发体验。

cue 支持浏览器自动刷新功能，只需要给 release 命令添加 `-L` 参数，通常 `-w` 和 `-L `一起使用。

    c release -wL

## 发布到本地

    c release qa

- 发布到 项目目录下的 ./dist 文件夹


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
## scss


- 默认对非`_`开头的scss文件编译
- html中内联scss 执行编译
```css
<style type="text/x-scss">
body{
	a{
		color:red;
	}
}
</style>
```
- 外链的scss
```html
<link rel="stylesheet" href="css/ios/framework7.ios.scss">
```
## cssautoprefixer

- 编译完后,默认开启autoprefixer

## 备注
- 所有资源必须放在项目目录下
- 互联网资源不能编译



## 模块化

让你使用类似于 node 的 require() 的方式来组织浏览器端的 Javascript 代码

- bowserify 模块方案
- `*.entry.js` 为入口文件
- 详细文档 [bowserify NPM](https://www.npmjs.com/package/bowserify "bowserify")


##模板预编译

- 对`x-template`代码段,`*.tpl`文件进行编译
- 通过`<!-- @name : temp  -->`设定返回的 `compiler` 变量名

```html
<script type="text/x-template" id="tpl">

    <!-- @name : temp  -->

    <% for(var i = 0;i<10;i++){ %>
        <div class="test">#demo#<%=i%></div>
    <%}%>
</script>
```
编译后使用
```javascript
var templateStr = $('#tpl').html();
eval(templateStr);
//data(可选参数) : 需要渲染的数据
//temp : 返回的 `compiler` 变量名
var htmlStr = temp(data);
```
