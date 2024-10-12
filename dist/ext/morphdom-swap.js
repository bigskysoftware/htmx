if (htmx.version && !htmx.version.startsWith("1.")) {
    console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
        ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
}
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
