htmx.defineExtension('classify', {
    onEvent: function(name, evt) {
        if (name === 'htmx:configRequest') {
            const el = evt.detail.elt;

            // Find the target element
            const hxTarget = el.getAttribute('hx-target');
            let target = hxTarget === 'this' ? el : (htmx.find(hxTarget) || el);

            // Get and process the hx-class-action attribute
            const classActions = el.getAttribute('hx-classify').split(',').map(s => s.trim());
            classActions.forEach(function(classAction) {
                const [action, classNames, revertTime] = classAction.split(':');
                const classList = classNames.split(' ');
                const originalClasses = target.className;

                switch (action) {
                    case 'add':
                        target.classList.add(...classList);
                        break;
                    case 'remove':
                        target.classList.remove(...classList);
                        break;
                    case 'replace':
                        target.className = classNames;
                        break;
                    case 'toggle':
                        classList.forEach(className => {
                            target.classList.toggle(className);
                        });
                        break;
                }

                // Revert class changes after revertTime, if provided
                if (revertTime) {
                    const revertMilliseconds = htmx.parseInterval(revertTime); // Convert to milliseconds
                    setTimeout(function() {
                        switch (action) {
                            case 'add':
                                target.classList.remove(...classList);
                                break;
                            case 'remove':
                                target.classList.add(...classList);
                                break;
                            case 'replace':
                                target.className = originalClasses;
                                break;
                            case 'toggle':
                                classList.forEach(className => {
                                    target.classList.toggle(className);
                                });
                                break;
                        }
                    }, revertMilliseconds);
                }

            });
            if (el.getAttribute('hx-get') === '/noop-classify') {
                return false
            }
        }
        else if (name === 'htmx:load') {
            let elementsModified = false;
            document.querySelectorAll('[hx-classify]').forEach(function(el) {
                if (!el.hasAttribute('hx-get') && !el.hasAttribute('hx-post') && !el.hasAttribute('hx-put') && !el.hasAttribute('hx-patch') && !el.hasAttribute('hx-delete')) {
                    el.setAttribute('hx-get', '/noop-classify');
                    elementsModified = true;
                }
            });
            if (elementsModified) {
                htmx.process(document.body);
            }
        }
    }
});
