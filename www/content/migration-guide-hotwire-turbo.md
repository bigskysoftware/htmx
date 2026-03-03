+++
title = "Hotwire / Turbo ➡️ htmx Migration Guide"
+++

The purpose of this guide is to provide common practices for "Hotwire Equivalent" features in htmx.

* htmx is focused on a set of transparent, highly flexible extensions of html to its logical conclusion as a hypertext.
* Hotwire / Turbo is focused on a smooth out of the box experience, but is more opinionated and less flexible.

## Turbo Drive

* `<body hx-boost="true">` to enable a Turbo Drive-like experience. See: [hx-boost](@/attributes/hx-boost.md)
* As with Turbo Drive, if the user has javascript disabled, `hx-boost` will continue to work. See: [Progressive Enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement)
* `hx-boost="false"` is equivalent to `data-turbo="false"` and used to disable boost on specific links or forms. See: [Handbook](https://turbo.hotwired.dev/handbook/drive#disabling-turbo-drive-on-specific-links-or-forms)
* Redirect after form submission (302, 303, 307, 3xx) `hx-target="body" hx-swap="outerHTML" hx-push-url="true"` See: [Handbook](https://turbo.hotwired.dev/handbook/drive#redirecting-after-a-form-submission)
* Disable buttons on form submission See: [Handbook](https://turbo.hotwired.dev/handbook/drive#form-submissions)
  * Only disable buttons because `<form>` does not submit disabled fields. See: [MDN: disabled](https://developer.mozilla.org/docs/Web/HTML/Attributes/disabled)
```javascript
addEventListener("submit", (event) => {
    event.target.querySelectorAll("button").forEach(node => { node.disabled = true })
})
addEventListener("htmx:afterOnLoad", (event) => {
    event.target.querySelectorAll("button").forEach(node => { node.disabled = false })
})
```
* Or, [hx-on](@/attributes/hx-on.md) may be used:
  * `hx-on:submit= 'event.target.querySelectorAll("button").forEach(node => { node.disabled = true })'`
  * `hx-on:htmx:afterOnLoad= 'event.target.querySelectorAll("button").forEach(node => { node.disabled = false })'`
* Or, [hyperscript](https://hyperscript.org) may be used: `_="on submit toggle @disabled <button/> in me until htmx:afterOnLoad"` See: [Cookbook](https://hyperscript.org/cookbook/)

## Turbo Frames

* htmx combines all ideas of "Turbo Frames" into the base attributes. No `<turbo-frame>` required.
* Lazy loading: `hx-trigger="load, submit"`  See: [Handbook](https://turbo.hotwired.dev/reference/frames#lazy-loaded-frame)

## Turbo Streams

* htmx combines all ideas of "Turbo Streams" into the base attributes. No `<turbo-stream>`, no `<template>` required.
* Note: Turbo Streams can perform many actions anywhere on a page (similar to [hx-select-oob](@/attributes/hx-select-oob.md) and [hx-swap-oob](@/attributes/hx-swap-oob.md)) while Turbo Frames only update what is wrapped within `<turbo-frame> .. </turbo-frame>`

## Events

* Intercepting or Pausing Events. `htmx:config-request` is equivalent to `turbo:before-fetch-request` See: [Handbook](https://turbo.hotwired.dev/handbook/drive#pausing-requests)
  * `htmx:config-request` is the same as `htmx:configRequest` See: [Event Naming](@/docs.md#event_naming)

```javascript
document.body.addEventListener('htmx:configRequest', (event) => {
    event.detail.headers['Authorization'] = `Bearer ${token}`
})
```

* Or, use an [hx-trigger](@/attributes/hx-trigger.md) condition: `hx-trigger="submit[action(target)]"`
  * Does not currently resolve async calls. See [issue](https://github.com/bigskysoftware/htmx/issues/912)
* Or, use [hx-on](@/attributes/hx-on.md): `hx-on:click="event.preventDefault(); action(this); htmx.trigger(this, 'ready')"` `hx-trigger="ready"`
* Or, use [hyperscript](https://hyperscript.org): `_="on submit halt the event action(target) trigger ready"` `hx-trigger="ready"`
  * Will resolve async calls such as `fetch`. See: [async transparency](https://hyperscript.org/docs/#async)

## Stimulus

* [hx-on](@/attributes/hx-on.md) provides an inline, vanilla substitute for a wide variety of use cases.
* [hyperscript](https://hyperscript.org) is a close analogue and an official companion project to htmx, but the two projects are entirely separated and can be used exclusively from each other or any other library.
* For other options, see: [htmx: Scripting](/docs/#scripting)
