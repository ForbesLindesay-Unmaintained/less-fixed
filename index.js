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

module.exports.toFolder = compileToFolder;
function compileToFolder(filename, output, options) {
  var files = [];
  var sources = [];
  return mkdirp(path.join(path.dirname(output), 'assets')).then(function () {
    return compile(filename, function (file) {
      var basename = slugg(path.basename(file, path.extname(file))) + path.extname(file);
      var name = basename;
      var i = 1;
      while (files.indexOf(name) !== -1 && sources[files.indexOf(name)] !== file) {
        name = (i++) + '-' + basename;
      }
      console.dir(name);
      files.push(name);
      sources.push(file);
      return copyFile(file, path.join(path.dirname(output), 'assets', name)).then(function () {
        return './assets/' + name;
      });
    }, options);
  }).then(function (res) {
    return writeFile(output, res.css).then(function () {
      return res;
    });
  });
}
