+++
title = "Extensions"
insert_anchor_links = "left"
+++

Htmx provides an extension mechanism for defining and using extensions within htmx-based applications.

## Using Extensions {#using}

Using an extension involves two steps:

 * include the extension definition, which will add it to the `htmx` extension registry
 * reference the extension via the [hx-ext](@/attributes/hx-ext.md) attribute

Here is an example

```html
  <script src="/path/to/ext/debug.js" defer></script>
  <button hx-post="/example" hx-ext="debug">This Button Uses The Debug Extension</button>
```

This loads the debug extension off of the `unpkg` CDN and then adds the debug extension to the given button.  (This
will print out extensive logging for the button, for debugging purposes.)

Note that the `hx-ext` tag may be placed on parent elements if you want a plugin to apply to an entire part of the DOM,
and on the `body` tag for it to apply to all htmx requests.

**Tip:** To use multiple extensions on one element, separate them with a comma:

```html
  <button hx-post="/example" hx-ext="debug, json-enc">This Button Uses Two Extensions</button>
```

## Ignoring Extensions {#ignoring}

By default, extensions are applied to the DOM node where it is invoked, along with all child elements inside of that parent node.
If you need to disable an extension somewhere within the DOM tree, you can use the `ignore:` keyword to stop it from being used.

```html
<div hx-ext="debug">
  <button hx-post="/example">This button used the debug extension</button>
  <button hx-post="/example" hx-ext="ignore:debug">This button does not</button>
</div>
```

## Included Extensions {#included}

htmx includes a set of extensions out of the box that address common developer needs.  These extensions are tested
against `htmx` in each distribution.

### Installing Extensions {#installing}

You can find the source for the bundled extensions at `https://unpkg.com/browse/htmx.org@1.9.12/dist/ext/`.  You will need
to include the javascript file for the extension and then install it using the [hx-ext](@/attributes/hx-ext.md) attributes.

See the individual extension documentation for more details.

### Included Extensions List {#reference}

<div class="info-table">

| Extension                                                        | Description
|------------------------------------------------------------------|-------------
| [`ajax-header`](@/extensions/ajax-header.md)                     | includes the commonly-used `X-Requested-With` header that identifies ajax requests in many backend frameworks
| [`alpine-morph`](@/extensions/alpine-morph.md)                   | an extension for using the [Alpine.js morph](https://alpinejs.dev/plugins/morph) plugin as the swapping mechanism in htmx.
| [`class-tools`](@/extensions/class-tools.md)                     | an extension for manipulating timed addition and removal of classes on HTML elements
| [`client-side-templates`](@/extensions/client-side-templates.md) | support for client side template processing of JSON/XML responses
| [`debug`](@/extensions/debug.md)                                 | an extension for debugging of a particular element using htmx
| [`event-header`](@/extensions/event-header.md)                   | includes a JSON serialized version of the triggering event, if any
| [`head-support`](@/extensions/head-support.md)                   | support for merging the `head` tag from responses into the existing documents `head`
| [`include-vals`](@/extensions/include-vals.md)                   | allows you to include additional values in a request
| [`json-enc`](@/extensions/json-enc.md)                           | use JSON encoding in the body of requests, rather than the default `x-www-form-urlencoded`
| [`idiomorph`](https://github.com/bigskysoftware/idiomorph)       | an extension for using the idiomorph morphing algorithm as a swapping mechanism
| [`loading-states`](@/extensions/loading-states.md)               | allows you to disable inputs, add and remove CSS classes to any element while a request is in-flight.
| [`method-override`](@/extensions/method-override.md)             | use the `X-HTTP-Method-Override` header for non-`GET` and `POST` requests
| [`morphdom-swap`](@/extensions/morphdom-swap.md)                 | an extension for using the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the swapping mechanism in htmx.
| [`multi-swap`](@/extensions/multi-swap.md)                       | allows to swap multiple elements with different swap methods
| [`path-deps`](@/extensions/path-deps.md)                         | an extension for expressing path-based dependencies [similar to intercoolerjs](http://intercoolerjs.org/docs.html#dependencies)
| [`preload`](@/extensions/preload.md)                             | preloads selected `href` and `hx-get` targets based on rules you control.
| [`remove-me`](@/extensions/remove-me.md)                         | allows you to remove an element after a given amount of time
| [`response-targets`](@/extensions/response-targets.md)           | allows to specify different target elements to be swapped when different HTTP response codes are received
| [`restored`](@/extensions/restored.md)                           | allows you to trigger events when the back button has been pressed
| [`server-sent-events`](@/extensions/server-sent-events.md)       | uni-directional server push messaging via [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
| [`web-sockets`](@/extensions/web-sockets.md)                     | bi-directional connection to WebSocket servers
| [`path-params`](@/extensions/path-params.md)                     | allows to use parameters for path variables instead of sending them in query or body

</div>

## Defining an Extension {#defining}

To define an extension you call the `htmx.defineExtension()` function:

```html
<script>
  htmx.defineExtension('my-ext', {
    onEvent : function(name, evt) {
        console.log("Fired event: " + name, evt);
    }
  })
</script>
```

Typically, this is done in a stand-alone javascript file, rather than in an inline `script` tag.

Extensions should have names that are dash separated and that are reasonably short and descriptive.

Extensions can override the following default extension points to add or change functionality:

```javascript
{
    onEvent : function(name, evt) {return true;},
    transformResponse : function(text, xhr, elt) {return text;},
    isInlineSwap : function(swapStyle) {return false;},
    handleSwap : function(swapStyle, target, fragment, settleInfo) {return false;},
    encodeParameters : function(xhr, parameters, elt) {return null;}
}
```
