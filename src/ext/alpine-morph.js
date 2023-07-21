htmx.registerExtension('alpine-morph', (features) => {
    features.addSwap('alpine-morph', {
        isInlineSwap: true,
        handleSwap: (target, fragment) => {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                Alpine.morph(target, fragment.firstElementChild);
                return { newElements: [target] };
            } else {
                Alpine.morph(target, fragment.outerHTML);
                return { newElements: [target] };
            }
        },
    })
})
