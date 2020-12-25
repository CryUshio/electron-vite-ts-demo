import path from 'path';
import { ServerConfig, ServerPlugin } from 'vite';
import { configureServer, resolvers } from 'vite-plugin-react';
import * as nunjucks from 'nunjucks';

const { pages } = require('./utils.js');

const htmlPlugin: ServerPlugin = ({ app }) => {
  app.use(async (ctx, next) => {
    const expectsHtml = ctx.headers.accept && ctx.headers.accept.includes('text/html');
    if (expectsHtml) {
      const baseMatch = ctx.path.match(/(?<=^\/)[\w\d.-]+/);
      const baseUrl = baseMatch ? baseMatch[0] : '';

      if (!(pages as Record<string, string>)[baseUrl]) {
        ctx.status = 404;
        return;
      }

      nunjucks.configure(path.join(__dirname, '../src/view'));
      ctx.body = nunjucks.render(
        path.join(__dirname, '../src/view/pages', baseUrl, '/index.html'),
        {
          development: true,
          ts: path.join('/pages/', baseUrl, 'index.tsx'),
        },
      );
    }
    await next();
  });
};

const assetsPlugin: ServerPlugin = ({ app }) => {
  app.use(require('koa-static')(path.join(__dirname, '../public/')));
};

const config: ServerConfig = {
  jsx: 'react',
  root: path.resolve(__dirname, '../src/view'),
  alias: {
    // '/': '/pages/main'
  },
  resolvers,
  configureServer:
    configureServer instanceof Array
      ? [assetsPlugin, htmlPlugin].concat(configureServer)
      : [assetsPlugin, htmlPlugin, configureServer],
};

export default config;
