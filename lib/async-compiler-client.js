'use strict';

var cp = require('child_process');
var Promise = require('promise');

module.exports = function (options) {
  var server = cp.fork(require.resolve('./async-compiler-server.js'));
  return compile(options, server.send.bind(server), function (handler) {
    server.on('message', handler);
  }, function (handler) {
    server.once('error', handler);
  }).then(function (res) {
    server.kill();
    return res;
  }, function (err) {
    server.kill();
    throw err;
  });
};

function compile(options, send, recieve, onError) {
  var getURL = options.getURL;
  delete options.getURL;
  return new Promise(function (resolve, reject) {
    onError(reject);
    recieve(function (message) {
      if (message.method === 'resolve') {
        resolve(message.args[0]);
      } else if (message.method === 'reject') {
        var err = new Error(message.args[0].message);
        err.name = message.args[0].name;
        err.stack = message.args[0].stack;
        reject(err);
      } else if (message.method === 'getURL') {
        Promise.from(getURL.apply(null, message.args)).done(function (res) {
          send({method: 'resolve', id: message.id, args: [res]});
        }, function (err) {
          send({method: 'reject', id: message.id, args: [{name: err.name, stack: err.stack, message: err.message, code: err.code}]});
        });
      } else {
        reject(new Error('Un expected method ' + message.method));
      }
    });
    send({method: 'compile', args: [options]});
  });
}
