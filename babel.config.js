module.exports = {
  presets: [
    'vca-jsx',
    '@vue/cli-plugin-babel/preset',
    ['@babel/preset-env', { targets: { node: 'current' } }],
  ],
};
