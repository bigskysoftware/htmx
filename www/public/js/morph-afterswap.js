// After morph navigation: re-init hyperscript and re-execute inline scripts.
// Morph swaps new nodes in-place but doesn't trigger script execution; cloning
// the script elements forces the browser to run them again.
// Back/forward navigation uses history:"reload" so the full page reloads naturally.
//
// We listen on htmx:after:history:push instead of htmx:after:swap because
// it only fires on actual page navigation (URL pushed to history). This naturally
// excludes demo-internal swaps (e.g. Load More button) and same-page clicks.
(function () {
    document.addEventListener('htmx:after:history:push', function () {
        if (window._hyperscript) window._hyperscript.processNode(document.body);

        var article = document.querySelector('article');
        if (!article) return;
        var scripts = article.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
            var old = scripts[i];
            var fresh = document.createElement('script');
            for (var j = 0; j < old.attributes.length; j++)
                fresh.setAttribute(old.attributes[j].name, old.attributes[j].value);
            // Wrap in block scope so const/let re-declarations don't throw
            fresh.textContent = '{' + old.textContent + '}';
            old.replaceWith(fresh);
        }
    });
})();
