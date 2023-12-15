+++
title = "hx-disable"
+++

The `hx-disable` attribute will disable htmx processing for a given element and all its children.  This can be 
useful as a backup for HTML escaping, when you include user generated content in your site, and you want to 
prevent malicious scripting attacks.

The value of the tag is ignored, and it cannot be reversed by any content beneath it.
 
## Notes

* `hx-disable` is inherited.
* When dynamically adding hx-disable to an element from your custom code:
    * If any trigger handler is triggered on an element, it first checks if the element is currently disabled or not. If it is, cleans up the element (which removes all htmx listeners from it) and aborts the handler.
    * You can call `htmx.process` right after adding the attribute, to force the clean up immediately.
* When removing hx-disable from an element from your custom code:
    * You *have* to explicitly call `htmx.process` to have htmx initialize that element and bind handlers again

