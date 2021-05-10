const pluginSass = require("eleventy-plugin-sass");
const pluginRss = require("@11ty/eleventy-plugin-rss");

module.exports = function(config) {
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("test");
    config.addPassthroughCopy("_redirects");
    config.addPlugin(pluginSass, {});
    config.addPlugin(pluginRss);
}
