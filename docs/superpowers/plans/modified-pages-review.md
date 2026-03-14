# Modified Pages Review

All pages in `www-2/` that were adapted from `https://four.htmx.org/` and may have been simplified.
Use the **Official URL** column to manually compare each page.

**Status key:**
- ✅ Audited OK — audit confirmed content is accurate
- ⚠️ Incomplete — audit found missing content (fix tracked in `2026-03-12-content-audit-fixes.md`)
- ❓ Not audited — needs manual review against official source
- 🚫 No official counterpart — content is original or has no direct mapping

---

## Attributes

All map to `https://four.htmx.org/attributes/{slug}/`

| Local file | Official URL | Status |
|---|---|---|
| `reference/01-attributes/01-hx-get.md` | https://four.htmx.org/attributes/hx-get/ | ✅ |
| `reference/01-attributes/02-hx-post.md` | https://four.htmx.org/attributes/hx-post/ | ✅ |
| `reference/01-attributes/03-hx-swap.md` | https://four.htmx.org/attributes/hx-swap/ | ⚠️ Missing: textContent, settle, strip, upsert modifiers; wrong defaultSwap ref |
| `reference/01-attributes/04-hx-target.md` | https://four.htmx.org/attributes/hx-target/ | ⚠️ Missing: findAll selector; closest-self behavior |
| `reference/01-attributes/05-hx-trigger.md` | https://four.htmx.org/attributes/hx-trigger/ | ✅ |
| `reference/01-attributes/06-hx-select.md` | https://four.htmx.org/attributes/hx-select/ | ✅ |
| `reference/01-attributes/07-hx-swap-oob.md` | https://four.htmx.org/attributes/hx-swap-oob/ | ✅ |
| `reference/01-attributes/08-hx-push-url.md` | https://four.htmx.org/attributes/hx-push-url/ | ✅ |
| `reference/01-attributes/09-hx-on.md` | https://four.htmx.org/attributes/hx-on/ | ✅ |
| `reference/01-attributes/10-hx-put.md` | https://four.htmx.org/attributes/hx-put/ | ✅ |
| `reference/01-attributes/11-hx-patch.md` | https://four.htmx.org/attributes/hx-patch/ | ✅ |
| `reference/01-attributes/12-hx-delete.md` | https://four.htmx.org/attributes/hx-delete/ | ✅ |
| `reference/01-attributes/13-hx-include.md` | https://four.htmx.org/attributes/hx-include/ | ✅ |
| `reference/01-attributes/14-hx-select-oob.md` | https://four.htmx.org/attributes/hx-select-oob/ | ✅ |
| `reference/01-attributes/15-hx-boost.md` | https://four.htmx.org/attributes/hx-boost/ | ✅ |
| `reference/01-attributes/16-hx-replace-url.md` | https://four.htmx.org/attributes/hx-replace-url/ | ✅ |
| `reference/01-attributes/17-hx-confirm.md` | https://four.htmx.org/attributes/hx-confirm/ | ✅ |
| `reference/01-attributes/18-hx-disable.md` | https://four.htmx.org/attributes/hx-disable/ | ✅ |
| `reference/01-attributes/19-hx-preserve.md` | https://four.htmx.org/attributes/hx-preserve/ | ✅ |
| `reference/01-attributes/20-hx-headers.md` | https://four.htmx.org/attributes/hx-headers/ | ✅ |
| `reference/01-attributes/21-hx-indicator.md` | https://four.htmx.org/attributes/hx-indicator/ | ✅ |
| `reference/01-attributes/22-hx-sync.md` | https://four.htmx.org/attributes/hx-sync/ | ✅ |
| `reference/01-attributes/23-hx-preload.md` | https://four.htmx.org/attributes/hx-preload/ | ✅ |
| `reference/01-attributes/24-hx-validate.md` | https://four.htmx.org/attributes/hx-validate/ | ✅ |
| `reference/01-attributes/25-hx-encoding.md` | https://four.htmx.org/attributes/hx-encoding/ | ✅ |
| `reference/01-attributes/26-hx-action.md` | https://four.htmx.org/attributes/hx-action/ | ✅ |
| `reference/01-attributes/27-hx-method.md` | https://four.htmx.org/attributes/hx-method/ | ✅ |
| `reference/01-attributes/28-hx-config.md` | https://four.htmx.org/attributes/hx-config/ | ✅ |
| `reference/01-attributes/29-hx-ignore.md` | https://four.htmx.org/attributes/hx-ignore/ | ✅ |
| `reference/01-attributes/30-hx-optimistic.md` | https://four.htmx.org/attributes/hx-optimistic/ | ✅ |
| `reference/01-attributes/31-hx-status.md` | https://four.htmx.org/attributes/hx-status/ | ✅ |
| `reference/01-attributes/32-hx-vals.md` | https://four.htmx.org/attributes/hx-vals/ | ⚠️ Missing: :append, inheritance rules, XSS warning, hx-include comparison |

---

## Request Headers

These are headers htmx *sends* to the server. All map to the request-headers section of the reference.
The audit did not cover these — all need manual review.

Official source: https://four.htmx.org/reference/#request-headers

| Local file | Official URL | Status |
|---|---|---|
| `reference/02-headers/01-HX-Request.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/02-HX-Request-Type.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/03-HX-Current-URL.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/04-HX-Source.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/05-HX-Target.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/06-HX-Boosted.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/07-HX-History-Restore-Request.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/08-Accept.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/09-Last-Event-ID.md` | https://four.htmx.org/reference/#request-headers | ❓ |
| `reference/02-headers/10-HX-Trigger.md` | https://four.htmx.org/reference/#request-headers | ❓ |

---

## Response Headers

These are headers the *server* sends to control htmx behavior.

| Local file | Official URL | Status |
|---|---|---|
| `reference/02-headers/11-HX-Location.md` | https://four.htmx.org/headers/hx-location/ | ⚠️ Missing: full ajax-context options, default body target, 3xx caveat |
| `reference/02-headers/12-HX-Redirect.md` | https://four.htmx.org/headers/hx-redirect/ | ⚠️ Missing: non-htmx endpoint guidance, 3xx caveat |
| `reference/02-headers/13-HX-Refresh.md` | https://four.htmx.org/headers/hx-refresh/ | ❓ Not explicitly audited |
| `reference/02-headers/14-ETag.md` | https://four.htmx.org/reference/#caching | ❓ Not explicitly audited |
| `reference/02-headers/15-If-None-Match.md` | https://four.htmx.org/reference/#caching | ❓ Not explicitly audited |
| `reference/02-headers/16-HX-Push-Url.md` | https://four.htmx.org/headers/hx-push-url/ | ✅ |
| `reference/02-headers/17-HX-Replace-Url.md` | https://four.htmx.org/headers/hx-replace-url/ | ✅ |

---

## Events

All map to `https://four.htmx.org/events/#{event-name}`

| Local file | Official URL | Status |
|---|---|---|
| `reference/03-events/01-htmx-config-request.md` | https://four.htmx.org/events/#htmx:config:request | ✅ |
| `reference/03-events/02-htmx-before-request.md` | https://four.htmx.org/events/#htmx:before:request | ✅ |
| `reference/03-events/03-htmx-after-request.md` | https://four.htmx.org/events/#htmx:after:request | ✅ |
| `reference/03-events/04-htmx-finally-request.md` | https://four.htmx.org/events/#htmx:finally:request | ✅ |
| `reference/03-events/05-htmx-before-swap.md` | https://four.htmx.org/events/#htmx:before:swap | ✅ |
| `reference/03-events/06-htmx-after-swap.md` | https://four.htmx.org/events/#htmx:after:swap | ✅ |
| `reference/03-events/07-htmx-before-cleanup.md` | https://four.htmx.org/events/#htmx:before:cleanup | ✅ |
| `reference/03-events/08-htmx-after-cleanup.md` | https://four.htmx.org/events/#htmx:after:cleanup | ✅ |
| `reference/03-events/09-htmx-confirm.md` | https://four.htmx.org/events/#htmx:confirm | ⚠️ Missing: fires on all triggers (not just hx-confirm); dropRequest() callback |
| `reference/03-events/10-htmx-error.md` | https://four.htmx.org/events/#htmx:error | ✅ |
| `reference/03-events/11-htmx-abort.md` | https://four.htmx.org/events/#htmx:abort | ✅ |
| `reference/03-events/12-htmx-before-init.md` | https://four.htmx.org/events/#htmx:before:init | ✅ |
| `reference/03-events/13-htmx-after-init.md` | https://four.htmx.org/events/#htmx:after:init | ✅ |
| `reference/03-events/14-htmx-before-process.md` | https://four.htmx.org/events/#htmx:before:process | ✅ |
| `reference/03-events/15-htmx-after-process.md` | https://four.htmx.org/events/#htmx:after:process | ✅ |
| `reference/03-events/16-htmx-process-type.md` | https://four.htmx.org/events/#htmx:process:type | ❓ Not in audit — verify this event exists in htmx 4 |
| `reference/03-events/17-htmx-after-implicitInheritance.md` | https://four.htmx.org/events/#htmx:after:implicitInheritance | ❓ Not in audit — verify this event exists in htmx 4 |
| `reference/03-events/18-htmx-before-history-update.md` | https://four.htmx.org/events/#htmx:before:history:update | ✅ |
| `reference/03-events/19-htmx-after-history-update.md` | https://four.htmx.org/events/#htmx:after:history:update | ✅ |
| `reference/03-events/20-htmx-after-push-into-history.md` | https://four.htmx.org/events/#htmx:after:push:into:history | ✅ |
| `reference/03-events/21-htmx-after-replace-into-history.md` | https://four.htmx.org/events/#htmx:after:replace:into:history | ✅ |
| `reference/03-events/22-htmx-before-restore-history.md` | https://four.htmx.org/events/#htmx:before:restore:history | ✅ |
| `reference/03-events/23-htmx-after-restore.md` | https://four.htmx.org/events/#htmx:after:restore | ❓ Not explicitly audited |
| `reference/03-events/24-htmx-before-viewTransition.md` | https://four.htmx.org/events/#htmx:before:viewTransition | ✅ |
| `reference/03-events/25-htmx-after-viewTransition.md` | https://four.htmx.org/events/#htmx:after:viewTransition | ✅ |
| `reference/03-events/26-htmx-before-sse-stream.md` | https://four.htmx.org/extensions/sse/#htmx:before:sse:stream | ❓ SSE extension event — verify URL |
| `reference/03-events/27-htmx-after-sse-stream.md` | https://four.htmx.org/extensions/sse/#htmx:after:sse:stream | ❓ SSE extension event — verify URL |
| `reference/03-events/28-htmx-before-sse-message.md` | https://four.htmx.org/extensions/sse/#htmx:before:sse:message | ❓ SSE extension event — verify URL |
| `reference/03-events/29-htmx-after-sse-message.md` | https://four.htmx.org/extensions/sse/#htmx:after:sse:message | ❓ SSE extension event — verify URL |
| `reference/03-events/30-htmx-before-sse-reconnect.md` | https://four.htmx.org/extensions/sse/#htmx:before:sse:reconnect | ❓ SSE extension event — verify URL |
| `reference/03-events/31-load.md` | https://four.htmx.org/attributes/hx-trigger/#load | ❓ hx-trigger special event, not an htmx: event |
| `reference/03-events/32-intersect.md` | https://four.htmx.org/attributes/hx-trigger/#intersect | ❓ hx-trigger special event, not an htmx: event |
| `reference/03-events/33-every.md` | https://four.htmx.org/attributes/hx-trigger/#every | ❓ hx-trigger special event, not an htmx: event |

---

## Config

Individual config var pages all derive from `https://four.htmx.org/reference/#config`

| Local file | Official URL | Status |
|---|---|---|
| `reference/04-config/01-htmx-config.md` | https://four.htmx.org/api/#config | ⚠️ transitions default wrong (false not true); historyReload not official; sse block not official |
| `reference/04-config/02-htmx-config-defaultSwap.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/03-htmx-config-defaultTimeout.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/04-htmx-config-extensions.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/05-htmx-config-history.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/06-htmx-config-implicitInheritance.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/07-htmx-config-includeIndicatorCSS.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/08-htmx-config-indicatorClass.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/09-htmx-config-logAll.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/10-htmx-config-mode.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/11-htmx-config-morphIgnore.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/12-htmx-config-morphSkip.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/13-htmx-config-morphSkipChildren.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/14-htmx-config-noSwap.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/15-htmx-config-prefix.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/16-htmx-config-requestClass.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/17-htmx-config-sse.md` | *(no official counterpart in htmx.config table)* | ❓ Verify: is this SSE extension config or a real htmx.config key? |
| `reference/04-config/18-htmx-config-transitions.md` | https://four.htmx.org/reference/#config | ✅ |
| `reference/04-config/19-htmx-config-version.md` | https://four.htmx.org/reference/#config | ✅ |

---

## Methods (API)

All map to `https://four.htmx.org/api/#{method-name}`

| Local file | Official URL | Status |
|---|---|---|
| `reference/05-methods/01-htmx-ajax.md` | https://four.htmx.org/api/#ajax | ⚠️ Missing: element/selector/context overloads; all context fields; Promise return |
| `reference/05-methods/02-htmx-find.md` | https://four.htmx.org/api/#find | ✅ |
| `reference/05-methods/03-htmx-findAll.md` | https://four.htmx.org/api/#findAll | ✅ |
| `reference/05-methods/04-htmx-forEvent.md` | https://four.htmx.org/api/#forEvent | ✅ |
| `reference/05-methods/05-htmx-on.md` | https://four.htmx.org/api/#on | ✅ |
| `reference/05-methods/06-htmx-onLoad.md` | https://four.htmx.org/api/#onLoad | ✅ |
| `reference/05-methods/07-htmx-parseInterval.md` | https://four.htmx.org/api/#parseInterval | ✅ |
| `reference/05-methods/08-htmx-process.md` | https://four.htmx.org/api/#process | ✅ |
| `reference/05-methods/09-htmx-registerExtension.md` | https://four.htmx.org/api/#registerExtension | ✅ |
| `reference/05-methods/10-htmx-takeClass.md` | https://four.htmx.org/api/#takeClass | ✅ |
| `reference/05-methods/11-htmx-timeout.md` | https://four.htmx.org/api/#timeout | ✅ |
| `reference/05-methods/12-htmx-trigger.md` | https://four.htmx.org/api/#trigger | ✅ |

---

## Extensions

All map to `https://four.htmx.org/extensions/{slug}/`

| Local file | Official URL | Status |
|---|---|---|
| `docs/06-extensions/02-sse.md` | https://four.htmx.org/extensions/sse/ | ✅ |
| `docs/06-extensions/03-ws.md` | https://four.htmx.org/extensions/ws/ | ⚠️ Missing: URL normalization, request_id matching, deferred triggers, auto-cleanup, socketWrapper removal note |
| `docs/06-extensions/04-head-support.md` | https://four.htmx.org/extensions/head-support/ | ✅ |
| `docs/06-extensions/05-preload.md` | https://four.htmx.org/extensions/preload/ | ⚠️ Missing: form-preload, linked-image preloading, touch events, ancestor-marking limitation |
| `docs/06-extensions/06-browser-indicator.md` | https://four.htmx.org/extensions/browser-indicator/ | ✅ |
| `docs/06-extensions/07-alpine-compat.md` | https://four.htmx.org/extensions/alpine-compat/ | ❓ Not audited |
| `docs/06-extensions/08-htmx-2-compat.md` | https://four.htmx.org/extensions/htmx-2-compat/ | ❓ Not audited |
| `docs/06-extensions/09-optimistic.md` | https://four.htmx.org/extensions/optimistic/ | ❓ Not audited |
| `docs/06-extensions/10-upsert.md` | https://four.htmx.org/extensions/upsert/ | ⚠️ Missing: hx-upsert response tags, hx-swap-oob="upsert", sort behavior for new elements only |

---

## Patterns

All map to `https://four.htmx.org/patterns/{slug}/`

| Local file | Official URL | Status |
|---|---|---|
| `patterns/01-loading/01-click-to-load.md` | https://four.htmx.org/patterns/click-to-load/ | ✅ |
| `patterns/01-loading/02-infinite-scroll.md` | https://four.htmx.org/patterns/infinite-scroll/ | ✅ |
| `patterns/01-loading/03-lazy-load.md` | https://four.htmx.org/patterns/lazy-load/ | ✅ |
| `patterns/01-loading/04-progress-bar.md` | https://four.htmx.org/patterns/progress-bar/ | ✅ |
| `patterns/02-forms/01-active-search.md` | https://four.htmx.org/patterns/active-search/ | ✅ |
| `patterns/02-forms/02-active-validation.md` | https://four.htmx.org/patterns/active-validation/ | ✅ |
| `patterns/02-forms/03-file-upload.md` | https://four.htmx.org/patterns/file-upload/ | ✅ |
| `patterns/02-forms/04-linked-selects.md` | https://four.htmx.org/patterns/linked-selects/ | ✅ |
| `patterns/02-forms/05-reset-on-submit.md` | https://four.htmx.org/patterns/reset-on-submit/ | ✅ |
| `patterns/03-records/01-bulk-actions.md` | https://four.htmx.org/patterns/bulk-actions/ | ✅ |
| `patterns/03-records/02-delete-in-place.md` | https://four.htmx.org/patterns/delete-in-place/ | ✅ |
| `patterns/03-records/03-drag-to-reorder.md` | https://four.htmx.org/patterns/drag-to-reorder/ | ✅ |
| `patterns/03-records/04-edit-in-place.md` | https://four.htmx.org/patterns/edit-in-place/ | ✅ |
| `patterns/04-display/01-animations.md` | https://four.htmx.org/patterns/animations/ | ✅ |
| `patterns/04-display/02-dialogs.md` | https://four.htmx.org/patterns/dialogs/ *(+ modals folded in)* | ✅ |
| `patterns/04-display/03-tabs.md` | https://four.htmx.org/patterns/tabs/ | ✅ |
| `patterns/05-real-time/01-bidirectional-sync.md` | *(no direct official counterpart)* | 🚫 Original content |
| `patterns/05-real-time/02-continuous-streams.md` | *(no direct official counterpart)* | 🚫 Original content |
| `patterns/05-real-time/03-one-off-streams.md` | *(no direct official counterpart)* | 🚫 Original content |
| `patterns/05-real-time/04-polling.md` | *(no direct official counterpart)* | 🚫 Original content |
| `patterns/06-advanced/01-keyboard-shortcuts.md` | https://four.htmx.org/patterns/keyboard-shortcuts/ | ✅ |
| `patterns/06-advanced/02-update-other-content.md` | https://four.htmx.org/patterns/update-other-content/ | ✅ |

---

## Docs

These pages have no strict 1:1 mapping — they represent a restructured version of the official docs.
The two exceptions with direct source material are noted.

| Local file | Closest official source | Status |
|---|---|---|
| `docs/01-get-started/01-installation.md` | https://four.htmx.org/docs/#installing | ❓ Verify nothing critical omitted |
| `docs/01-get-started/02-upgrade-guide.md` | https://four.htmx.org/migration-guide-htmx-4/ | ⚠️ Missing sections (see plan task 13) |
| `docs/02-core-concepts/01-mental-model.md` | https://four.htmx.org/docs/#introduction | 🚫 Original rewrite |
| `docs/02-core-concepts/02-hypermedia-controls.md` | https://four.htmx.org/docs/#ajax | 🚫 Original rewrite |
| `docs/02-core-concepts/03-requests-and-responses.md` | https://four.htmx.org/docs/#ajax | 🚫 Original rewrite |
| `docs/02-core-concepts/04-client-scripting.md` | https://four.htmx.org/docs/#scripting | 🚫 Original rewrite |
| `docs/02-core-concepts/05-multi-target-updates.md` | https://four.htmx.org/docs/#oob | 🚫 Original rewrite |
| `docs/03-features/01-css-transitions.md` | https://four.htmx.org/docs/#css_transitions | ❓ Verify nothing critical omitted |
| `docs/03-features/02-synchronization.md` | https://four.htmx.org/docs/#synchronization | ❓ Verify nothing critical omitted |
| `docs/03-features/03-confirmations.md` | https://four.htmx.org/docs/#confirming | ❓ Verify nothing critical omitted |
| `docs/03-features/04-boosting.md` | https://four.htmx.org/docs/#boosting | ❓ Verify nothing critical omitted |
| `docs/03-features/05-history.md` | https://four.htmx.org/docs/#history | ❓ Verify nothing critical omitted |
| `docs/03-features/06-validation.md` | https://four.htmx.org/docs/#validation | ❓ Verify nothing critical omitted |
| `docs/03-features/07-web-components.md` | https://four.htmx.org/docs/#web-components | ❓ Verify nothing critical omitted |
| `docs/03-features/08-attribute-inheritance.md` | https://four.htmx.org/docs/#inheritance | ❓ Verify nothing critical omitted |
| `docs/03-features/09-extended-selectors.md` | https://four.htmx.org/docs/#css-extensions | ❓ Verify nothing critical omitted |
| `docs/07-security/01-best-practices.md` | https://four.htmx.org/docs/#security | ❓ Verify nothing critical omitted |
| `docs/07-security/02-caching.md` | https://four.htmx.org/docs/#caching | ❓ Verify nothing critical omitted |
| `docs/08-troubleshoot/01-debugging.md` | https://four.htmx.org/docs/#debugging | ❓ Verify nothing critical omitted |
| `docs/08-troubleshoot/02-configuration.md` | *(original / no direct mapping)* | 🚫 Original content |

---

## Summary

| Status | Count |
|---|---|
| ✅ Audited OK | 64 |
| ⚠️ Incomplete (tracked in plan) | 11 |
| ❓ Not audited — needs manual review | 28 |
| 🚫 Original content — no official counterpart | 9 |
