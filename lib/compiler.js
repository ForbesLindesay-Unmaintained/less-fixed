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
function compile(str, options) {
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

  var parser;
  return Promise.from(null).then(function () {
    parser = new LessParser(options);
    supportNpmImport(parser);
    return new Promise(function (resolve, reject) {
      parser.parse(str, function (err, ast) {
        if (err) return reject(err);
        else return resolve(ast);
      });
    });
  }).then(function (ast) {
    return fixUrls(ast.toCSS(options)).then(function (css) {
      return {
        files: filename ? Object.keys(parser.imports.files).concat([filename]) : [],
        css: css
      };
    });
  }).then(null, function (err) {
    throw fixError(err, options);
  });
}

function fixError(err, options) {
  if (err.constructor.name === 'LessError' && typeof err === 'object') {
    err.filename = err.filename || '"Unkown Source"';
    var ex = new Error(less.formatError(err, options)
                       .replace(/^[^:]+:/, ''), err.filename, err.line);
    ex.name = err.type;
    return ex;
  }
  return err;
}
