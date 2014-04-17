# less-fixed

The less compiler with a few features you absolutely need

[![Build Status](https://travis-ci.org/ForbesLindesay/less-fixed.png?branch=master)](https://travis-ci.org/ForbesLindesay/less-fixed)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/less-fixed.png)](https://gemnasium.com/ForbesLindesay/less-fixed)
[![NPM version](https://badge.fury.io/js/less-fixed.png)](http://badge.fury.io/js/less-fixed)

## Installation

    npm install less-fixed

## render(source, options)

options:

 - `filename: string` - the filename to use for any relative imports.
 - `getURL: function(filename, url)` - a function that takes the filename of a less file and the url of an asset it
 requires and returns the url that should appear in the output (or a promise for the url that should appear in the output).
 This lets you fix the paths to be relative paths or just inline base64 encoded resources.
 - `writeSourceMap: function(sourcemap)` - a function which takes a sourcemap as its only argument.
 - `sourceMapURL: string` - the url of the source map (required if `writeSourceMap` is included).
 - `inlineSourceMap: boolean` - set this to `true` to include the source map in the output.

## renderFile(filename, options)

The same as `compile` except it takes a `filename` instead of the `source` and the `filename` option is set automatically.

## renderFileToDisc(source, destination, options)

Compile a less file (`source`) and put the output in `destination`.  This will also write assets to an assets directory,
write a minified version and write source maps.

options:


## License

  MIT