(() => {
    htmx.defineExtension('request-context', {
        htmx_config_request: (elt, detail) => {
            const {ctx} = detail;

            ctx.request.headers['HX-Context'] = JSON.stringify({
                source: {
                    id: elt.id,
                    name: elt.name,
                    tag: elt.tagName?.toLowerCase()
                },
                target: {
                    id: ctx.target?.id,
                    tag: ctx.target?.tagName?.toLowerCase()
                },
                event: {
                    type: ctx.sourceEvent?.type,
                    key: ctx.sourceEvent?.key,
                    altKey: ctx.sourceEvent?.altKey,
                    ctrlKey: ctx.sourceEvent?.ctrlKey,
                    metaKey: ctx.sourceEvent?.metaKey,
                    shiftKey: ctx.sourceEvent?.shiftKey
                },
                select: ctx.select,
                selectOOB: ctx.selectOOB,
                swap: ctx.swap,
                push: ctx.push,
                replace: ctx.replace
            });
        }
    });
})();
