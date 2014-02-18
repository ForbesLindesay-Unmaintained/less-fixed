'use strict';

var path = require('path');
var less = require('../thirdparty/less');

module.exports = fixUrls;
function fixUrls(getURL) {
  less.tree.URL.prototype.genCSS = function (env, output) {
    output.add("url(");

    var basedir = this.currentFileInfo.currentDirectory;
    var add = output.add;
    var buf = [];
    output.add = function (chunk) {
      buf.push(chunk);
    };
    this.value.genCSS(env, output);
    output.add = add;
    var relativePathWithFragment = getString(buf);
    if (relativePathWithFragment && isFilePath(relativePathWithFragment)) {
      var relativePath = path.resolve(basedir, relativePathWithFragment.split('#')[0].split('?')[0]);
      var fragment = relativePathWithFragment.split('#').slice(1).join('#');
      var query = relativePathWithFragment.split('?').slice(1).join('?').split('#')[0];
      if (buf.length === 1) {
        buf[0] = getURL(relativePath, query, fragment);
      } else {
        buf[1] = getURL(relativePath, query, fragment);
      }
    }
    for (var i = 0; i < buf.length; i++) {
      output.add(buf[i]);
    }

    output.add(")");
  }
}

function isFilePath(url) {
  return url.substr(0, 2) !== '//' && url.substr(0, 5) !== 'http:' && url.substr(0, 6) !== 'https:';
}
function getString(buf) {
  if (typeof buf === 'string') return buf;
  if (buf.length === 3 && buf[0] === buf[2] && (buf[0] === '\'' || buf[0] === '"')) {
    return buf[1];
  }
  if (buf.length === 1 && buf[0].indexOf('"') === -1 && buf[0].indexOf('\'') === -1) {
    return buf[0];
  }
}
