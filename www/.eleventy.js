const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSass = require("eleventy-plugin-sass");

module.exports = function(config) {
    config.addPassthroughCopy("js");
    config.addPassthroughCopy("css");
    config.addPassthroughCopy("img");
    config.addPassthroughCopy("test");
    config.addPassthroughCopy("_redirects");
    config.addPlugin(pluginRss);
    config.addPlugin(pluginSass, {});
}
