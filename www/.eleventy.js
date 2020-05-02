const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(config) {
    config.addPlugin(pluginSyntaxHighlight);
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("_");
}