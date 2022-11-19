import path from 'path';
import { defineConfig, Plugin } from 'vite';
import PluginVue from '@vitejs/plugin-vue';
import PluginCommonjs from '@rollup/plugin-commonjs';
import nunjucks from 'nunjucks';
import swc from 'rollup-plugin-swc';

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
  server: {
    port: 3000,
  },
  root: path.resolve(__dirname, '../src/renderer'),
  plugins: [
    PluginVue(),
    swc({
      jsc: {
        parser: {
          syntax: 'typescript',
          // tsx: true, // If you use react
          dynamicImport: true,
          decorators: true,
        },
        target: 'es2022',
        transform: {
          decoratorMetadata: true,
        },
      },
    }),
    PluginCommonjs(),
    HtmlPlugin(),
  ],
  publicDir: path.join(__dirname, '../public/'),
  build: {
    rollupOptions: {
      external: ['electron'],
    },
  },
  esbuild: false,
  // optimizeDeps: {
  //   include: ['electron'],
  // },
});
