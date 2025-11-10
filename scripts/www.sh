#!/bin/bash
STATIC_ROOT="www/static"
PACKAGE_VERSION=$(cat package.json | grep version | cut -d '"' -f 4)

cp node_modules/mocha/mocha.js "$STATIC_ROOT/node_modules/mocha/mocha.js"
cp node_modules/mocha/mocha.css "$STATIC_ROOT/node_modules/mocha/mocha.css"
cp node_modules/chai/chai.js "$STATIC_ROOT/node_modules/chai/chai.js"

rm -rf "$STATIC_ROOT/test" "$STATIC_ROOT/src"
cp -r "./test" "$STATIC_ROOT/test"
cp -r ./dist/* "$STATIC_ROOT/js"