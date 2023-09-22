htmx.defineExtension('path-vars', {
    onEvent: function (name, evt) {
        if (name === "htmx:configRequest") {
            let sourceEventData = evt.detail ? (evt.detail.triggeringEvent ? evt.detail.triggeringEvent.detail : null) : null;
            if (sourceEventData) {
                evt.detail.path = evt.detail.path.replace(/{event\.(\w+)}/g, function (_, k) {
                    return sourceEventData[k];
                });
            }
        }
    }
});
