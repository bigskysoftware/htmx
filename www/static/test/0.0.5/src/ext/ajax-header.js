htmx.defineExtension('ajax-header', {
    onEvent: function (name, evt) {
        if (name === "configRequest.htmx") {
            evt.detail.headers['X-Requested-With'] = 'XMLHttpRequest';
        }
    }
});