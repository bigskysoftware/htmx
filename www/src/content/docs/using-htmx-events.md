---
title: "Using htmx Events"
description: "Listen for htmx events to log, cancel, and modify request and swap behavior."
---

htmx triggers events at every step of the request and swap lifecycle. These events are the main extension point
for scripting htmx. You can use them to log what htmx does, to cancel an action, or to change it before it happens.

## Listening For Events

There are three ways to listen for an htmx event.

Use [`htmx.on()`](/reference/methods/htmx-on), which listens on `document` by default:

```javascript
htmx.on('htmx:after:swap', function (evt) {
    console.log('swapped', evt.detail.ctx.target);
});
```

Use the standard [`addEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener):

```javascript
document.body.addEventListener('htmx:after:init', function (evt) {
    setUpElement(evt.detail.elt);
});
```

Or use an [`hx-on:*`](/reference/attributes/hx-on) attribute on the element itself:

```html
<button hx-post="/example"
        hx-on:htmx:config:request="ctx.request.body.set('source', 'button')">
    Post Me!
</button>
```

htmx events bubble, so a listener on `document` or `document.body` sees events from every element. Use an
`hx-on:*` attribute when you only want to handle events from one element.

## The Event Detail

Most htmx events carry a `detail` object. For request and swap events, `detail.ctx` is the request context. It
holds the source element, the target, the swap style, the request, and, after the response arrives, the response.

```javascript
htmx.on('htmx:before:request', function (evt) {
    let ctx = evt.detail.ctx;
    console.log(ctx.request.method, ctx.request.action, ctx.target);
});
```

Inside an `hx-on:*` attribute every property of `detail` is already in scope, so you write `ctx` rather than
`event.detail.ctx`.

Element lifecycle events use `detail.elt` instead, which is the element htmx processed.

## Cancelling An Event

htmx events are cancelable. Call `preventDefault()` to stop htmx from continuing:

```javascript
htmx.on('htmx:before:request', function (evt) {
    if (!isLoggedIn()) {
        evt.preventDefault();
    }
});
```

Cancelling has a different effect for each event:

| Event | Effect of cancelling |
|-------|----------------------|
| [`htmx:confirm`](/reference/events/htmx-confirm) | suppresses the built-in confirmation. Call `detail.issueRequest()` or `detail.dropRequest()` yourself |
| [`htmx:before:request`](/reference/events/htmx-before-request) | the request is never sent |
| [`htmx:before:response`](/reference/events/htmx-before-response) | the response body is never read and no swap happens |
| [`htmx:after:request`](/reference/events/htmx-after-request) | the response is read but no swap happens |
| [`htmx:before:swap`](/reference/events/htmx-before-swap) | no swap task runs |
| [`htmx:before:init`](/reference/events/htmx-before-init) | the element is not initialized |
| [`htmx:before:process`](/reference/events/htmx-before-process) | the node and its descendants are not processed |

## The Event Lifecycle

### Request Events

These events fire in order for every request.

| Event | When it fires |
|-------|---------------|
| [`htmx:confirm`](/reference/events/htmx-confirm) | before htmx handles [`hx-confirm`](/reference/attributes/hx-confirm) |
| [`htmx:config:request`](/reference/events/htmx-config-request) | before the request data is encoded. Change `ctx.request` here |
| [`htmx:before:request`](/reference/events/htmx-before-request) | immediately before `fetch()` |
| [`htmx:before:response`](/reference/events/htmx-before-response) | after `fetch()`, before the body is read |
| [`htmx:after:request`](/reference/events/htmx-after-request) | after the response body is read |
| [`htmx:response:error`](/reference/events/htmx-response-error) | the response status is 400 or higher |
| [`htmx:error`](/reference/events/htmx-error) | a request or swap threw an exception |
| [`htmx:finally:request`](/reference/events/htmx-finally-request) | the lifecycle ended, including on failure |

### Swap Events

| Event | When it fires |
|-------|---------------|
| [`htmx:before:swap`](/reference/events/htmx-before-swap) | before the DOM is updated. `detail.tasks` holds the planned swaps |
| [`htmx:before:settle`](/reference/events/htmx-before-settle) | after insertion, before the settle tasks |
| [`htmx:after:settle`](/reference/events/htmx-after-settle) | after the settle tasks |
| [`htmx:after:swap`](/reference/events/htmx-after-swap) | after the DOM is updated |
| [`htmx:finally:swap`](/reference/events/htmx-finally-swap) | at the end of the swap lifecycle |
| [`htmx:before:viewTransition`](/reference/events/htmx-before-viewTransition) | before a view transition starts |
| [`htmx:after:viewTransition`](/reference/events/htmx-after-viewTransition) | after a view transition completes |

### Element Lifecycle Events

| Event | When it fires |
|-------|---------------|
| [`htmx:before:process`](/reference/events/htmx-before-process) | before htmx processes a DOM node |
| [`htmx:after:process`](/reference/events/htmx-after-process) | after htmx processes a DOM node |
| [`htmx:before:init`](/reference/events/htmx-before-init) | before an element is initialized |
| [`htmx:after:init`](/reference/events/htmx-after-init) | after an element is initialized |
| [`htmx:before:cleanup`](/reference/events/htmx-before-cleanup) | before htmx removes its data from an element |
| [`htmx:after:cleanup`](/reference/events/htmx-after-cleanup) | after htmx removes its data from an element |

### History Events

| Event | When it fires |
|-------|---------------|
| [`htmx:before:history:update`](/reference/events/htmx-before-history-update) | before the browser history is updated |
| [`htmx:after:history:update`](/reference/events/htmx-after-history-update) | after the browser history is updated |
| [`htmx:after:history:push`](/reference/events/htmx-after-push-into-history) | after a URL is pushed |
| [`htmx:after:history:replace`](/reference/events/htmx-after-replace-into-history) | after a URL is replaced |
| [`htmx:before:history:restore`](/reference/events/htmx-before-restore-history) | before a page is restored from history |

See the [events reference](/reference/events) for the full list, including the trigger events `load`, `intersect`
and `every`.

## Common Recipes

### Initialize A Third Party Library

New content that htmx swaps in is not known to your other libraries. Listen for
[`htmx:after:init`](/reference/events/htmx-after-init) to set it up:

```javascript
htmx.on('htmx:after:init', function (evt) {
    setUpElement(evt.detail.elt);
});
```

You can also use [`htmx.onLoad()`](/reference/methods/htmx-onLoad), which is a shorthand for this.

### Add A Value To Every Request

[`htmx:config:request`](/reference/events/htmx-config-request) fires before the request body is encoded, so
`ctx.request.body` is still a `FormData` object:

```javascript
htmx.on('htmx:config:request', function (evt) {
    evt.detail.ctx.request.body.set('csrf-token', getToken());
});
```

To add a header instead, write to `ctx.request.headers`:

```javascript
htmx.on('htmx:config:request', function (evt) {
    evt.detail.ctx.request.headers['X-CSRF-Token'] = getToken();
});
```

### Change The Target Or Swap Style

Both are on the context, so you can change them up to the point of the swap:

```javascript
htmx.on('htmx:before:swap', function (evt) {
    if (evt.detail.ctx.response.status === 404) {
        evt.detail.ctx.target = document.querySelector('#errors');
    }
});
```

For the declarative version of this, see [`hx-status`](/reference/attributes/hx-status).

## Logging Events

Set [`htmx.config.logAll`](/reference/config/htmx-config-logAll) to `true` to log every htmx event to the console:

```javascript
htmx.config.logAll = true;
```

You can also set it from HTML:

```html
<meta name="htmx-config" content="logAll:true">
```

htmx always logs events whose detail carries an `error` at error level, and events whose detail carries a `warn`
at warning level. `logAll` adds everything else.

## See Also

* [Client-Side Scripting](/docs#client-side-scripting)
* [The `hx-on:*` attributes](/reference/attributes/hx-on)
* [Events reference](/reference/events)
* [Building Extensions](/docs/building-extensions), which hooks the same events from an extension
