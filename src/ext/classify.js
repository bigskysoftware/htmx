/**
 * htmx 'classify' Extension:
 * 
 * The `classify` extension enhances htmx's ability to modify CSS class properties of an element
 * based on user-defined directives. It provides support for adding, removing, replacing, and toggling
 * classes, potentially with a specified revert time.
 * 
 * Usage:
 * Include the `hx-classify` attribute on an element and define desired class actions.
 * 
 * Syntax:
 * hx-classify="action:classes:revertTime"
 * 
 * - `action` can be one of ['add', 'remove', 'replace', 'toggle']
 * - `classes` is a space-separated list of class names
 * - `revertTime` is an optional duration after which the action should be reverted.
 * 
 * Example:
 * <div hx-classify="add:newClass:5s"></div>
 * This would add the class `newClass` to the div and remove it after 5 seconds.
 * 
 * Additionally, this extension automatically sets a `/noop-classify` endpoint for any elements
 * with the `hx-classify` attribute but without a specified HTTP verb (like hx-get, hx-post, etc.)
 * ensuring a fallback behavior.
 * 
 * Note: Ensure to use this extension judiciously to prevent unintended behaviors.
 */

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
