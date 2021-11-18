import path from 'path';
import { ServerConfig, ServerPlugin } from 'vite';
import * as nunjucks from 'nunjucks';

const { pages } = require('./utils.js');

const htmlPlugin: ServerPlugin = ({ app }) => {
  app.use(async (ctx, next) => {
    const expectsHtml = ctx.headers.accept && ctx.headers.accept.includes('text/html');
    if (expectsHtml) {
      const baseMatch = ctx.path.match(/(?<=^\/)[\w\d.-]+/);
      const baseUrl = baseMatch ? baseMatch[0] : '';
      // console.log(ctx.path, baseUrl);

      if (!(pages as Record<string, string>)[baseUrl]) {
        ctx.status = 404;
        return;
      }

      nunjucks.configure(path.join(__dirname, '../src/renderer'));
      ctx.body = nunjucks.render(
        path.join(__dirname, '../src/renderer/pages', baseUrl, '/index.html'),
        {
          development: true,
          ts: path.join('/pages/', baseUrl, 'index.ts'),
        },
      );
      // console.log('html', ctx.response);
    }
    await next();
  });
};

const assetsPlugin: ServerPlugin = ({ app }) => {
  app.use(require('koa-static')(path.join(__dirname, '../public/')));
};

const config: ServerConfig = {
  root: path.resolve(__dirname, '../src/renderer'),
  alias: {
    // '/': '/pages/main'
  },
  configureServer: [assetsPlugin, htmlPlugin],
};

export default config;
