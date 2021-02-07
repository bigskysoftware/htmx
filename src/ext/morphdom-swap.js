htmx.defineExtension('morphdom-swap', {
    isInlineSwap: function(swapStyle) {
        return swapStyle === 'morphdom';
    },
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morphdom') {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                morphdom(target, fragment.firstElementChild);
                return [target];
            } else {
                morphdom(target, fragment.outerHTML);
                return [target];
            }
        }
    }
});
