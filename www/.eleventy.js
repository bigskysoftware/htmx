const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginSass = require("eleventy-plugin-sass");

module.exports = function(config) {
    config.addPlugin(pluginSyntaxHighlight);
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("_");
    config.addPlugin(pluginSass, {});
}
