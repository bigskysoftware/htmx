var config = require('../package.json');
var fs = require('fs-extra');

console.log(config.version)

var testRoot = "www/static/test/";
var currentReleaseRoot = testRoot + config.version;
fs.ensureDirSync(currentReleaseRoot);

// copy over all test support files
fs.copySync("node_modules/mocha/mocha.js", currentReleaseRoot + "/node_modules/mocha/mocha.js");
fs.copySync("node_modules/mocha/mocha.css", currentReleaseRoot + "/node_modules/mocha/mocha.css");
fs.copySync("node_modules/chai/chai.js", currentReleaseRoot + "/node_modules/chai/chai.js");
fs.copySync("node_modules/chai-dom/chai-dom.js", currentReleaseRoot + "/node_modules/chai-dom/chai-dom.js");
fs.copySync("node_modules/sinon/pkg/sinon.js", currentReleaseRoot + "/node_modules/sinon/pkg/sinon.js");
fs.copySync("node_modules/mock-socket/dist/mock-socket.js", currentReleaseRoot + "/node_modules/mock-socket/dist/mock-socket.js");
fs.copySync("test/", currentReleaseRoot + "/test");
fs.copySync("src/", currentReleaseRoot + "/src");

// update the test index file to include a link for all releases
var testHTML = "<html><body style='font-family: sans-serif'><h1>HTMX TESTS</h1><ul>\n"
fs.readdirSync(testRoot).reverse().forEach(function (file) {
        if (file !== "index.html") {
                testHTML += "<li><a href='/test/" + file + "/test'>" + file + "</a>\n";
        }
});
testHTML += "</ul></body>"
fs.writeFileSync(testRoot + "/index.html", testHTML);

// copy the current htmx to the main website
fs.copySync("src/htmx.js", "www/themes/htmx-theme/static/js/htmx.js");
fs.copySync("src/ext/class-tools.js", "www/themes/htmx-theme/static/js/class-tools.js");
fs.copySync("src/ext/preload.js", "www/themes/htmx-theme/static/js/preload.js");
