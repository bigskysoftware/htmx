(function(){
    htmx.defineExtension('head-support', {
        onEvent: function (name, evt) {
            if (name === "htmx:afterResponseParse") {
                // do the fancy stuff here...
                var responseDoc = evt.detail.responseDoc;
                var settleInfo = evt.detail.settleInfo;
                // settleInfo contains call backs that will be invoked after the settle phase of content
                // swapping
            }
        }
    });
})();
