htmx.defineExtension('morphdom-swap', {
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morphdom') {
            morphdom(target, fragment.outerHTML);
            return true;
        }
    }
});
