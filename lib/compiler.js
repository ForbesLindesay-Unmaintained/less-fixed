'use strict';

var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var less = require('../thirdparty/less');
var fixUrls = require('./url-fixer.js');
var supportNpmImport = require('./support-npm-import.js');

var readFile = Promise.denodeify(fs.readFile);
var LessParser = less.Parser;

module.exports = compile;
function compile(options) {
  options.filename = path.resolve(options.filename);
  return readFile(options.filename, 'utf8').then(function (str) {
    return parse(str, options);
  });
}

function parse(str, options) {
  // fix options
  var filename = options.filename;
  if (filename) {
    options.paths = options.paths || [];
    if (options.paths.indexOf(path.dirname(filename)) === -1) {
      options.paths.push(path.dirname(filename));
    }
    if (options.paths.indexOf('') === -1) {
      options.paths.push('');
    }
  }
  options.syncImport = true;
  var parser;
  return Promise.from(null).then(function () {
    parser = new LessParser(options);
    fixUrls(options.getURL);
    supportNpmImport(parser);
    return new Promise(function (resolve, reject) {
      parser.parse(str, function (err, ast) {
        if (err) return reject(err);
        else return resolve(ast);
      });
    });
  }).then(function (ast) {
    return {
      files: filename ? Object.keys(parser.imports.files).concat([filename]) : [],
      css: ast.toCSS(options)
    };
  }).then(null, function (err) {
    if (err.constructor.name === 'LessError' && typeof err === 'object') {
      err.filename = err.filename || '"Unkown Source"';
      var ex = new Error(less.formatError(err, options)
                         .replace(/^[^:]+:/, ''), err.filename, err.line);
      ex.name = err.type;
      throw ex;
    }
    throw err;
  });
}
