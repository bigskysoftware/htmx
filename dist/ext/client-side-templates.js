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

        var mustacheArrayTemplate = htmx.closest(elt, "[mustache-array-template]");
        if (mustacheArrayTemplate) {
            var data = JSON.parse(text);
            var templateId = mustacheArrayTemplate.getAttribute('mustache-array-template');
            var template = htmx.find("#" + templateId);
            if (template) {
                return Mustache.render(template.innerHTML, {"data": data });
            } else {
                throw "Unknown mustache template: " + templateId;
            }
        }

        var handlebarsTemplate = htmx.closest(elt, "[handlebars-template]");
        if (handlebarsTemplate) {
            var data = JSON.parse(text);
            var templateId = handlebarsTemplate.getAttribute('handlebars-template');
            var templateElement = htmx.find('#' + templateId).innerHTML;
            var renderTemplate = Handlebars.compile(templateElement);
            if (renderTemplate) {
                return renderTemplate(data);
            } else {
                throw "Unknown handlebars template: " + templateId;
            }
        }

        var handlebarsArrayTemplate = htmx.closest(elt, "[handlebars-array-template]");
        if (handlebarsArrayTemplate) {
            var data = JSON.parse(text);
            var templateId = handlebarsArrayTemplate.getAttribute('handlebars-array-template');
            var templateElement = htmx.find('#' + templateId).innerHTML;
            var renderTemplate = Handlebars.compile(templateElement);
            if (renderTemplate) {
                return renderTemplate(data);
            } else {
                throw "Unknown handlebars template: " + templateId;
            }
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

        var xsltTemplate = htmx.closest(elt, "[xslt-template]");
        if (xsltTemplate) {
            var templateId = xsltTemplate.getAttribute('xslt-template');
            var template = htmx.find("#" + templateId);
            if (template) {
              var content = template.innerHTML ? new DOMParser().parseFromString(template.innerHTML, 'application/xml')
                                               : template.contentDocument;
              var processor = new XSLTProcessor();
              processor.importStylesheet(content);
              var data = new DOMParser().parseFromString(text, "application/xml");
              var frag = processor.transformToFragment(data, document);
              return new XMLSerializer().serializeToString(frag);
            } else {
              throw "Unknown XSLT template: " + templateId;
            }
        }

          var nunjucksArrayTemplate = htmx.closest(elt, "[nunjucks-array-template]");
          if (nunjucksArrayTemplate) {
              var data = JSON.parse(text);
              var templateName = nunjucksArrayTemplate.getAttribute('nunjucks-array-template');
              var template = htmx.find('#' + templateName);
              if (template) {
                  return nunjucks.renderString(template.innerHTML, {"data": data});
              } else {
                  return nunjucks.render(templateName, {"data": data});
              }
            }
        return text;
    }
});
