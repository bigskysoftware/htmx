// After morph navigation: re-init hyperscript.
(function () {
    document.addEventListener('htmx:before:swap', function (e) {
        if (e.detail?.ctx?.target !== document.body) return;
        // Invalidate any pending server.start() promise from the previous page
        window._demoGeneration = (window._demoGeneration || 0) + 1;
        // Clear routes so old handlers can't respond to new page's requests
        if (window.server) window.server.reset?.();
    });

    document.addEventListener('htmx:after:swap', function (e) {
        if (e.detail?.ctx?.target !== document.body) return;
        if (window._hyperscript) window._hyperscript.processNode(document.body);
    });
})();
