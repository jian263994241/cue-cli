## cue-cli

基于fis3封装的前端解决方案

- css 集成less预编译编译 入口 `*.css.less`

- js 集成 react coffee browserify 编译

- browserify 入口文件`*.entry.js`

### 模块化目录结构

- mod/**  放自有模块
打包完成后  dist目录里面不会出现 mod 文件夹
- res/**  放静态资源
- third/**  放第三方资源

### 快速入门

    c release build

打包,编译到`./output`

    c release dist

在`build`的基础上 增加了 资源压缩、去console.log 编译到`./dist`文件夹

    c release dist

和dist 方案一样, 保留console.log  编译到 `./output`

    c release prod2

发布生产用, 在`build`的基础上 增加了  hash指纹 和 发布路径



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

    c server start

- 来启动本地 Web Server，当此 Server 启动后，会自动浏览器打开 `http://127.0.0.1:8080`，默认监听端口 8080

##浏览器自动刷新

文件修改自动构建发布后，浏览器自动刷新。

    c release -L

## 发布到本地

    c release build

- 发布到 项目目录下的 ./output 文件夹


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
## 在js中嵌入资源
```javascript
__inline('a.js');
```
## less
- 编译 `*.css.less`


## cssautoprefixer

- 编译完后,默认开启autoprefixer

## 备注
- 所有资源必须放在项目目录下,不能引入项目目录意外的资源
- 互联网资源不能编译

## 模块化

让你使用类似于 node 的 require() 的方式来组织浏览器端的 Javascript 代码

require js|coffee|css|less|html

- bowserify 模块方案
- `*.entry.js` 为入口文件
- 详细文档 [bowserify NPM](https://www.npmjs.com/package/bowserify "bowserify")
- 模块化 目录结构 `c init`
