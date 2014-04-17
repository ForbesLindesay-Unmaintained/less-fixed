'use strict';

var path = require('path');
var fs = require('fs');
var Promise = require('promise');
var slugg = require('slugg');
var mkdirp = Promise.denodeify(require('mkdirp'));
var CleanCSS = require('clean-css');
var compiler = require('./lib/compiler');

var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);
function copyFile(from, to) {
  return new Promise(function (resolve, reject) {
    var from = fs.createReadStream(from);
    var to = fs.createWriteStream(to);
    from.pipe(to);
    from.on('error', reject);
    to.on('error', reject);
    to.on('close', resolve);
  });
}

exports.compile = function (source, options) {
  if (options.writeSourceMap || options.inlineSourceMap) {
    options.outputSourceFiles = true;
  }
  return compiler(source, options);
};
exports.render = function (source, options) {
  return exports.compile(source, options).then(function (res) {
    return res.css;
  });
};

exports.renderFile = function (filename, options) {
  options = options || {};
  options.filename = filename;

  return readFile(filename, 'utf8').then(function (source) {
    return exports.render(source, options);
  });
};

exports.renderFileToDisc = function (filename, output, options) {
  options = options || {};
  var renderOptions = {};
  var assets = (options.assets || './assets').replace(/\/$/, '');
  var assetsAbsolute = path.resolve(path.dirname(output), assets);
  var madeAssestsDirectory = lazy(mkdirp.bind(null, assetsAbsolute));

  var assetLocations = {};
  var written = [];
  var assetsWritten = [];
  var pending = [];
  renderOptions.getURL = function (from, to) {
    if (!isFilePath(to)) return to;
    var dirReady = madeAssestsDirectory();
    var suffix = '';
    if (to.indexOf('?') !== -1) {
      suffix = '?' + to.split('?').slice(1).join('?');
      to = to.split('?')[0];
    }
    if (to.indexOf('#') !== -1) {
      suffix = '#' + to.split('#').slice(1).join('#');
      to = to.split('#')[0];
    }
    
    var filename = path.resolve(from, to);
    var basename = slugg(path.basename(filename, path.extname(filename))) + path.extname(filename);
    var name = basename;

    if (('key:' + filename) in assetLocations) {
      name = assetLocations['key:' + filename];
      return assets + '/' + name + suffix;
    }

    var i = 1;
    while (written.indexOf(name) !== -1) {
      name = (i++) + '-' + basename;
    }
    assetLocations['key:' + filename] = name;
    written.push(name);

    assetsWritten.push({
      source: filename,
      destination: path.join(assetsAbsolute, name)
    });

    var copiedFile = dirReady.then(function () {
      return copyFile(filename, path.join(assetsAbsolute, name));
    });
    pending.push(copiedFile);

    return assets + '/' + name + suffix;
  };

  if (options.writeSourceMap) {
    renderOptions.sourceMapURL = options.sourceMapURL || './' + path.basename(output) + '.map';
    renderOptions.writeSourceMap = function (sourcemap) {
      return writeFile(path.resolve(path.basedir(output), renderOptions.sourceMapURL), sourcemap);
    };
  }

  renderOptions.filename = filename;
  return readFile(filename, 'utf8').then(function (less) {
    return exports.compile(less, renderOptions);
  }).then(function (res) {
    res.assets = assetsWritten;
    return res;
  });
};

function lazy(fn) {
  var called = false;
  var value;
  return function () {
    if (called) return value;
    called = true;
    return value = fn.apply(this, arguments);
  };
}

function isFilePath(url) {
  return url.substr(0, 2) !== '//'
  && url.substr(0, 5) !== 'http:'
  && url.substr(0, 6) !== 'https:'
  && url.substr(0, 5) !== 'data:';
}
