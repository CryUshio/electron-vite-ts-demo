module.exports = {
  presets: [
    'vca-jsx',
    '@vue/cli-plugin-babel/preset',
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
      },
    ],
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
  plugins: [
    'babel-plugin-transform-typescript-metadata',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties'],
  ],
};
