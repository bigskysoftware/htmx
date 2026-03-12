//==========================================================
// hx-targets.js
//
// An extension that adds an 'hx-targets' attribute to target
// multiple elements with the same swap content.
//
// Usage:
//   <button hx-get="/api" hx-targets=".card">Click</button>
//
// The response will be swapped into all elements matching
// the selector. The hx-targets attribute is inherited.
//==========================================================
(() => {
    let api;

    htmx.registerExtension('hx-targets', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_before_swap: (elt, detail) => {
            let {ctx, tasks} = detail;
            let selector = api.attributeValue(ctx.sourceElement, 'hx-targets');
            if (!selector) return;

            let targets = htmx.findAll(ctx.sourceElement, selector);
            if (!targets.length) {
                console.warn(`htmx: '${selector}' on hx-targets did not match any elements`);
                return;
            }

            // Replace main task with one task per target
            let mainIndex = tasks.findIndex(t => t.type === 'main');
            if (mainIndex === -1) return;

            let mainTask = tasks[mainIndex];
            let newTasks = Array.from(targets).map(target => ({
                ...mainTask,
                fragment: mainTask.fragment.cloneNode(true),
                target
            }));

            tasks.splice(mainIndex, 1, ...newTasks);
        }
    });
})();