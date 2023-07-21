htmx.registerExtension('morphdom-swap', (features) => {
    features.addSwap('morphdom', {
        isInlineSwap: true,
        handleSwap: (target, fragment) => {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                morphdom(target, fragment.firstElementChild);
                return {newElements: [target]};
            } else {
                morphdom(target, fragment.outerHTML);
                return {newElements: [target]};
            }
        },
    })
})
