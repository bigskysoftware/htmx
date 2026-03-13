// TODO: There is definitely a cleaner way to do this.
//
// After morph navigation: re-init hyperscript and re-execute inline scripts.
// Morph swaps new nodes in-place but doesn't trigger script execution; cloning
// the script elements forces the browser to run them again.
// Back/forward navigation uses history:"reload" so the full page reloads naturally.
(function () {
    var lastSwapUrl = location.href;
    document.addEventListener('htmx:after:swap', function (e) {
        if (window._hyperscript) window._hyperscript.processNode(document.body);

        // Re-execute scripts in the article (pattern demos, etc.)
        // Only on page navigation (URL changed), not on demo-internal swaps.
        // We track URL instead of checking e.target because morph can disconnect
        // the source element, causing htmx to fall back to e.target === document.
        if (e.target.closest?.('[data-demo-container]')) return;
        if (location.href === lastSwapUrl) return;
        lastSwapUrl = location.href;
        var article = document.querySelector('article');
        if (!article || !article.querySelector('script')) return;
        var scripts = article.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
            var old = scripts[i];
            var fresh = document.createElement('script');
            for (var j = 0; j < old.attributes.length; j++)
                fresh.setAttribute(old.attributes[j].name, old.attributes[j].value);
            // Wrap in block scope so const/let re-declarations don't throw
            // (top-level const/let share the global lexical scope across scripts)
            fresh.textContent = '{' + old.textContent + '}';
            old.replaceWith(fresh);
        }
    });
})();
