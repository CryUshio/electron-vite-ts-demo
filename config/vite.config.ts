import path from 'path';
import { defineConfig, Plugin } from 'vite';
import PluginVue from '@vitejs/plugin-vue';
import PluginCommonjs from '@rollup/plugin-commonjs';
import nunjucks from 'nunjucks';

// const { pages } = require('./utils.js');

const HtmlPlugin = (): Plugin => ({
  name: 'html-plugin',
  transformIndexHtml(html) {
    nunjucks.configure(path.join(__dirname, '../src/renderer'));
    return nunjucks.renderString(html, {
      development: true,
      ts: path.join('index.ts'),
    });
  },
});

export default defineConfig({
  root: path.resolve(__dirname, '../src/renderer'),
  plugins: [PluginVue(), PluginCommonjs(), HtmlPlugin()],
  publicDir: path.join(__dirname, '../public/'),
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
  // optimizeDeps: {
  //   include: ['electron'],
  // },
});
