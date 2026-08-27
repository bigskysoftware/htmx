---
title: "Events"
description: "Lifecycle hooks for requests, responses, swaps, and errors."
---

### Request Lifecycle

- [htmx:config:request](/reference/events/htmx-config-request) - fires before request data is encoded
- [htmx:confirm](/reference/events/htmx-confirm) - fires before handling `hx-confirm`
- [htmx:before:request](/reference/events/htmx-before-request) - fires immediately before `fetch()`
- [htmx:before:response](/reference/events/htmx-before-response) - fires after `fetch()`, before `response.text()`
- [htmx:after:request](/reference/events/htmx-after-request) - fires after `response.text()`
- [htmx:response:error](/reference/events/htmx-response-error) - fires for HTTP status 400 or higher
- [htmx:before:swap](/reference/events/htmx-before-swap) - fires before DOM update
- [htmx:before:settle](/reference/events/htmx-before-settle) - fires after DOM insertion, before settle tasks
- [htmx:after:settle](/reference/events/htmx-after-settle) - fires after settle tasks
- [htmx:after:swap](/reference/events/htmx-after-swap) - fires after DOM update
- [htmx:finally:swap](/reference/events/htmx-finally-swap) - at the end of swap lifecycle
- [htmx:finally:request](/reference/events/htmx-finally-request) - fires after lifecycle ends, including failures
- [htmx:error](/reference/events/htmx-error) - fires after request or swap exception
- [htmx:abort](/reference/events/htmx-abort) - aborts in-flight request

### Elements

- [htmx:before:init](/reference/events/htmx-before-init) - fires before element initialization
- [htmx:after:init](/reference/events/htmx-after-init) - fires after element initialization
- [htmx:before:process](/reference/events/htmx-before-process) - fires before DOM node processing
- [htmx:after:process](/reference/events/htmx-after-process) - fires after DOM node processing
- [htmx:before:cleanup](/reference/events/htmx-before-cleanup) - fires before element data removal
- [htmx:after:cleanup](/reference/events/htmx-after-cleanup) - fires after element data removal
- [load](/reference/events/load) - fires after element initialization

### History Events

- [htmx:before:history:update](/reference/events/htmx-before-history-update) - fires before browser history update
- [htmx:after:history:update](/reference/events/htmx-after-history-update) - fires after browser history update
- [htmx:after:history:push](/reference/events/htmx-after-push-into-history) - fires after history push
- [htmx:after:history:replace](/reference/events/htmx-after-replace-into-history) - fires after history replacement
- [htmx:before:history:restore](/reference/events/htmx-before-restore-history) - fires before history restoration

### View Transitions

- [htmx:before:viewTransition](/reference/events/htmx-before-viewTransition) - fires before view transition starts
- [htmx:after:viewTransition](/reference/events/htmx-after-viewTransition) - fires after view transition completes

### Triggers

- [intersect](/reference/events/intersect) - fires when element enters viewport
- [every](/reference/events/every) - fires at each polling interval
