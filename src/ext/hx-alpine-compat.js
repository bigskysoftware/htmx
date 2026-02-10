//==========================================================
// hx-alpine-compat.js
//
// Alpine.js compatibility extension for htmx
// Initializes Alpine on fragments before swap
// and preserves Alpine state during morph operations
//==========================================================
(() => {
    let patched = false;
    let api;
    let deferCount = 0;
    
    function patchAlpine() {
        if (patched || !window.Alpine) return;
        patched = true;
        
        window.Alpine.directive('ref', (el, { expression }, { cleanup }) => {
            let root = window.Alpine.closestRoot(el);
            if (!root) return;
            if (!root._x_refs) root._x_refs = {};
            root._x_refs[expression] = el;
            cleanup(() => delete root._x_refs[expression]);
        });
    }
    
    // Patch Alpine when available
    if (window.Alpine) {
        patchAlpine();
    } else {
        document.addEventListener('alpine:init', patchAlpine);
    }
    
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
                if (!task.fragment || !task.target) continue;
                
                let target = typeof task.target === 'string' 
                    ? document.querySelector(task.target) 
                    : task.target;
                if (!target) continue;
                
                let dataStack = window.Alpine.closestDataStack(target);
                for (let child of task.fragment.children) {
                    child._x_dataStack = dataStack;
                    window.Alpine.cloneNode(target, child);
                }
            }
        },
        
        'htmx_before_morph_node': (elt, detail) => {
            if (!window.Alpine?.closestDataStack || !window.Alpine?.cloneNode) {
                return;
            }
            let {oldNode, newNode} = detail;
            if (oldNode.nodeType !== 1) {
                return;
            }

            newNode._x_dataStack = window.Alpine.closestDataStack(oldNode);
            window.Alpine.cloneNode(oldNode, newNode);
            
            // If both have _x_teleport, morph the teleport target
            if (oldNode._x_teleport && newNode._x_teleport) {
                let fragment = document.createDocumentFragment();
                fragment.append(newNode._x_teleport);
                api.morph(oldNode._x_teleport, fragment, false);
            }
        },
        
        'htmx_finally_request': (elt, detail) => {
            if (deferCount > 0) {
                deferCount--;
                if (deferCount === 0 && window.Alpine?.flushAndStopDeferringMutations) {
                    window.Alpine.flushAndStopDeferringMutations();
                }
            }
        }
    });
})();
