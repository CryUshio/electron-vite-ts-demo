module.exports = {
  presets: [
    ['@babel/preset-env', { corejs: 3 }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    //   ['import', { libraryName: 'antd', style: 'css' }], // `style: true` 会加载 less 文件
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-transform-runtime'],
  ],
};
