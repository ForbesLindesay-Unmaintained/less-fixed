'use strict';

var test = require('testit');
var compile = require('../');

test('compile twbs', function () {
  return compile.toFolder(__dirname + '/fixtures/twbs.less', __dirname + '/output/twbs.css').then(function (res) {
    console.dir(res.files);
  });
});
