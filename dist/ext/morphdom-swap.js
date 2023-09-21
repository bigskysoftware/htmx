htmx.defineExtension('morphdom-swap', {
    isInlineSwap: function(swapStyle) {
        return swapStyle === 'morphdom';
    },
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morphdom') {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                // IE11 doesn't support DocumentFragment.firstElementChild
                morphdom(target, fragment.firstElementChild || fragment.firstChild);
                return [target];
            } else {
                morphdom(target, fragment.outerHTML);
                return [target];
            }
        }
    }
});
