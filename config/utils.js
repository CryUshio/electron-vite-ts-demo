const path = require('path');
const glob = require('glob');

const pages = glob.sync(path.resolve(__dirname, '../src/view/pages/*')).reduce((o, entry) => {
  const pageName = path.basename(entry);
  if (pageName) {
    o[pageName] = entry;
  }
  return o;
}, {});

exports.pages = pages;
