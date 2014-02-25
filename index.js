'use strict';

var path = require('path');
var fs = require('fs');
var Promise = require('promise');
var slugg = require('slugg');
var mkdirp = Promise.denodeify(require('mkdirp'));
var CleanCSS = require('clean-css');
var compiler = require('./lib/async-compiler-client');
var Map = require('./lib/map.js');

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
  var assetLocations = new Map();
  var written = [];
  var assetsWritten = [];

  output = path.resolve(output);
  var assetsRelative = (options.assets || './assets').replace(/\/$/, '');
  var assets = path.resolve(path.dirname(output), assetsRelative);
  if (options.assets) delete options.assets;
  return mkdirp(assets).then(function () {
    if (options.sourceMap) {
      options.writeSourceMapTo = output + '.map';
      options.sourceMapURL = './' + path.basename(output) + '.map';
      options.outputSourceFiles = true;
    }
    if (options.minify) {
      options.compress = true;
    }
    return compile(filename, function (file) {
      var basename = slugg(path.basename(file, path.extname(file))) + path.extname(file);
      var name = basename;
      if (assetLocations.has(file)) {
        name = assetLocations.get(file);
        return assetsRelative + '/' + name;
      } else {
        var i = 1;
        while (written.indexOf(name) !== -1) {
          name = (i++) + '-' + basename;
        }
        assetLocations.set(file, name);
        written.push(name);
      }
      assetsWritten.push({
        source: file,
        destination: path.join(assets, name)
      });
      return copyFile(file, path.join(assets, name)).then(function () {
        return assetsRelative + '/' + name;
      });
    }, options);
  }).then(function (res) {
    res.assets = assetsWritten;
    var writttenMinified;
    if (options.generateMinified) {
      var minified = new CleanCSS().minify(res.css);
      writttenMinified = writeFile(output.replace(/\.css$/, '.min.css'), minified);
    }
    return Promise.all(writeFile(output, res.css), writttenMinified).then(function () {
      return res;
    });
  });
}
