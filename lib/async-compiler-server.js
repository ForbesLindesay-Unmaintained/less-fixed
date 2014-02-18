'use strict';

var Promise = require('promise');
var compile = require('./compiler.js');

var guid = 0;
var pending = {};
process.on('message', function (message) {
  if (message.method === 'compile') {
    var options = message.args[0];
    var replacements = [];
    options.getURL = function (path, fragment) {
      var id = 'less-relative-file-path-resolved-placeholder-string-' + (guid++);
      replacements.push(new Promise(function (resolve, reject) {
        pending[id] = {resolve: function (url) {
          resolve({id: id, url: url});
        }, reject: reject};
        process.send({method: 'getURL', args: [path, fragment], id: id});
      }));
      return id;
    };
    compile(options).then(function (res) {
      return Promise.all(replacements).then(function (replacements) {
        replacements.forEach(function (replacement) {
          res.css = res.css.replace(replacement.id, replacement.url);
        });
        return res;
      });
    }).done(function (res) {
      process.send({method: 'resolve', args: [res]});
    }, function (err) {
      process.send({method: 'reject', args: [{name: err.name, stack: err.stack, message: err.message, code: err.code}]});
    });
  } else if (message.method === 'resolve') {
    pending[message.id].resolve(message.args[0]);
  } else if (message.method === 'reject') {
    pending[message.id].reject(message.args[0]);
  } else {
    throw new Error('Un recognised method ' + message.method);
  }
});
