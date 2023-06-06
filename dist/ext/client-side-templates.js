(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['htmx.org'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('htmx.org'));
    } else {
        // Browser globals (root is window)
        factory(root.htmx);
    }
}(typeof self !== 'undefined' ? self : this, function (htmx) {

htmx.defineExtension('client-side-templates', {
    transformResponse : function(text, xhr, elt) {

        var mustacheTemplate = htmx.closest(elt, "[mustache-template]");
        if (mustacheTemplate) {
            var data = JSON.parse(text);
            var templateId = mustacheTemplate.getAttribute('mustache-template');
            var template = htmx.find("#" + templateId);
            if (template) {
                return Mustache.render(template.innerHTML, data);
            } else {
                throw "Unknown mustache template: " + templateId;
            }
        }

        var handlebarsTemplate = htmx.closest(elt, "[handlebars-template]");
        if (handlebarsTemplate) {
            var data = JSON.parse(text);
            var templateName = handlebarsTemplate.getAttribute('handlebars-template');
            return Handlebars.partials[templateName](data);
        }

        var nunjucksTemplate = htmx.closest(elt, "[nunjucks-template]");
        if (nunjucksTemplate) {
            var data = JSON.parse(text);
            var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
            var template = htmx.find('#' + templateName);
            if (template) {
                return nunjucks.renderString(template.innerHTML, data);
            } else {
                return nunjucks.render(templateName, data);
            }
          }

        return text;
    }
});

return htmx;

}));
