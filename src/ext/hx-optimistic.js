(() =>{

    function normalizeSwapStyle(style) {
        return style === 'before' ? 'beforebegin' :
            style === 'after' ? 'afterend' :
                style === 'prepend' ? 'afterbegin' :
                    style === 'append' ? 'beforeend' : style;
    }

    let api;

    function insertOptimisticContent(ctx) {
        ctx.optimistic = api.attributeValue(ctx.sourceElement, "hx-optimistic");
        if (!ctx.optimistic) {
            return
        }

        let sourceElt = document.querySelector(ctx.optimistic);
        if (!sourceElt) return;

        let target = ctx.target;

        if (typeof target === 'string') {
            target = document.querySelector(target);
        }
        if (!target) return;

        // Create optimistic div with reset styling
        let optimisticDiv = document.createElement('div');
        optimisticDiv.style.cssText = 'all: initial';
        optimisticDiv.classList.add('hx-optimistic');
        optimisticDiv.innerHTML = sourceElt.innerHTML;

        // Set data-* for each request param
        if (ctx.optimisticBody) {
            let keys = new Set(ctx.optimisticBody.keys());
            for (let k of keys) {
                let values = ctx.optimisticBody.getAll(k).filter(v => typeof v === 'string');
                if (!values.length) continue;
                let val = values.length === 1 ? values[0] : JSON.stringify(values);
                try {
                    optimisticDiv.dataset[k] = val;
                } catch (e) {
                    try {
                        optimisticDiv.setAttribute('data-' + k, val);
                    } catch (e2) { /* truly invalid name, skip */ }
                }
            }
        }

        let swapStyle = normalizeSwapStyle(ctx.swap);
        ctx.optHidden = [];

        if (swapStyle === 'innerHTML') {
            // Hide children of target
            for (let child of target.children) {
                child.style.display = 'none';
                ctx.optHidden.push(child);
            }
            target.appendChild(optimisticDiv);
        } else if (['beforebegin', 'afterbegin', 'beforeend', 'afterend'].includes(swapStyle)) {
            target.insertAdjacentElement(swapStyle, optimisticDiv);
        } else {
            // Assume outerHTML-like behavior, Hide target and insert div after it
            target.style.display = 'none';
            ctx.optHidden.push(target);
            target.after(optimisticDiv);
        }
        ctx.optimisticDiv = optimisticDiv;
        htmx.process(optimisticDiv);
    }

    function removeOptimisticContent(ctx) {
        if (!ctx.optimisticDiv) return;

        // Remove optimistic div
        ctx.optimisticDiv.remove();

        // Unhide any hidden elements
        for (let elt of ctx.optHidden) {
            elt.style.display = '';
        }
    }

    htmx.registerExtension('hx-optimistic', {
        init: (internalAPI) => { api = internalAPI; },
        htmx_config_request: (elt, detail) => {
            let body = detail.ctx.request.body;
            if (body?.entries) detail.ctx.optimisticBody = body;
        },
        htmx_before_request: (elt, detail) => {
            insertOptimisticContent(detail.ctx);
        },
        htmx_error : (elt, detail) => {
            removeOptimisticContent(detail.ctx)
        },
        htmx_before_swap : (elt, detail) => {
            removeOptimisticContent(detail.ctx)
        }
    });
})();