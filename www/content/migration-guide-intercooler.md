+++
title = "intercooler.js &rarr; htmx Migration Guide"
+++

The purpose of this guide is to:
 -  _map_ the equivalent htmx attributes, headers, events, methods, etc. that are available in Intercooler
 -  _provide workarounds_ to achieve the same/similar outcome in the cases where there is no direct equivalent in htmx core (usually via an htmx extension or via [hyperscript](https://hyperscript.org))
 -  _highlight gaps_ which can't (yet) be elegantly solved via core htmx, any of the existing extensions or [hyperscript](https://hyperscript.org)

## Before you begin

It is worth noting the difference in approach between what Intercooler set out to do and what htmx is doing.

**Intercooler** tried to provide custom html attributes for most of it's functionality. This is evident in it's longer list of attributes, many of which could be described as convenience or client-side-focused in nature.

**htmx** follows the approach of trying to keep the core small, with a smaller set of available attributes that are mostly focused on content loading and swapping. 

This capability is augmented in primarily 2 ways:

1. [Extensions](@/extensions/_index.md#reference). The htmx extension framework allows for custom extensions/plugins to achieve specific functionality. An example  of this is the dependencies mechanism baked into Intercooler, which is not present in htmx core. but available via [an extension](@/extensions/path-deps.md). There are also other extensions which enables new behavior that Intercooler was not capable of out the box, e.g. the [`preload` extension](@/extensions/preload.md)
  
2. Using the htmx events system with vanilla javascript, [alpine.js](https://github.com/alpinejs/alpine/) or [hyperscript](https://hyperscript.org).  Hyperscript is a small, open scripting language designed to be embedded in HTML, inspired by HyperTalk and is a companion project of htmx.

htmx also contains functionality which is not present in Intercooler. That is outside of the scope of this guide.<br>

Finally, it's worth noting that this is still a work in progress and is liable to change over time.

## Migration Information

The rest of this guide is laid out as a set of tables, each of which attempts to map the following common functional areas of Intercooler onto the htmx equivalents:

 - [Attributes](#attributes)
 - [Request Parameters](#request-parameters)
 - [Request Headers](#request-headers)
 - [Response Headers](#response-headers)
 - [Events](#events)
 - [Javascript API Methods](#methods)
 - [Meta Tags](#meta-tags)

#### Attributes

**Note**: For certain Intercooler attributes (mostly client-side specific attributes, e.g. the ic-action and associated attributes) there are no direct htmx equivalents. Instead, there is a small, expressive language available called hyperscript, (see http://hyperscript.org), which is designed to be embedded in HTML and acts as a seamless companion to htmx. It allows you to achieve the same behavior as some of especially the _client-side focused_ Intercooler attributes, but in a more flexible and open manner.

See the [htmx documentation on hyperscript](https://hyperscript.org) for practical examples, as well as more on the philosophy behind hyperscipt.

| Intercooler | htmx |
|-----------|-------------|
| [`ic-action`](https://intercoolerjs.org/attributes/ic-action.html) | None. Use [Hyperscript][], e.g. `<button _="on click add .clicked">Add The "clicked" Class To Me</button>`. See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org)for more examples
| [`ic-action-target`](https://intercoolerjs.org/attributes/ic-action-target.html) | None. Use the [Hyperscript target expression](https://hyperscript.org/expressions/target/), e.g. `<div _="on click set .button.style.color to 'red'">Set All Buttons To Red</div>`
| [`ic-add-class`](https://intercoolerjs.org/attributes/ic-add-class.html) | None. Use [Hyperscript][], e.g. `<button _="on click add .clicked">Add The "clicked" Class To Me</button>`. See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-append-from`](https://intercoolerjs.org/attributes/ic-append-from.html) | None. Equivalent functionality can be achieved by using for example [`hx-get`](@/attributes/hx-get.md) and [`hx-swap`](@/attributes/hx-swap.md) with value `beforeend`
| [`ic-attr-src`](https://intercoolerjs.org/attributes/ic-attr-src.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-confirm`](https://intercoolerjs.org/attributes/ic-confirm.html) | [`hx-confirm`](@/attributes/hx-confirm.md)
| [`ic-delete-from`](https://intercoolerjs.org/attributes/ic-delete-from.html) | [`hx-delete`](@/attributes/hx-delete.md)
| [`ic-deps`](https://intercoolerjs.org/attributes/ic-deps.html) | `hx-trigger="path-deps"` along with `path-deps="/foo/bar"`. (Requires the [`path-deps` extension](@/extensions/path-deps.md))
| [`ic-disable-when-doc-hidden`](https://intercoolerjs.org/attributes/ic-disable-when-doc-hidden.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-disable-when-doc-inactive`](https://intercoolerjs.org/attributes/ic-disable-when-doc-inactive.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-enhance`](https://intercoolerjs.org/attributes/ic-enhance.html) | [`hx-boost`](@/attributes/hx-boost.md)
| [`ic-fix-ids`](https://intercoolerjs.org/attributes/ic-fix-ids.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-get-from`](https://intercoolerjs.org/attributes/ic-get-from.html) | [`hx-get`](@/attributes/hx-get.md)
| [`ic-global-include`](https://intercoolerjs.org/attributes/ic-global-include.html) | None. [`hx-include`](@/attributes/hx-include.md) can be used to achieve similar functionality
| [`ic-global-indicator`](https://intercoolerjs.org/attributes/ic-global-indicator.html) | None. [`hx-indicator`](@/attributes/hx-indicator.md) can be used to achieve similar functionality
| [`ic-history-elt`](https://intercoolerjs.org/attributes/ic-history-elt.html) | [`hx-history-elt`](@/attributes/hx-history-elt.md)
| [`ic-include`](https://intercoolerjs.org/attributes/ic-include.html) | [`hx-include`](@/attributes/hx-include.md)
| [`ic-indicator`](https://intercoolerjs.org/attributes/ic-indicator.html) | [`hx-indicator`](@/attributes/hx-indicator.md)
| [`ic-limit-children`](https://intercoolerjs.org/attributes/ic-limit-children.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-local-vars`](https://intercoolerjs.org/attributes/ic-local-vars.html) | No direct equivalent. [`hx-vars`](@/attributes/hx-vars.md) could be used to facilitate.
| [`ic-on-beforeSend`](https://intercoolerjs.org/attributes/ic-on-beforeSend.html) | None. Use [Hyperscript][] in conjunction with events (e.g. [`htmx:beforeRequest`](@/events.md#htmx:beforeRequest)). See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-beforeTrigger`](https://intercoolerjs.org/attributes/ic-on-beforeTrigger.html) | None. Use [Hyperscript][] in conjunction with events (e.g. [`htmx:beforeRequest`](@/events.md#htmx:beforeRequest)). See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-complete`](https://intercoolerjs.org/attributes/ic-on-complete.html) | None. Use [Hyperscript][] in conjunction with events (e.g. [`htmx:afterRequest`](@/events.md#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-error`](https://intercoolerjs.org/attributes/ic-on-error.html) | None. Use [Hyperscript][] in conjunction with events (e.g. [`htmx:afterRequest`](@/events.md#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-success`](https://intercoolerjs.org/attributes/ic-on-success.html) | None. Use [Hyperscript][] in conjunction with events (e.g. [`htmx:afterRequest`](@/events.md#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-patch-to`](https://intercoolerjs.org/attributes/ic-patch-to.html) | [`hx-patch`](@/attributes/hx-patch.md)
| [`ic-pause-polling`](https://intercoolerjs.org/attributes/ic-pause-polling.html) | None. Techniques like [`load polling`](@/docs.md#load_polling) could be used
| [`ic-poll`](https://intercoolerjs.org/attributes/ic-poll.html) | None. The equivalent can be achieved by triggering a load on schedule, e.g. `<div hx-get="/news" hx-trigger="every 2s"></div>`. See the [documentation on polling](@/docs.md#polling)
| [`ic-poll-repeats`](https://intercoolerjs.org/attributes/ic-poll-repeats.html) | None. The equivalent can be achieved by triggering a load on schedule, e.g. `<div hx-get="/news" hx-trigger="every 2s"></div>`. See the [documentation on polling](@/docs.md#polling)
| [`ic-post-errors-to`](https://intercoolerjs.org/attributes/ic-post-errors-to.html) | None. Errors can be trapped via events and logged via the [`htmx.logger` mechanism](@/docs.md#events)
| [`ic-post-to`](https://intercoolerjs.org/attributes/ic-post-to.html) | [`hx-post`](@/attributes/hx-post.md)
| [`ic-prepend-from`](https://intercoolerjs.org/attributes/ic-prepend-from.html) | The [`hx-swap` attribute](@/attributes/hx-swap.md) with value set to `beforeend` could be used to achieve the same outcome
| [`ic-prompt`](https://intercoolerjs.org/attributes/ic-prompt.html) | [`hx-prompt`](@/attributes/hx-prompt.md)
| [`ic-push-url`](https://intercoolerjs.org/attributes/ic-push-url.html) | [`hx-push-url`](@/attributes/hx-push-url.md)
| [`ic-push-params`](https://intercoolerjs.org/attributes/ic-push-params.html) | Parameters are automatically pushed in the case of a `GET` in htmx
| [`ic-put-to`](https://intercoolerjs.org/attributes/ic-put-to.html) | [`hx-put`](@/attributes/hx-put.md)
| [`ic-remove-after`](https://intercoolerjs.org/attributes/ic-remove-after.html) | None. See the [htmx documentation on hyperscript](https://hyperscript.org) for an example on how to implement it using [hyperscript](https://hyperscript.org)
| [`ic-remove-class`](https://intercoolerjs.org/attributes/ic-remove-class.html) | None. Use [Hyperscript][], e.g. `<button class="red" _="on click remove .red">Remove The "red" class from me</button>`. See the [htmx documentation on hyperscript](https://hyperscript.org) and [hyperscript documentation](https://hyperscript.org)for more examples
| [`ic-replace-target`](https://intercoolerjs.org/attributes/ic-replace-target.html) | The [`hx-swap` attribute](@/attributes/hx-swap.md) with value set to `outerHTML` could be used to achieve the same outcome
| [`ic-scroll-offset`](https://intercoolerjs.org/attributes/ic-scroll-offset.html) | None. No direct equivalent functionality exists
| [`ic-scroll-to-target`](https://intercoolerjs.org/attributes/ic-scroll-to-target.html) | See the `scroll` and `show` modifiers on the [`hx-swap`](@/attributes/hx-swap.md) attribute
| [`ic-select-from-response`](https://intercoolerjs.org/attributes/ic-select-from-response.html) | [`hx-select`](@/attributes/hx-select.md)
| [`ic-src`](https://intercoolerjs.org/attributes/ic-src.html) | None. Use [`hx-get`](@/attributes/hx-get.md) in conjunction with triggers or the [`path-deps` extension](@/extensions/path-deps.md)
| [`ic-sse-src`](https://intercoolerjs.org/attributes/ic-sse-src.html) | [`hx-sse`](@/attributes/hx-sse.md)
| [`ic-style-src`](https://intercoolerjs.org/attributes/ic-style-src.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-swap-style`](https://intercoolerjs.org/attributes/ic-swap-style.html) | [`hx-swap`](@/attributes/hx-swap.md)
| [`ic-switch-class`](https://intercoolerjs.org/attributes/ic-switch-class.html) | None. See the [htmx documentation on _hyperscript](https://hyperscript.org) for an example on how to implement it using [_hyperscript](https://hyperscript.org) and the [`htmx:beforeOnLoad` event](https://htmx.org/events#htmx:beforeOnLoad)
| [`ic-target`](https://intercoolerjs.org/attributes/ic-target.html) | [`hx-target`](@/attributes/hx-target.md)
| [`ic-transform-response`](https://intercoolerjs.org/attributes/ic-transform-response.html) | None. The [`client-side-templates` extension](@/extensions/client-side-templates.md) enables JSON response transformation via templating engines like [mustache](https://github.com/janl/mustache.js), [handlebars](https://handlebarsjs.com/) or [nunjucks](https://mozilla.github.io/nunjucks/)
| [`ic-transition-duration`](https://intercoolerjs.org/attributes/ic-transition-duration.html) | None. Equivalent functionality can be achieved by relying on the nature of [htmx's swapping mechanism and CSS transitions](@/docs.md#css_transitions)
| [`ic-trigger-delay`](https://intercoolerjs.org/attributes/ic-trigger-delay.html) | Use [`hx-trigger`](@/attributes/hx-trigger.md) with [modifiers](@/docs.md#trigger-modifiers)
| [`ic-trigger-from`](https://intercoolerjs.org/attributes/ic-trigger-from.html) | Use [`hx-trigger`](@/attributes/hx-trigger.md) with `from:` clause
| [`ic-trigger-on`](https://intercoolerjs.org/attributes/ic-trigger-on.html) | [`hx-trigger`](@/attributes/hx-trigger.md)
| [`ic-verb`](https://intercoolerjs.org/attributes/ic-verb.html) | None. By default htmx sends the actual http method. You can however non-`GET` verbs to `POST` via the [`method-override` extension](@/extensions/method-override.md)


#### Request parameters

| Intercooler | htmx |
|-----------|-------------|
| `ic-request` | None. Use `HX-Request` header
| `_method` | None. Use [`method-override`](@/extensions/method-override.md) extension and its provided `X-HTTP-Method-Override` header
| `ic-element-id` | None
| `ic-element-name` | None
| `ic-target-id` | None. Use `HX-Target` header
| `ic-trigger-id` | None. Use `HX-Trigger` header
| `ic-trigger-name` | None. Use `HX-Trigger-Name` header
| `ic-current-url` | None. Use the `HX-Current-URL` header
| `ic-prompt-value` | None. Use the `HX-Prompt` header

#### Request headers

| Intercooler | htmx |
|-----------|-------------|
| `X-IC-Request` | `HX-Request`
| `X-HTTP-Method-Override` | `X-HTTP-Method-Override`

#### Response headers

| Intercooler | htmx |
|-----------|-------------|
| `X-IC-Trigger` | `HX-Trigger`, `HX-Trigger-After-Settle`, `HX-Trigger-After-Swap`. See [documentation](@/headers/hx-trigger.md) for more details
| `X-IC-Refresh` | `HX-Refresh`
| `X-IC-Redirect` | `HX-Redirect`
| `X-IC-Script` | None. No  direct equivalent functionality exists (TBC)
| `X-IC-CancelPolling` | None. Respond with HTTP response code `286` to cancel [polling](@/docs.md#polling).
| `X-IC-ResumePolling` | None. No direct equivalent functionality exists
| `X-IC-SetPollInterval` | None. If using [load polling](@/docs.md#load_polling), respond with content that contains a different load interval.
| `X-IC-Open` | None. No direct equivalent functionality exists (TBC)
| `X-IC-PushURL` | `HX-Push`
| `X-IC-Remove` | None. No direct equivalent functionality exists (TBC)
| `X-IC-Title` | None. No direct equivalent functionality exists (TBC)
| `X-IC-Title-Encoded` | None. No direct equivalent functionality exists (TBC)
| `X-IC-Set-Local-Vars` | None. No direct equivalent functionality exists (TBC)

#### Events

**Note**: All [htmx events](@/docs.md#events) are fired in both Camel and Kebab casing.

| Intercooler | htmx |
|-----------|-------------|
| `log.ic` | None. Equivalent achieved via `htmx.logger`. See [`Events & Logging` documentation](@/docs.md#events)
| `beforeAjaxSend.ic` | [`htmx:configRequest`](@/events.md#htmx:configRequest)
| `beforeHeaders.ic` | None. No direct equivalent functionality exists (TBC)
| `afterHeaders.ic` | None. No direct equivalent functionality exists (TBC)
| `beforeSend.ic` | [`htmx:beforeRequest`](@/events.md#htmx:beforeRequest)
| `success.ic` | [`htmx:afterOnLoad`](@/events.md#htmx:afterOnLoad)
| `after.success.ic` | Approximate equivalent: [`htmx:beforeSwap`](@/events.md#htmx:beforeSwap)
| `error.ic` | [`htmx:sendError`](@/events.md#htmx:sendError) or [`htmx:sseError`](@/events.md#htmx:sseError) or [`htmx:responseError`](@/events.md#htmx:responseError) or [`htmx:swapError`](@/events.md#htmx:swapError) or [`htmx:onLoadError`](@/events.md#htmx:onLoadError) (TBC)
| `complete.ic` | [`htmx:afterRequest`](@/events.md#htmx:afterRequest)
| `onPoll.ic` | No direct equivalent. When using [load polling](@/docs.md#load_polling), the [`htmx:load` event] could potentially be used
| `handle.onpopstate.ic` | [`htmx:historyRestore`](@/events.md#htmx:historyRestore) (TBC)
| `elementAdded.ic` | [`htmx:load`](@/events.md#htmx:load)
| `pushUrl.ic` | tbd
| `beforeHistorySnapshot.ic` | [`htmx:beforeHistorySave`](@/events.md#htmx:beforeHistorySave)

#### JavaScript API methods {#methods}

| Intercooler | htmx |
|-----------|-------------|
| `Intercooler.refresh(eltOrPath)` | `PathDeps.refresh()` (requires the [`path-deps`](@/extensions/path-deps.md) extension)
| `Intercooler.triggerRequest(elt, handler)` | [`htmx.trigger()`](@/api.md#trigger)
| `Intercooler.processNodes(elt)` | [`htmx.process()`](@/api.md#process)
| `Intercooler.closestAttrValue(elt, attr)` | [`htmx.closest()`](@/api.md#closest) can be used with any selector
| `Intercooler.verbFor(elt)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.isDependent(elt1, elt2)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.getTarget(elt1)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.processHeaders(elt, xhr)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.ready(func(elt))` | [`htmx.onLoad()`](@/api.md#onLoad)
| `LeadDyno.startPolling(elt)` | None. No direct equivalent functionality exists (TBC)
| `LeadDyno.stopPolling(elt)` | None. No direct equivalent functionality exists (TBC)

#### Meta tags

| Intercooler | htmx |
|-----------|-------------|
| `<meta name="intercoolerjs:use-data-prefix" content="true"/>` | None. You can simply use the `data-` prefix without specifying a meta tag. htmx will automatically recognize htmx attributes like this: `<a data-hx-post="/click">Click Me!</a>`
| `<meta name="intercoolerjs:use-actual-http-method" content="true"/>` | None. By default htmx sends the actual http method. You can however change the verb for all non-GET requests to POST via the [`method-override` extension](@/extensions/method-override.md)


[Hyperscript]: https://hyperscript.org
