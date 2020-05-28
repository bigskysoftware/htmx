htmx.defineExtension('client-side-templates', {
    transformResponse : function(text, xhr, elt) {
        var data = JSON.parse(text);

        var mustacheTemplate = htmx.closest(elt, "[mustache-template]");
        if (mustacheTemplate) {
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
            var templateName = handlebarsTemplate.getAttribute('handlebars-template');
            return Handlebars.partials[templateName](data);
        }

        var nunjucksTemplate = htmx.closest(elt, "[nunjucks-template]");
        if (nunjucksTemplate) {
            var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
            var template = htmx.find('#' + templateName);
            try {
              return nunjucks.render(templateName, data);
            } catch (e) {
              return nunjucks.renderString(template.innerHTML, data);
            }
        }

        return text;
    }
});
