//==========================================================
// hx-alpine-compat.js
//
// Alpine.js compatibility extension for htmx
// Initializes Alpine on fragments before swap
// so Alpine state is applied before CSS transitions
//==========================================================
(() => {
    htmx.registerExtension('alpine-compat', {
        htmx_before_swap: (elt, detail) => {
            if (!window.Alpine?.closestDataStack || !window.Alpine?.initTree) return;
            
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
                    window.Alpine.initTree(child);
                }
            }
        }
    });
})();
