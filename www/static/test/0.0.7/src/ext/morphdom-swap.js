htmx.defineExtension('morphdom-swap', {
    isInlineSwap: function(swapStyle) {
        return swapStyle === 'morphdom';
    },
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morphdom') {
            morphdom(target, fragment.outerHTML);
            return [target]; // let htmx handle the new content
        }
    }
});
