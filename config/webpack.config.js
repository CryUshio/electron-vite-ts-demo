const path = require('path');
const nunjucks = require('nunjucks');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBar = require('webpackbar');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const { pages } = require('./utils');

module.exports = {
  mode: 'production',
  entry: Object.entries(pages).reduce((o, [key, dirname]) => {
    o[key] = path.join(dirname, 'index.tsx');
    return o;
  }, {}),
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '../dist/render'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.join(__dirname, '../src/renderer'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        use: ['cache-loader', 'babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          {
            loader: 'css-loader',
            options: { sourceMap: false, importLoaders: 2 },
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
            loader: MiniCssExtractPlugin.loader,
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
  optimization: {
    minimize: true,
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      minSize: 30000,
      minChunks: 2,
      maxAsyncRequests: 6,
      maxInitialRequests: 6,
      name: false,
      cacheGroups: {
        polyfill: {
          test: /[\\/]node_modules[\\/](core-js|@babel|regenerator-runtime)/,
          name: 'polyfill',
          priority: 70,
          minChunks: 1,
          reuseExistingChunk: true,
        },
        react: {
          name: 'react',
          test: /[\\/]node_modules[\\/](react|react-dom)/,
          priority: 20,
          minChunks: 1,
          reuseExistingChunk: true,
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          map: false,
          safe: true,
          discardComments: true,
        },
      }),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
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
