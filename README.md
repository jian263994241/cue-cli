# Cue-CLI 使用说明

## 一、Cue

基于FIS3封装的前端解决方案

- CSS 集成less预编译编译 入口 `*.css.less`

- JS 集成`react`、`coffee`、`browserify`编译

- browserify 入口文件`*.entry.js`

### 1.模块化目录结构

- `mod/**`  放自有模块
打包完成后编译目录里面不会出现 mod 文件夹
- `res/**`  放静态资源
- `third/**`  放第三方资源

### 2.安装Cue

    npm install -g cue-cli

### 3.快速入门

打包,编译到`./output`

        c release build

在`build`的基础上 增加了 资源压缩、去console.log 编译到`./dist`文件夹

        c release dist

和`dist`方案一样, 保留console.log  编译到 `./output`

        c release op

发布生产用, 在`build`的基础上 增加了`hash指纹` 和 `发布路径`

        c release prod2


## 二、Web Server

内置 Web Server，可以方便调试构建结果。

### 1、Server开启\关闭

        c server start 启动服务
        c server stop 关闭服务
        c server open  打开缓存目录
        c server clean 清理缓存目录


 来启动本地 `Web Server`，当此 Server 启动后，会自动浏览器打开 `http://127.0.0.1:8080`，默认监听端口 `8080`


### 3、发布到Server

 默认被发布到内置 `Web Server的根目录`下，当启动服务时访问此目录下的资源。

        c release


### 4、浏览器自动刷新

文件修改自动构建发布后，浏览器自动刷新。

        c release -L


### 5、发布到本地

 发布到 项目目录下的`./output` 文件夹

        c release build



## 三、代码书写技巧

### 1、在HTML中嵌入资源

- 嵌入图片(转base64 图片)


		<img title="logo" src="images/logo.gif?__inline"/>


- 嵌入样式


		<link rel="stylesheet" type="text/css" href="demo.css?__inline">

- 嵌入html


 		<link rel="import" href="demo.html?__inline">


- 嵌入js


		<script type="text/javascript" src="demo.js?__inline"></script>



### 2、在CSS中嵌入资源

- 嵌入图片


		.style {
      		background: url(images/logo.gif?__inline);
  		}


- 嵌入css


		@import url('demo.css?__inline');


## 在JS中嵌入资源


		__inline('a.js');


### 3.LESS

- 编译 `*.css.less`
- cssautoprefixer 编译完后,默认开启autoprefixer

### 4.注意

- 所有资源必须放在项目目录下,不能引入项目目录意外的资源
- 互联网资源不能编译

### 5.模块化

让你使用类似于 `node` 的 `require()` 的方式来组织浏览器端的 Javascript 代码

    require js|coffee|css|less|html

- bowserify 模块方案
- `*.entry.js` 为入口文件
- 详细文档 [bowserify](https://www.npmjs.com/package/bowserify "bowserify")
- 模块化 目录结构 `c init`
