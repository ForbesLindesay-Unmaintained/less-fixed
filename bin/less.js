#!/usr/bin/env node

var path = require('path');
var minimist = require('minimist');
var less = require('../');

var args = minimist(process.argv.slice(2), {
  boolean: ['h', 'help', 's', 'source-map', 'm', 'minify', 'g', 'generate-minified'],
  alias: {
    'h': 'help',
    's': 'source-map',
    'm': 'minify',
    'g': 'generate-minified'
  }
});

if (args.help || args._.length !== 2) {
  console.log('Usage: less <source> <destination> [options]');
  console.log('');
  console.log('options:');
  console.log('');
  console.log('  -h --help              Display usage info');
  console.log('  -m --minify            Minify output');
  console.log('  -g --generate-minified Grenerate separate .min.css file');
  console.log('  -s --source-map        Include source map in output');
  console.log('');
  process.exit(args.help ? 0 : 1);
}

var source = path.resolve(args._[0]);
var destination = path.resolve(args._[1]);
delete args._;

less.toDisc(source, destination, {
  minify: args.minify,
  generateMinified: args['generate-minified'],
  sourceMap: args['source-map']
}).done(function (res) {
  res.files.concat(res.assetsSources).forEach(function (source) {
    console.log('read: ' + source);
  });
  res.assets.concat([destination]).forEach(function (dest) {
    console.log('write: ' + dest);
  });
});
