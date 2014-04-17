'use strict';

var assert = require('assert');
var fs = require('fs');

var step = require('testit');
var npm = require('npm-fetch');
var unpack = require('tar-pack').unpack;
var mkdirp = require('mkdirp').sync;
var rimraf = require('rimraf').sync;


step('cleanup', function () {
  rimraf(__dirname + '/thirdparty/less');
  mkdirp(__dirname + '/thirdparty/less');
});

step('download', function (callback) {
  npm('less', '*').pipe(unpack(__dirname + '/thirdparty/less', callback));
}, '60 seconds');

step('fixup to add "@import (npm)" support', function () {
  var src = fs.readFileSync(__dirname + '/thirdparty/less/lib/less/parser.js', 'utf8');
  assert(!/npm/.test(src), 'Src doesn\'t refer to npm before we mutate it');
  src = src.replace('less|css|multiple|once|inline|reference', 'less|css|multiple|once|inline|reference|npm');
  assert(/npm/.test(src), 'Src does refer to npm after we mutate it');
  fs.writeFileSync(__dirname + '/thirdparty/less/lib/less/parser.js', src);
});
//numPrecision: 8

step('fixup to add url(...) support', function () {
  var src = fs.readFileSync(__dirname + '/thirdparty/less/lib/less/parser.js', 'utf8');
  assert(!/getURL/.test(src), 'Src doesn\'t refer to getURL before we mutate it');
  src = src.replace(/( *)numPrecision\: 8/, '$1numPrecision: 8,\n$1getURL: options.getURL');
  assert(/getURL/.test(src), 'Src does refer to getURL after we mutate it');
  fs.writeFileSync(__dirname + '/thirdparty/less/lib/less/parser.js', src);
});

step('copy optionalDependencies and dependencies', function () {
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
  var less = JSON.parse(fs.readFileSync(__dirname + '/thirdparty/less/package.json', 'utf8'));
  pkg['less-version'] = less.version;
  pkg.dependencies = pkg.dependencies || {};
  if (less.dependencies && typeof less.dependencies === 'object') {
    Object.keys(less.dependencies).forEach(function (key) {
      pkg.dependencies[key] = less.dependencies[key];
    });
  }
  pkg.optionalDependencies = pkg.optionalDependencies || {};
  if (less.optionalDependencies && typeof less.optionalDependencies === 'object') {
    Object.keys(less.optionalDependencies).forEach(function (key) {
      if (!key in pkg.dependencies) {
        pkg.optionalDependencies[key] = less.optionalDependencies[key];
      }
    });
  }
  fs.writeFileSync(__dirname + '/package.json', JSON.stringify(pkg, null, '  '));
});
