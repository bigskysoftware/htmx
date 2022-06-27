---
layout: layout.njk
title: </> Hotwire / Turbo ➡️ htmx Migration Guide
---

# Hotwire / Turbo ➡️ htmx Migration Guide

The purpose of this guide is to provide common practices for "Hotwire Equivalent" features in htmx.

* htmx is focused on a set of transparent, highly flexible extensions of html to its logical conclusion as a hypertext.
* Hotwire / Turbo is focused on a smooth out of the box experience, but is more opinionated and less flexible.

## Turbo Drive

* `<body hx-boost="true">` to enable a Turbo Drive-like experience. See: [hx-boost](/attributes/hx-boost)
* As with Turbo Drive, if the user does not have javascript enabled, the site will continue to work. See: [Progressive Enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement)
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
* Or, [hyperscript](https://hyperscript.org) may be used: `_="on submit toggle @disabled <button/> in me until htmx:afterOnLoad"` See: [Cookbook](/cookbook)
  
  

## Turbo Frames

* Lazy loading: `hx-trigger="load, submit"`  See: [Handbook](https://turbo.hotwired.dev/reference/frames#lazy-loaded-frame)

## Events

* Intercepting or Pausing Events. `htmx:config-request` is equivalent to `turbo:before-fetch-request` See: [Handbook](https://turbo.hotwired.dev/handbook/drive#pausing-requests)
  * `htmx:config-request` is the same as `htmx:configRequest` See: [Event Naming](https://htmx.org/docs/#event_naming)

```javascript
document.body.addEventListener('htmx:configRequest', (event) => {
    event.detail.headers['Authorization'] = `Bearer ${token}`
})
```

* Or, a condition call may be used: `hx-trigger="submit[action(target)]"` See: [hx-trigger](/attributes/hx-trigger)
  * Does not currently resolve async calls such as `fetch`. See: https://github.com/bigskysoftware/htmx/issues/912
* Or, [hyperscript](https://hyperscript.org) may be used: `_="on submit halt the event action(target) trigger ready"` `hx-trigger="ready"`
  * Will resolve async calls such as `fetch`. See: [async transparency](https://hyperscript.org/docs/#async)


## Stimulus

* [hyperscript](https://hyperscript.org) is a close analogue and an official companion project to htmx, but the two projects are entirely seperated and can be used exclusively from each other or any other library.
