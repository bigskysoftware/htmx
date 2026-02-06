//==========================================================
// hx-alpine-compat.js
//
// Alpine.js compatibility extension for htmx
// Removes Alpine directives during CSS transitions
// so Alpine can process elements fresh after swap
//==========================================================
(() => {
    htmx.registerExtension('alpine-compat', {
        htmx_transition_task: (elt, detail) => {
            // Remove Alpine directives so Alpine processes them fresh after swap
            [...elt.attributes].forEach(attr => {
                if (/^(x-|[@:])/.test(attr.name)) {
                    elt.removeAttribute(attr.name);
                }
            });
        }
    });
})();
