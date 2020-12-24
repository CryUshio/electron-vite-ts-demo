const path = require('path');
const glob = require('glob');

const pages = glob
  .sync(path.resolve(__dirname, '../src/view/pages/*/index.ts'))
  .reduce((o, entry) => {
    const dir = path.dirname(entry);
    const match = dir.match(/[\w\d.-]+$/);
    const pageName = match ? match[0] : '';
    if (pageName) {
      o[pageName] = entry;
    }
    return o;
  }, {});

exports.pages = pages;
