(() => {
    htmx.defineExtension('legacy-headers', {
        htmx_config_request: (elt, detail) => {
            const {ctx} = detail;
            const headers = ctx.request.headers;
            headers['HX-Trigger'] = elt.id;
            headers['HX-Trigger-Name'] = elt.name;
            headers['HX-Target'] = ctx.target?.id;
        }
    });
})();
