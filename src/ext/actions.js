(function () {
  function processAction(elt, action) {}

  function maybeProcessActions(elt) {
    if (elt.getAttribute) {
      var action =
        elt.getAttribute("hx-action") || elt.getAttribute("data-hx-action");
      var triggers =
        elt.getAttribute("hx-trigger") || elt.getAttribute("data-hx-trigger");
      if (action && triggers) {
        var triggerSpecs = htmx.getTriggerSpecs(elt);
        var nodeData = htmx.getInternalData(elt);
        var triggerAction = function(evt){
          eval(action);
        }
        htmx.addEventListenerFn(elt, triggerAction, nodeData, triggerSpecs[0], false)
      }
    }
  }

  htmx.defineExtension("actions", {
    onEvent: function (name, evt) {
      if (name === "htmx:afterProcessNode") {
        var elt = evt.detail.elt;
        maybeProcessActions(elt);
        if (elt.querySelectorAll) {
          var children = elt.querySelectorAll("[hx-action], [data-hx-action]");
          for (var i = 0; i < children.length; i++) {
            maybeProcessActions(children[i]);
          }
        }
      }
    },
  });
})();
