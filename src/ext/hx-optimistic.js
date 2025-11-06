(() =>{

    // TODO - this needs to be updated to use the new internal API

    function normalizeSwapStyle(style) {
        return style === 'before' ? 'beforebegin' :
            style === 'after' ? 'afterend' :
                style === 'prepend' ? 'afterbegin' :
                    style === 'append' ? 'beforeend' : style;
    }

    function insertOptimisticContent(ctx) {
        // TODO - handle htmx.config.prefix
        ctx.optimistic = ctx.sourceElement.getAttribute("hx-optimistic");
        if (!ctx.optimistic) {
            return
        }

        // TODO - handle inheritance?
        let sourceElt = document.querySelector(ctx.optimistic);
        if (!sourceElt) return;

        let target = ctx.target;
        if (!target) return;

        if (typeof target === 'string') {
            target = document.querySelector(target);
        }

        // Create optimistic div with reset styling
        let optimisticDiv = document.createElement('div');
        optimisticDiv.style.cssText = 'all: initial';
        optimisticDiv.innerHTML = sourceElt.innerHTML;

        let swapStyle = normalizeSwapStyle(ctx.swap);
        ctx.optHidden = [];

        if (swapStyle === 'innerHTML') {
            // Hide children of target
            for (let child of target.children) {
                child.style.display = 'none';
                ctx.optHidden.push(child)
            }
            target.appendChild(optimisticDiv);
            ctx.optimisticDiv = optimisticDiv;
        } else if (['beforebegin', 'afterbegin', 'beforeend', 'afterend'].includes(swapStyle)) {
            target.insertAdjacentElement(swapStyle, optimisticDiv);
            ctx.optimisticDiv = optimisticDiv;
        } else {
            // Assume outerHTML-like behavior, Hide target and insert div after it
            target.style.display = 'none';
            ctx.optHidden.push(target)
            target.after(optimisticDiv)
            ctx.optimisticDiv = optimisticDiv;
        }
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

    htmx.defineExtension('hx-optimistic', {
        htmx_before_request : (elt, detail) => {
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