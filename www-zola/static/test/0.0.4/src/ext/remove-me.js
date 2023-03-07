(function(){
    htmx.defineExtension('remove-me', {
        onEvent: function (name, evt) {
            if (name === "processedNode.htmx") {
                var elt = evt.detail.elt;
                if (elt.getAttribute) {
                    var timing = elt.getAttribute("remove-me") || elt.getAttribute("data-remove-me");
                    if (timing) {
                        setTimeout(function () {
                            elt.parentElement.removeChild(elt);
                        }, htmx.parseInterval(timing));
                    }
                }
            }
        }
    });
})();
