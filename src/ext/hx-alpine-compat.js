//==========================================================
// hx-alpine-compat.js
//
// Alpine.js compatibility extension for htmx
// Initializes Alpine on fragments before swap
// and preserves Alpine state during morph operations
//==========================================================
(() => {
    let api;
    let deferCount = 0;

    htmx.registerExtension('alpine-compat', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        
        htmx_before_swap: (elt, detail) => {
            if (!window.Alpine?.closestDataStack || !window.Alpine?.cloneNode || !window.Alpine?.deferMutations) {
                return;
            }
            if (deferCount === 0) {
                window.Alpine.deferMutations();
            }
            deferCount++;
            
            let {tasks} = detail;
            for (let task of tasks) {
                if (task.swapSpec.style === 'innerMorph' || task.swapSpec.style === 'outerMorph') {
                    if (!task.fragment || !task.target) continue;
                    
                    let target = typeof task.target === 'string' 
                        ? document.querySelector(task.target) 
                        : task.target;
                    if (!target) continue;
                    
                    // Strip Alpine-generated IDs before morph
                    if (task.swapSpec.style === 'outerMorph') {
                        if (target._x_bindings?.id) {
                            target.removeAttribute('id');
                        }
                    }
                    
                    // For both innerMorph and outerMorph, strip generated IDs from descendants
                    target.querySelectorAll('[\\:id], [x-bind\\:id]').forEach(el => {
                        if (el._x_bindings?.id) {
                            el.removeAttribute('id');
                        }
                    });
                }
            }
        },
        
        htmx_before_morph_node: (elt, detail) => {
            if (!window.Alpine?.closestDataStack || !window.Alpine?.cloneNode) {
                return;
            }
            let {oldNode, newNode} = detail;
            
            let oldDataStack = window.Alpine.closestDataStack(oldNode);
            newNode._x_dataStack = oldDataStack;
            
            // skip cloneNode for template children that will have errors as they can not have reactive content 
            if (!oldNode.isConnected) return;
            
            window.Alpine.cloneNode(oldNode, newNode);
            
            // If both have _x_teleport, morph the teleport target
            if (oldNode._x_teleport && newNode._x_teleport) {
                let fragment = document.createDocumentFragment();
                fragment.append(newNode._x_teleport);
                api.morph(oldNode._x_teleport, fragment, false);
            }
        },

        htmx_finally_request: (elt, detail) => {
            if (deferCount > 0) {
                deferCount--;
            }
            if (deferCount === 0 && window.Alpine?.flushAndStopDeferringMutations) {
                window.Alpine.flushAndStopDeferringMutations();
            }
        }
    });
})();
