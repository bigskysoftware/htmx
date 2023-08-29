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
            var el = evt.detail.elt;

            // Find the target element
            var hxTarget = el.getAttribute('hx-target');
            var target = hxTarget === 'this' ? el : (htmx.find(hxTarget) || el);

            // Get and process the hx-class-action attribute
            var classActions = el.getAttribute('hx-classify').split(',').map(function(s) { return s.trim(); });
            for (var i = 0; i < classActions.length; i++) {
                var classAction = classActions[i];
                var parts = classAction.split(':');
                var action = parts[0];
                var classNames = parts[1];
                var revertTime = parts[2];
                var classList = classNames.split(' ');
                var originalClasses = target.className;

                switch (action) {
                    case 'add':
                        for (var j = 0; j < classList.length; j++) {
                            target.classList.add(classList[j]);
                        }
                        break;
                    case 'remove':
                        for (var j = 0; j < classList.length; j++) {
                            target.classList.remove(classList[j]);
                        }
                        break;
                    case 'replace':
                        target.className = classNames;
                        break;
                    case 'toggle':
                        for (var j = 0; j < classList.length; j++) {
                            target.classList.toggle(classList[j]);
                        }
                        break;
                }

                // Revert class changes after revertTime, if provided
                if (revertTime) {
                    var revertMilliseconds = htmx.parseInterval(revertTime); // Convert to milliseconds
                    setTimeout(function() {
                        switch (action) {
                            case 'add':
                                for (var j = 0; j < classList.length; j++) {
                                    target.classList.remove(classList[j]);
                                }
                                break;
                            case 'remove':
                                for (var j = 0; j < classList.length; j++) {
                                    target.classList.add(classList[j]);
                                }
                                break;
                            case 'replace':
                                target.className = originalClasses;
                                break;
                            case 'toggle':
                                for (var j = 0; j < classList.length; j++) {
                                    target.classList.toggle(classList[j]);
                                }
                                break;
                        }
                    }, revertMilliseconds);
                }
            }
            if (el.getAttribute('hx-get') === '/noop-classify') {
                return false;
            }
        }
        else if (name === 'htmx:load') {
            var elementsModified = false;
            var elements = document.querySelectorAll('[hx-classify]');
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                if (!el.hasAttribute('hx-get') && !el.hasAttribute('hx-post') && !el.hasAttribute('hx-put') && !el.hasAttribute('hx-patch') && !el.hasAttribute('hx-delete')) {
                    el.setAttribute('hx-get', '/noop-classify');
                    elementsModified = true;
                }
            }
            if (elementsModified) {
                htmx.process(document.body);
            }
        }
    }
});
