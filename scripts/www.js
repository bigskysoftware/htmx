var config = require('../package.json');
var fs = require('fs-extra');

console.log(config.version)

var testRoot = "www/test/" + config.version;
fs.ensureDirSync(testRoot);
fs.copySync("node_modules/mocha/mocha.js", testRoot + "/node_modules/mocha/mocha.js");
fs.copySync("node_modules/mocha/mocha.css", testRoot + "/node_modules/mocha/mocha.css");
fs.copySync("node_modules/chai/chai.js", testRoot + "/node_modules/chai/chai.js");
fs.copySync("node_modules/sinon/pkg/sinon.js", testRoot + "/node_modules/sinon/pkg/sinon.js");
fs.copySync("test/", testRoot + "/test");
fs.copySync("src/", testRoot + "/src");
fs.copySync("src/htmx.js", "www/js/htmx.js");