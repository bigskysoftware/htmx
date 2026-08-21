(() =>{

    function normalizeSwapStyle(style) {
        return style === 'before' ? 'beforebegin' :
            style === 'after' ? 'afterend' :
                style === 'prepend' ? 'afterbegin' :
                    style === 'append' ? 'beforeend' : style;
    }

    let api;

    function insertPendingContent(ctx) {
        ctx.pending = api.attributeValue(ctx.sourceElement, "hx-pending");
        if (!ctx.pending) {
            return
        }

        let sourceElt = document.querySelector(ctx.pending);
        if (!sourceElt) return;

        let target = ctx.target;

        if (typeof target === 'string') {
            target = document.querySelector(target);
        }
        if (!target) return;

        // Create pending div with reset styling
        let pendingDiv = document.createElement('div');
        pendingDiv.style.cssText = 'all: initial';
        pendingDiv.classList.add('hx-pending');
        let sourceNodes = sourceElt instanceof HTMLTemplateElement ? sourceElt.content.childNodes : sourceElt.childNodes;
        for (let child of sourceNodes) pendingDiv.appendChild(child.cloneNode(true));

        // Set data-* for each request param
        if (ctx.pendingBody) {
            let keys = new Set(ctx.pendingBody.keys());
            for (let k of keys) {
                let values = ctx.pendingBody.getAll(k).filter(v => typeof v === 'string');
                if (!values.length) continue;
                let val = values.length === 1 ? values[0] : JSON.stringify(values);
                try {
                    pendingDiv.dataset[k] = val;
                } catch (e) {
                    try {
                        pendingDiv.setAttribute('data-' + k, val);
                    } catch (e2) { /* truly invalid name, skip */ }
                }
            }
        }

        let swapStyle = normalizeSwapStyle(ctx.swap);
        ctx.pendingHidden = [];

        if (swapStyle === 'innerHTML') {
            // Hide children of target
            for (let child of target.children) {
                child.style.display = 'none';
                ctx.pendingHidden.push(child);
            }
            target.appendChild(pendingDiv);
        } else if (['beforebegin', 'afterbegin', 'beforeend', 'afterend'].includes(swapStyle)) {
            target.insertAdjacentElement(swapStyle, pendingDiv);
        } else {
            // Assume outerHTML-like behavior, Hide target and insert div after it
            target.style.display = 'none';
            ctx.pendingHidden.push(target);
            target.after(pendingDiv);
        }
        ctx.pendingDiv = pendingDiv;
        htmx.process(pendingDiv);
    }

    function removePendingContent(ctx) {
        if (!ctx.pendingDiv) return;

        // Remove pending div
        ctx.pendingDiv.remove();

        // Unhide any hidden elements
        for (let elt of ctx.pendingHidden) {
            elt.style.display = '';
        }
    }

    htmx.registerExtension('hx-pending', {
        init: (internalAPI) => { api = internalAPI; },
        htmx_config_request: (elt, detail) => {
            let body = detail.ctx.request.body;
            if (body?.entries) detail.ctx.pendingBody = body;
        },
        htmx_before_request: (elt, detail) => {
            insertPendingContent(detail.ctx);
        },
        htmx_error : (elt, detail) => {
            removePendingContent(detail.ctx)
        },
        htmx_before_swap : (elt, detail) => {
            removePendingContent(detail.ctx)
        }
    });
})();
