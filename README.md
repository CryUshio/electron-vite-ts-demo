# electron-vue3-ts-demo
electron+vue3+vite+webpack+ts+tsx+multi-page build demo

# Introduction
`Vite` 目前并未支持启动多页面开发服务器，所以 `socket` 将共用一个频道，修改后会触发所有浏览器上已经打开的页面更新。

本 `demo` 以 `nunjunks` 模板引擎为基础支持多 html 文件，开发环境使用 `vite`，生产环境使用 `webpack` 构建多页面。

# Usage
```
npm i && npm run dev
```
