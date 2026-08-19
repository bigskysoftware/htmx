---
title: "Headers"
description: "Request and response headers for server communication."
---

## Request

- [HX-Request](/reference/headers/HX-Request) - indicates request was made by htmx
- [HX-Request-Type](/reference/headers/HX-Request-Type) - indicates `partial` or `full` page request
- [HX-Current-URL](/reference/headers/HX-Current-URL) - contains browser URL when request started
- [HX-Source](/reference/headers/HX-Source) - identifies element that triggered the request
- [HX-Target](/reference/headers/HX-Target) - identifies element that will receive response
- [HX-Boosted](/reference/headers/HX-Boosted) - indicates boosted navigation request
- [HX-History-Restore-Request](/reference/headers/HX-History-Restore-Request) - indicates history navigation (back/forward)

## Response

- [HX-Trigger](/reference/headers/HX-Trigger) - triggers client-side events with `htmx.trigger()`
- [HX-Location](/reference/headers/HX-Location) - redirect without a full page load
- [HX-Redirect](/reference/headers/HX-Redirect) - redirects by setting `location.href`
- [HX-Refresh](/reference/headers/HX-Refresh) - reloads page with `location.reload()`
- [HX-Retarget](/reference/headers/HX-Retarget) - overrides swap target from server
- [HX-Reswap](/reference/headers/HX-Reswap) - overrides swap style from server
- [HX-Reselect](/reference/headers/HX-Reselect) - overrides content selection from server
- [HX-Replace-Url](/reference/headers/HX-Replace-Url) - replaces current URL in browser history
- [HX-Push-Url](/reference/headers/HX-Push-Url) - pushes URL into browser history stack
