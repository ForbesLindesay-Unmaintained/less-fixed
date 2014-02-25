'use strict';

var test = require('testit');
var compile = require('../');

test('compile twbs', function () {
  return compile.toDisc(__dirname + '/fixtures/twbs.less', __dirname + '/output/twbs.css', {
    generateMinified: true,
    sourceMap: true
  }).then(function (res) {
    console.dir(res.files);
  });
});
