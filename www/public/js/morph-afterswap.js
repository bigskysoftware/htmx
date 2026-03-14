// After morph navigation: re-init hyperscript and re-execute inline scripts.
// Morph swaps new nodes in-place but doesn't trigger script execution; cloning
// the script elements forces the browser to run them again.
// Back/forward navigation uses history:"reload" so the full page reloads naturally.
//
// We listen on htmx:after:swap and check if the swap target is <body> to
// distinguish page navigation (body morph) from demo-internal swaps
// (e.g. Load More button, form submissions). Only page navigation re-executes
// scripts — demo-internal swaps must not wipe and reinitialize the demo.
(function () {
    document.addEventListener('htmx:after:swap', function (e) {
        if (window._hyperscript) window._hyperscript.processNode(document.body);

        // Only re-execute scripts on page navigation, not demo-internal swaps
        if (e.detail?.ctx?.target !== document.body) return;

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

        // After scripts re-execute (routes are now registered), re-trigger any
        // hx-trigger="load" elements that fired before routes were ready.
        // This handles demo containers that use hx-get/hx-trigger="load" instead
        // of server.start().
        if (window.htmx) {
            var loads = article.querySelectorAll('[hx-trigger*="load"]');
            for (var k = 0; k < loads.length; k++) {
                window.htmx.trigger(loads[k], 'load');
            }
        }
    });
})();
