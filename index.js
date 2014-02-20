'use strict';

var path = require('path');
var fs = require('fs');
var Promise = require('promise');
var slugg = require('slugg');
var mkdirp = Promise.denodeify(require('mkdirp'));
var compiler = require('./lib/async-compiler-client');

var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);
function copyFile(from, to) {
  return readFile(from).then(function (data) {
    return writeFile(to, data);
  });
}

module.exports = compile;
function compile(filename, getURL, options) {
  options = options || {};
  options.filename = filename;
  options.getURL = getURL;
  return compiler(options);
}

module.exports.toDisc = compileToDisc;
function compileToDisc(filename, output, options) {
  options = options || {};
  var files = [];
  var sources = [];
  var written = [];
  output = path.resolve(output);
  var assetsRelative = (options.assets || './assets').replace(/\/$/, '');
  var assets = path.resolve(path.dirname(output), assetsRelative);
  if (options.assets) delete options.assets;
  return mkdirp(assets).then(function () {
    return compile(filename, function (file) {
      var basename = slugg(path.basename(file, path.extname(file))) + path.extname(file);
      var name = basename;
      var i = 1;
      while (files.indexOf(name) !== -1 && sources[files.indexOf(name)] !== file) {
        name = (i++) + '-' + basename;
      }
      files.push(name);
      sources.push(file);
      written.push(path.join(assets, name));
      return copyFile(file, path.join(assets, name)).then(function () {
        return assetsRelative + '/' + name;
      });
    }, options);
  }).then(function (res) {
    res.assetsSources = sources;
    res.assets = written;
    return writeFile(output, res.css).then(function () {
      return res;
    });
  });
}
