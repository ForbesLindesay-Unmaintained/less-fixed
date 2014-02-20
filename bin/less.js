#!/usr/bin/env node

var path = require('path');
var minimist = require('minimist');
var less = require('../');

var args = minimist(process.argv.slice(2), {
  boolean: ['help', 'h'],
  alias: {
    'h': 'help'
  }
});

if (args.help || args._.length !== 2) {
  console.log('Usage: less <source> <destination>');
  process.exit(args.help ? 0 : 1);
}

var source = path.resolve(args._[0]);
var destination = path.resolve(args._[1]);
delete args._;

less.toDisc(source, destination, args).done(function (res) {
  res.files.concat(res.assetsSources).forEach(function (source) {
    console.log('read: ' + source);
  });
  res.assets.concat([destination]).forEach(function (dest) {
    console.log('write: ' + dest);
  });
});
