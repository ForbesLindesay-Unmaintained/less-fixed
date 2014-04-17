'use strict';

var path = require('path');
var Promise = require('promise');
var less = require('../thirdparty/less');

var id = 0;
var pending = {};

module.exports = doReplacements;
function doReplacements(str) {
  var required = [];
  var results = {};
  str.replace(/__placeholder_url_generated_by_less_fixed_\d+__/g, function (key) {
    if (pending[key]) {
      required.push(Promise.resolve(pending[key]).then(function (value) {
        results[key] = value;
      }));
      delete pending[key];
    }
  });
  return Promise.all(required).then(function () {
    return str.replace(/__placeholder_url_generated_by_less_fixed_\d+__/g, function (key) {
      if (results[key]) {
        return results[key];
      } else {
        return key;
      }
    });
  });
}

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
  var result = env.getURL(this.currentFileInfo.filename, getString(buf));
  if (isPromise(result)) {
    id++;
    var key = '__placeholder_url_generated_by_less_fixed_' + id + '__';
    pending[key] = result;
    result = key;
  }
  if (buf.length === 1) {
    buf[0] = result;
  } else {
    buf[1] = result;
  }
  for (var i = 0; i < buf.length; i++) {
    output.add(buf[i]);
  }

  output.add(")");
};

function isFilePath(url) {
  return url.substr(0, 2) !== '//'
  && url.substr(0, 5) !== 'http:'
  && url.substr(0, 6) !== 'https:'
  && url.substr(0, 5) !== 'data:';
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
function isPromise(value) {
  return value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}
