htmx.defineExtension('restored', {
    onEvent : function(name, evt) {
        if (name === 'htmx:restored'){
            var restoredElts = evt.detail.document.querySelectorAll(
                "[hx-trigger='restored'],[data-hx-trigger='restored']"
            );
            // need a better way to do this, would prefer to just trigger from evt.detail.elt
            var foundElt = Array.from(restoredElts).find(
                (x) => (x.outerHTML === evt.detail.elt.outerHTML)
            );
            var restoredEvent = evt.detail.triggerEvent(foundElt, 'restored');
        }
        return;
    }
})