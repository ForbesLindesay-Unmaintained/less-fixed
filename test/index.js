'use strict';

var test = require('testit');
var less = require('../');

test('compile twbs minified', function () {
  return less.renderFileToDisc(__dirname + '/fixtures/twbs.less', __dirname + '/output/twbs.css', {
    generateMinified: true,
    sourceMap: true
  }).then(function (res) {
    console.dir(res.files);
  });
});