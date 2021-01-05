# Migration Guide: Intercooler to htmx 

The purpose of this guide is to:
 -  _map_ the equivalent htmx attributes, headers, events, methods, etc. that are available in Intercooler
 -  _provide workarounds_ to achieve the same/similar outcome in the cases where there is no direct equivalent in htmx core (usually via an htmx extension or via [hyperscript](https://htmx.org/docs/#hyperscript))
 -  _highlight gaps_ which can't (yet) be elegantly solved via core htmx, any of the existing extensions or [hyperscript](https://htmx.org/docs/#hyperscript)

## Before you begin
It is worth noting the difference in approach between what Intercooler set out to do and what htmx is doing.

**Intercooler** tried to provide custom html attributes for most of it's functionality. This is evident in it's longer list of attributes, many of which could be described as convenience or client-side-focused in nature.

**htmx** follows the approach of trying to keep the core small, with a smaller set of available attributes that are mostly focused on content loading and swapping. It's capability is augmented in primarily 2 ways:
1. [Extensions](https://dev.htmx.org/extensions#reference). The htmx extension framework allows for custom extensions/plugins to achieve specific functionality. An example  of this is the dependencies mechanism baked into Intercooler, which is not present in htmx core. but available via [an extension](https://htmx.org/extensions/path-deps). There are also other extensions which enables new behavior that Intercooler was not capable of out the box, e.g. the [`preload` extension](https://dev.htmx.org/extensions/preload)
2. [Hyperscript](https://htmx.org/docs/#hyperscript), or another "barebones" JS library like [alpine.js]([hyperscript](https://htmx.org/docs/#hyperscript). Hyperscript is a small, open scripting language designed to be embedded in HTML, inspired by HyperTalk and is a companion project of htmx.

htmx contains some functionality which is not present in Intercooler. That is outside of the scope of this guide.<br>
Finally, it's worth noting that this is still a work in progress and is liable to change over time.

## On to the migration stuff already!
The rest of this guide is laid out as a set of tables, each of which attempts to map the following common functional areas of Intercooler onto the htmx equivalents:

 - [attributes](#attributes)
 - [request parameters](#request-parameters)
 - [request headers](#request-headers)
 - [response headers](#response-headers)
 - [events](#events)
 - [Javascript API methods](#methods)
 - [meta tags](#meta-tags)

 ---

### <a name="attributes">Attributes</a>

**Note**: For certain Intercooler attributes (mostly client-side specific attributes, e.g. the ic-action and associated attributes) there are no direct htmx equivalents. Instead, there is a small, expressive language available called hyperscript, (see http://hyperscript.org), which is designed to be embedded in HTML and acts as a seamless companion to htmx. It allows you to achieve the same behavior as some of especially the _client-side focused_ Intercooler attributes, but in a more flexible and open manner.

See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) for practical examples, as well as more on the philosophy behind hyperscipt.

| Intercooler | htmx |
|-----------|-------------|
| [`ic-action`](https://intercoolerjs.org/attributes/ic-action.html) | None. Use [Hyperscript](), e.g. `<button _="on click add .clicked">Add The "clicked" Class To Me</button>`. See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org)for more examples
| [`ic-action-target`](https://intercoolerjs.org/attributes/ic-action-target.html) | None. Use the [Hyperscript target expression](https://hyperscript.org/expressions/target/), e.g. `<div _="on click set .button.style.color to 'red'">Set All Buttons To Red</div>`
| [`ic-add-class`](https://intercoolerjs.org/attributes/ic-add-class.html) | None. Use [Hyperscript](), e.g. `<button _="on click add .clicked">Add The "clicked" Class To Me</button>`. See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-append-from`](https://intercoolerjs.org/attributes/ic-append-from.html) | None. Equivalent functionality can be achived by using for example [`hx-get`](https://dev.htmx.org/attributes/hx-get) and [`hx-swap`](https://dev.htmx.org/attributes/hx-swap/) with value `beforeend`
| [`ic-attr-src`](https://intercoolerjs.org/attributes/ic-attr-src.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-confirm`](https://intercoolerjs.org/attributes/ic-confirm.html) | [`hx-confirm`](https://htmx.org/attributes/hx-confirm)
| [`ic-delete-from`](https://intercoolerjs.org/attributes/ic-delete-from.html) | [`hx-delete`](https://htmx.org/attributes/hx-delete)
| [`ic-deps`](https://intercoolerjs.org/attributes/ic-deps.html) | `hx-trigger="path-deps"` along with `path-deps="/foo/bar"`. (Requires the [`path-deps` extension](https://htmx.org/extensions/path-deps/))
| [`ic-disable-when-doc-hidden`](https://intercoolerjs.org/attributes/ic-disable-when-doc-hidden.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-disable-when-doc-inactive`](https://intercoolerjs.org/attributes/ic-disable-when-doc-inactive.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-enhance`](https://intercoolerjs.org/attributes/ic-enhance.html) | [`hx-boost`](https://htmx.org/attributes/hx-boost)
| [`ic-fix-ids`](https://intercoolerjs.org/attributes/ic-fix-ids.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-get-from`](https://intercoolerjs.org/attributes/ic-get-from.html) | [`hx-get`](https://htmx.org/attributes/hx-get)
| [`ic-global-include`](https://intercoolerjs.org/attributes/ic-global-include.html) | None. [`hx-include`](https://htmx.org/attributes/hx-include) can be used to achieve similar functionality
| [`ic-global-indicator`](https://intercoolerjs.org/attributes/ic-global-indicator.html) | None. [`hx-indicator`](https://htmx.org/attributes/hx-indicator) can be used to achieve similar functionality
| [`ic-history-elt`](https://intercoolerjs.org/attributes/ic-history-elt.html) | [`hx-history-elt`](https://htmx.org/attributes/hx-history-elt)
| [`ic-include`](https://intercoolerjs.org/attributes/ic-include.html) | [`hx-include`](https://htmx.org/attributes/hx-include)
| [`ic-indicator`](https://intercoolerjs.org/attributes/ic-indicator.html) | [`hx-indicator`](https://htmx.org/attributes/hx-indicator)
| [`ic-limit-children`](https://intercoolerjs.org/attributes/ic-limit-children.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-local-vars`](https://intercoolerjs.org/attributes/ic-local-vars.html) | No direct equivalent. [`hx-vars`](https://htmx.org/attributes/hx-vars) could be used to facilitate.
| [`ic-on-beforeSend`](https://intercoolerjs.org/attributes/ic-on-beforeSend.html) | None. Use [Hyperscript]() in conjunction with events (e.g. [`htmx:beforeRequest`](https://htmx.org/events#htmx:beforeRequest)). See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-beforeTrigger`](https://intercoolerjs.org/attributes/ic-on-beforeTrigger.html) | None. Use [Hyperscript]() in conjunction with events (e.g. [`htmx:beforeRequest`](https://htmx.org/events#htmx:beforeRequest)). See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-complete`](https://intercoolerjs.org/attributes/ic-on-complete.html) | None. Use [Hyperscript]() in conjunction with events (e.g. [`https://htmx.org/events#htmx:afterRequest`](https://htmx.org/events#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-error`](https://intercoolerjs.org/attributes/ic-on-error.html) | None. Use [Hyperscript]() in conjunction with events (e.g. [`https://htmx.org/events#htmx:afterRequest`](https://htmx.org/events#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-on-success`](https://intercoolerjs.org/attributes/ic-on-success.html) | None. Use [Hyperscript]() in conjunction with events (e.g. [`https://htmx.org/events#htmx:afterRequest`](https://htmx.org/events#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-patch-to`](https://intercoolerjs.org/attributes/ic-patch-to.html) | None. Use [Hyperscript]() in conjunction with events (e.g. [`https://htmx.org/events#htmx:afterRequest`](https://htmx.org/events#htmx:afterRequest)). See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org) for more examples
| [`ic-pause-polling`](https://intercoolerjs.org/attributes/ic-pause-polling.html) | None. Techniques like [`load polling`](https://htmx.org/docs/#load_polling) could be used
| [`ic-poll`](https://intercoolerjs.org/attributes/ic-poll.html) | None. The equivalent can be achieved by triggering a load on schedule, e.g. `<div hx-get="/news" hx-trigger="every 2s"></div>`. See the [documentation on polling](https://htmx.org/docs/#polling)
| [`ic-poll-repeats`](https://intercoolerjs.org/attributes/ic-poll-repeats.html) | None. The equivalent can be achieved by triggering a load on schedule, e.g. `<div hx-get="/news" hx-trigger="every 2s"></div>`. See the [documentation on polling](https://htmx.org/docs/#polling)
| [`ic-post-errors-to`](https://intercoolerjs.org/attributes/ic-post-errors-to.html) | None. Errors can be trapped via events and logged via the [`htmx.logger` mechanism](https://htmx.org/docs/#events)
| [`ic-post-to`](https://intercoolerjs.org/attributes/ic-post-to.html) | [`hx-post`](https://htmx.org/attributes/hx-post)
| [`ic-prepend-from`](https://intercoolerjs.org/attributes/ic-prepend-from.html) | The [`hx-swap` attribute](https://htmx.org/attributes/hx-swap) with value set to `beforeend` could be used to achieve the same outcome
| [`ic-prompt`](https://intercoolerjs.org/attributes/ic-prompt.html) | [`hx-prompt`](https://htmx.org/attributes/hx-prompt)
| [`ic-push-url`](https://intercoolerjs.org/attributes/ic-push-url.html) | [`hx-push-url`](https://htmx.org/attributes/hx-push-url)
| [`ic-push-params`](https://intercoolerjs.org/attributes/ic-push-params.html) | tbd
| [`ic-put-to`](https://intercoolerjs.org/attributes/ic-put-to.html) | [`hx-put`](https://htmx.org/attributes/hx-put)
| [`ic-remove-after`](https://intercoolerjs.org/attributes/ic-remove-after.html) | None. See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) for an example on how to implement it using [hyperscript](https://hyperscript.org)
| [`ic-remove-class`](https://intercoolerjs.org/attributes/ic-remove-class.html) | None. Use [Hyperscript](), e.g. `<button class="red" _="on click remove .red">Remove The "red" class from me</button>`. See the [htmx documentation on hyperscript](https://htmx.org/docs/#hyperscript) and [hyperscript documentation](https://hyperscript.org)for more examples
| [`ic-replace-target`](https://intercoolerjs.org/attributes/ic-replace-target.html) | The [`hx-swap` attribute](https://htmx.org/attributes/hx-swap) with value set to `outerHTML` could be used to achieve the same outcome
| [`ic-scroll-offset`](https://intercoolerjs.org/attributes/ic-scroll-offset.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-scroll-to-target`](https://intercoolerjs.org/attributes/ic-scroll-to-target.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-select-from-response`](https://intercoolerjs.org/attributes/ic-select-from-response.html) | [`hx-select`](https://htmx.org/attributes/hx-select)
| [`ic-src`](https://intercoolerjs.org/attributes/ic-src.html) | None. Use ['hx-get'](https://htmx.org/attributes/hx-get) in conjunction with triggers or the [`path-deps` extension](https://htmx.org/extensions/path-deps)
| [`ic-sse-src`](https://intercoolerjs.org/attributes/ic-sse-src.html) | [`hx-sse`](https://htmx.org/attributes/hx-sse)
| [`ic-style-src`](https://intercoolerjs.org/attributes/ic-style-src.html) | None. No direct equivalent functionality exists (TBC)
| [`ic-swap-style`](https://intercoolerjs.org/attributes/ic-swap-style.html) | [`hx-swap`](https://htmx.org/attributes/hx-swap)
| [`ic-switch-class`](https://intercoolerjs.org/attributes/ic-switch-class.html) | None. See the [htmx documentation on _hyperscript](https://htmx.org/docs/#hyperscript) for an example on how to implement it using [_hyperscript](https://hyperscript.org) and the [`htmx:beforeOnLoad` event](https://htmx.org/events#htmx:beforeOnLoad)
| [`ic-target`](https://intercoolerjs.org/attributes/ic-target.html) | [`hx-target`](https://htmx.org/attributes/hx-target)
| [`ic-transform-response`](https://intercoolerjs.org/attributes/ic-transform-response.html) | None. The [`client-side-templates` extension](https://dev.htmx.org/extensions/client-side-templates) enablesJSON response transformation via templating engines like [mustache](https://github.com/janl/mustache.js), [handlebars](https://handlebarsjs.com/) or [nunjucks](https://mozilla.github.io/nunjucks/)
| [`ic-transition-duration`](https://intercoolerjs.org/attributes/ic-transition-duration.html) | None. Equivalent functionality can be achieved by relying on the nature of [htmx's swapping mechanism and CSS transitions](https://htmx.org/docs/#css_transitions)
| [`ic-trigger-delay`](https://intercoolerjs.org/attributes/ic-trigger-delay.html) | Use [`hx-trigger`](https://htmx.org/attributes/hx-trigger) with [modifiers](https://htmx.org/docs/#trigger-modifiers)
| [`ic-trigger-from`](https://intercoolerjs.org/attributes/ic-trigger-from.html) | Use [`hx-trigger`](https://dev.htmx.org/attributes/hx-trigger) with `from:` clause
| [`ic-trigger-on`](https://intercoolerjs.org/attributes/ic-trigger-on.html) | [`hx-trigger`](https://htmx.org/attributes/hx-trigger)
| [`ic-verb`](https://intercoolerjs.org/attributes/ic-verb.html) | None. By default htmx sends the actual http method. You can however non-`GET` verbs to `POST` via the [`method-override` extension](https://htmx.org/extensions/method-override)


### <a name="request-parameters">Request parameters</a>

| Intercooler | htmx |
|-----------|-------------|
| `ic-request` | None. Use `HX-Request` header
| `_method` | _method (requires the [`rails-method`](https://htmx.org/extensions/rails-method) extension)
| `ic-element-id` | None. Use `HX-Active-Element` header
| `ic-element-name` | None. Use `HX-Active-Element-Name` header
| `ic-target-id` | None. Use `HX-Target` header
| `ic-trigger-id` | None. Use `HX-Trigger` header
| `ic-trigger-name` | None. Use `HX-Trigger-Name` header
| `ic-current-url` | None. Use the `HX-Current-URL` header
| `ic-prompt-value` | None. Use the `HX-Prompt` header

## <a name="request-headers">Request headers</a>

| Intercooler | htmx |
|-----------|-------------|
| `X-IC-Request` | `HX-Request`
| `X-HTTP-Method-Override` | `X-HTTP-Method-Override`

## <a name="response-headers">Response headers</a>

| Intercooler | htmx |
|-----------|-------------|
| `X-IC-Trigger` | `HX-Trigger`, `HX-Trigger-After-Settle`, `HX-Trigger-After-Swap`. See [documentation](https://htmx.org/headers/x-hx-trigger) for more details
| `X-IC-Refresh` | `HX-Refresh`
| `X-IC-Redirect` | `HX-Redirect`
| `X-IC-Script` | None. No  direct equivalent functionality exists (TBC)
| `X-IC-CancelPolling` | None. Respond with HTTP response code `286` to cancel [polling](https://htmx.org/docs/#polling).
| `X-IC-ResumePolling` | None. No direct equivalent functionality exists
| `X-IC-SetPollInterval` | None. If using [load polling](https://htmx.org/docs/#load_polling), respond with content that contains a different load interval.
| `X-IC-Open` | None. No direct equivalent functionality exists (TBC)
| `X-IC-PushURL` | `HX-Push`
| `X-IC-Remove` | None. No direct equivalent functionality exists (TBC)
| `X-IC-Title` | None. No direct equivalent functionality exists (TBC)
| `X-IC-Title-Encoded` | None. No direct equivalent functionality exists (TBC)
| `X-IC-Set-Local-Vars` | None. No direct equivalent functionality exists (TBC)

### <a name="events">Events</a>

**Note**: All [htmx events](https://htmx.org/docs/#events) are fired in both Camel and Kebab casing.

| Intercooler | htmx |
|-----------|-------------|
| `log.ic` | None. Equivalent achieved via `htmx.logger`. See [`Events & Logging` documentation](https://htmx.org/docs/#events)
| `beforeAjaxSend.ic` | [`htmx:configRequest`](https://htmx.org/events#htmx:configRequest)
| `beforeHeaders.ic` | None. No direct equivalent functionality exists (TBC)
| `afterHeaders.ic` | None. No direct equivalent functionality exists (TBC)
| `beforeSend.ic` | [`htmx:beforeRequest`](https://htmx.org/events#htmx:beforeRequest)
| `success.ic` | [`htmx:afterOnLoad`](https://htmx.org/events#htmx:afterOnLoad)
| `after.success.ic` | Approximate equivalent: [`htmx:beforeSwap`](https://htmx.org/events#htmx:beforeSwap)
| `error.ic` | [`htmx:sendError`](https://htmx.org/events#htmx:sendError) or [`htmx:sseError`](https://htmx.org/events#htmx:sseError) or [`htmx:responseError`](https://htmx.org/events#htmx:responseError) or [`htmx:swapError`](https://htmx.org/events#htmx:swapError) or [`htmx:onLoadError`](https://htmx.org/events#htmx:onLoadError) (TBC)
| `complete.ic` | [`htmx:afterRequest`](https://htmx.org/events#htmx:afterRequest)
| `onPoll.ic` | No direct equivalent. When using [load polling](https://htmx.org/docs/#load_polling), the [`htmx:load` event] could potentially be used
| `handle.onpopstate.ic` | [`htmx:historyRestore`](https://htmx.org/events#htmx:historyRestore) (TBC)
| `elementAdded.ic` | [`htmx:load`](https://htmx.org/events#htmx:load)
| `pushUrl.ic` | tbd
| `beforeHistorySnapshot.ic` | [`htmx:beforeHistorySave`](https://htmx.org/events#htmx:beforeHistorySave)

### <a name="methods">Javascript API methods</a>

| Intercooler | htmx |
|-----------|-------------|
| `Intercooler.refresh(eltOrPath)` | `PathDeps.refresh()` (requires the [`path-deps`](https://htmx.org/extensions/path-deps) extension)
| `Intercooler.triggerRequest(elt, handler)` | [`htmx.trigger()`](https://htmx.org/api#trigger)
| `Intercooler.processNodes(elt)` | [`htmx.process()`](https://htmx.org/api#process)
| `Intercooler.closestAttrValue(elt, attr)` | [`htmx.closest()`](https://htmx.org/api#closest) can be used with any selector
| `Intercooler.verbFor(elt)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.isDependent(elt1, elt2)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.getTarget(elt1)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.processHeaders(elt, xhr)` | None. No direct equivalent functionality exists (TBC)
| `Intercooler.ready(func(elt))` | [`htmx.onLoad()`](https://htmx.org/api#onLoad)
| `LeadDyno.startPolling(elt)` | None. No direct equivalent functionality exists (TBC)
| `LeadDyno.stopPolling(elt)` | None. No direct equivalent functionality exists (TBC)

### <a name="meta-tags">Meta tags</a>

| Intercooler | htmx |
|-----------|-------------|
| `<meta name="intercoolerjs:use-data-prefix" content="true"/>` | None. You can simply use the data- prefix without specifying a meta tag. htmx will automatically recognize htmx attributes like this: `<a data-hx-post="/click">Click Me!</a>`
| `<meta name="intercoolerjs:use-actual-http-method" content="true"/>` | None. By default htmx sends the actual http method. You can however achieve the same outcome via the [`method-override` extension](https://htmx.org/extensions/method-override)
