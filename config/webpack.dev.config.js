const path = require('path');
const nunjucks = require('nunjucks');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBar = require('webpackbar');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const CopyPlugin = require('copy-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const { pages } = require('./utils');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    hot: true,
    host: '127.0.0.1',
    port: 3000,
    static: {
      directory: path.join(__dirname, '../public'),
    },
    compress: false,
  },
  entry: Object.entries(pages).reduce((o, [key, dirname]) => {
    o[key] = path.join(dirname, 'index.ts');
    return o;
  }, {}),
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '../dist/renderer'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      vue: '@vue/runtime-dom',
      '@': path.join(__dirname, '../src/renderer'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          'babel-loader',
          // {
          //   loader: 'ts-loader',
          //   options: {
          //     transpileOnly: true,
          //     appendTsSuffixTo: ['\\.vue$'],
          //   },
          // },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          // {
          //   loader: 'postcss-loader',
          // },
          {
            loader: 'less-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {},
          },
          {
            loader: 'css-loader',
            options: { sourceMap: false, importLoaders: 1 },
          },
          // {
          //   loader: 'postcss-loader',
          // },
        ],
      },
      {
        test: /\.(gif|png|jpe?g|svg|ico)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: 'assets/[name].[contenthash].[ext]',
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: true,
              preprocessor: (content, loaderContext) => {
                let result;
                try {
                  nunjucks.configure(path.join(__dirname, '../src/renderer'));
                  result = nunjucks.renderString(content, {
                    development: false,
                    BASE_URL: '127.0.0.1:3000',
                  });
                } catch (error) {
                  loaderContext.emitError(error);
                  return content;
                }
                return result;
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    ...Object.entries(pages).map(([chunk, dirname]) => {
      return new HtmlWebpackPlugin({
        minify: false,
        filename: `${chunk}.html`,
        template: path.join(dirname, 'index.html'),
        chunks: [chunk],
        inject: true,
      });
    }),
    new CopyPlugin({
      patterns: [{ from: path.join(__dirname, '../public/favicon.ico') }],
    }),
    new WebpackBar(),
    new FriendlyErrorsWebpackPlugin(),
  ],
};
