htmx.defineExtension('alpine-morph', {
    isInlineSwap: function (swapStyle) {
        return swapStyle === 'morph';
    },
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morph') {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                Alpine.morph(target, fragment.firstElementChild);
                return [target];
            } else {
                Alpine.morph(target, fragment.outerHTML);
                return [target];
            }
        }
    }
});