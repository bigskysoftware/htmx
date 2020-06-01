htmx.defineExtension('sse-body', {
    encodeParameters : function(headers, parameters, elt) {
        headers["Content-Type"] = "application/json";
        return elt["htmx-internal-data"].sseEvent.data;
    }
});
