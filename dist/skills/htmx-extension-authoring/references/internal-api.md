# Internal API

## Internal API

The `init` hook receives an internal API object. Store it in a closure variable:

```javascript
let api;
init: (internalAPI) => { api = internalAPI; },
```

**Available API:**

<!-- check_extension_api:start -->
| Property | Description |
|----------|-------------|
| `api.HCON` | Parse and merge HCON values |
| `api.attributeValue(elt, name, defaultVal, returnElt)` | Get an attribute value with inheritance support |
| `api.parseTriggerSpecs(spec)` | Parse a trigger specification |
| `api.determineMethodAndAction(elt, evt)` | Get `{method, action}` for an element |
| `api.createRequestContext(elt, evt)` | Create a request context |
| `api.collectFormData(elt, form, submitter, validate, isGet)` | Collect form data |
| `api.getAttributeObject(elt, name, callback, scope)` | Read an object-valued attribute |
| `api.insertContent(task, cssTransition)` | Insert a swap task's content |
| `api.morph(oldNode, fragment, innerHTML)` | Morph existing content |
| `api.isSoftMatch(oldNode, newNode)` | Test whether two nodes can be morphed |
| `api.initSecurity(ttPolicy, syncFn, asyncFn)` | Configure Trusted Types and script constructors |
| `api.onTrigger(elt, spec, handler)` | Attach a parsed trigger handler |
| `api.htmxProp(elt)` | Get an element's internal htmx state |
| `api.triggerHtmxEvent(elt, name, detail, bubbles)` | Dispatch an htmx event |
| `api.executeJavaScript(thisArg, values, code, expression, isAsync)` | Execute JavaScript through htmx security policy |
<!-- check_extension_api:end -->
