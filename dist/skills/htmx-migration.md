---
name: htmx-migration
description: Use when migrating a web application from React, Vue, Angular, or other SPA frameworks to htmx, or when converting client-side rendered components to server-rendered htmx patterns. Also covers htmx 2 to htmx 4 migration.
argument-hint: "[framework name or component to migrate]"
---

# Migrating to htmx

## SPA to htmx: The Core Shift

htmx returns to the original web architecture:
- **Server renders HTML**, browser displays it
- **State lives on the server**, not in the browser
- **No build step**, no virtual DOM, no component lifecycle
- Server returns **HTML fragments**, not JSON
- The server framework matters more than the frontend

## Conceptual Mapping

| SPA Concept | htmx Equivalent |
|---|---|
| Component state (`useState`, reactive data) | Server-side session/database state |
| Client-side routing (React Router, Vue Router) | Server routes + `hx-boost` or `hx-push-url` |
| API calls (`fetch`/`axios` to JSON endpoints) | `hx-get`/`hx-post` returning HTML fragments |
| Virtual DOM diffing | `innerMorph`/`outerMorph` swap styles |
| Component re-rendering | Server re-renders HTML fragment, htmx swaps it in |
| Props drilling | Server templates have access to all data |
| Global state (Redux, Vuex, Pinia) | Server-side state (session, database) |
| Client-side form validation | Server-side validation + `hx-status:422` |
| Loading spinners | `hx-indicator` + `htmx-indicator` class |
| Event bus | `HX-Trigger` response header + `hx-trigger="eventName from:body"` |
| Conditional rendering (`v-if`, `{cond && ...}`) | Server sends different HTML based on state |
| List rendering (`v-for`, `.map()`) | Server renders the list; use morph/OOB for updates |
| Lifecycle hooks (`useEffect`, `onMounted`) | `htmx:after:init`, `htmx:after:swap`, or `htmx.onLoad()` |
| Code splitting / lazy loading | `hx-trigger="load"` or `hx-trigger="revealed"` |
| Optimistic updates | `hx-optimistic` attribute (with extension) |

## Step-by-Step Migration Strategy

1. **Identify your server stack** -- htmx needs a server that renders HTML. Any backend works: Django, Rails, Express, Laravel, Spring Boot, Go, ASP.NET, etc.

2. **Identify your JSON API endpoints** -- these need HTML-returning variants. You can:
   - Create new HTML endpoints alongside existing JSON ones
   - Check for `HX-Request` header to return HTML vs JSON from the same endpoint
   - Use `HX-Request-Type` header to distinguish partial (`"partial"`) vs full page (`"full"`) requests

3. **Convert one component at a time** -- replace the SPA component with:
   - Server-rendered HTML + htmx attributes
   - A server endpoint that returns an HTML fragment

4. **Handle interactivity with htmx patterns:**
   - Search → `hx-get` with `hx-trigger="input changed delay:500ms"`
   - Modals → `hx-get` to load modal content, `hx-target` to place it
   - Tabs → `hx-get` per tab with `hx-push-url`
   - Infinite scroll → `hx-trigger="revealed"` with `hx-swap="afterend"`
   - Forms → `hx-post` with `hx-status:422` for validation errors

5. **For multi-region updates**, use one of:
   - Expand the target (wrap both regions)
   - `<hx-partial>` tags in the response
   - `hx-swap-oob` for ID-based replacement
   - `HX-Trigger` header + event-driven refresh

6. **Progressive enhancement** -- with `hx-boost`, links and forms work without JavaScript too

## React Migration Patterns

### useState + render → server endpoint + htmx

**React:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

**htmx:**
```html
<button hx-post="/counter/increment" hx-swap="outerHTML">Count: 0</button>
```

Server returns: `<button hx-post="/counter/increment" hx-swap="outerHTML">Count: 1</button>`

### useEffect for data fetching → hx-trigger="load"

**React:**
```jsx
function UserProfile({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch(`/api/users/${id}`).then(r => r.json()).then(setUser); }, [id]);
  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}
```

**htmx:**
```html
<div hx-get="/users/123" hx-trigger="load" hx-swap="innerHTML">
  Loading...
</div>
```

### React Router → hx-boost

**React:**
```jsx
<Link to="/about">About</Link>
<Route path="/about" component={About} />
```

**htmx:**
```html
<div hx-boost:inherited="true">
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</div>
```

Server returns full page content; htmx swaps just the body.

### Form with validation → hx-post + hx-status:422

**React:**
```jsx
const [errors, setErrors] = useState({});
const handleSubmit = async (e) => {
  const res = await fetch('/api/register', { method: 'POST', body: formData });
  if (!res.ok) setErrors(await res.json());
};
```

**htmx:**
```html
<form hx-post="/register" hx-target="#result" hx-status:422="target:#errors">
  <input name="email" type="email">
  <div id="errors"></div>
  <div id="result"></div>
  <button type="submit">Register</button>
</form>
```

Server returns 422 with error HTML, or 200 with success HTML.

## Vue Migration Patterns

### v-model → standard HTML form inputs

State stays on the server. Form submission sends the data.

### v-if / v-show → server conditional rendering

Server decides what HTML to return based on state. No client-side conditionals needed.

### v-for → server loop rendering

Server renders the list. For updates, use `innerMorph` to preserve DOM state, or `hx-swap-oob` to update specific items.

### Vuex/Pinia → server state

All application state lives on the server. No client-side state store needed.

## Angular Migration Patterns

### Services → server-side services

Business logic moves to the server. htmx endpoints call server services directly.

### RxJS observables → SSE extension or polling

```html
<!-- Polling -->
<div hx-get="/updates" hx-trigger="every 5s">...</div>

<!-- SSE (with extension) -->
<div hx-sse:connect="/events" hx-sse:swap="message">...</div>
```

### Angular forms → HTML forms + server validation

Standard `<form>` with `hx-post`. Validation happens server-side.

### Angular routing → hx-boost + hx-push-url

Same pattern as React Router migration above.

## Server-Side Endpoint Pattern

The key to any migration -- your endpoints must return HTML:

```
# Detect htmx request
if request.headers["HX-Request"]:
    # Return just the HTML fragment
    return render_template("_partial.html", data=data)
else:
    # Return full page (for direct navigation, SEO, etc.)
    return render_template("full_page.html", data=data)
```

For validation errors, return status 422 with error HTML.
For no-content responses, return 204.
For redirects after form submission, use `HX-Redirect` header instead of HTTP 302.

---

# htmx 2 to htmx 4 Migration

## Quick Fix: Two Config Changes

These two settings make most htmx 2 apps work in htmx 4:

```html
<meta name="htmx-config" content='{
  "implicitInheritance": true,
  "noSwap": [204, 304, "4xx", "5xx"]
}'>
```

- `implicitInheritance: true` restores automatic attribute inheritance
- `noSwap` with 4xx/5xx restores htmx 2 swap behavior (only swap 2xx)

## Attribute Changes

### Renamed

| htmx 2 | htmx 4 | Notes |
|---------|---------|-------|
| `hx-disabled-elt` | `hx-disable` | **IMPORTANT:** First rename old `hx-disable` → `hx-ignore`, then `hx-disabled-elt` → `hx-disable` |

### Removed

| Removed | htmx 4 Alternative |
|---------|---------------------|
| `hx-vars` | `hx-vals` with `js:` prefix |
| `hx-params` | `htmx:config:request` event to filter parameters |
| `hx-prompt` | `hx-confirm` with `js:` prefix |
| `hx-ext` | Load extensions via `<script>` + `<meta name="htmx-config" content='{"extensions":"..."}'>` |
| `hx-disinherit` | Not needed (inheritance is explicit by default) |
| `hx-inherit` | Not needed (inheritance is explicit by default) |
| `hx-request` | `hx-config` |
| `hx-history` | Removed (no localStorage history) |
| `hx-history-elt` | Removed |

### Inheritance

Add `:inherited` modifier to parent attributes:

```html
<!-- htmx 2 -->
<div hx-target="#output">...</div>

<!-- htmx 4 -->
<div hx-target:inherited="#output">...</div>
```

### GET/DELETE form data

GET and DELETE no longer include enclosing form data. Add `hx-include="closest form"` if needed.

### OOB swap order

In htmx 4, main content swaps FIRST, then OOB/partial elements. (Reversed from htmx 2.)

## Config Changes

### Renamed

| htmx 2 | htmx 4 |
|---------|---------|
| `defaultSwapStyle` | `defaultSwap` |
| `globalViewTransitions` | `transitions` |
| `historyEnabled` | `history` |
| `includeIndicatorStyles` | `includeIndicatorCSS` |
| `timeout` | `defaultTimeout` |

### Changed Defaults

| Config | htmx 2 | htmx 4 |
|--------|--------|--------|
| `defaultTimeout` | `0` (no timeout) | `60000` (60s) |
| `defaultSettleDelay` | `20` | `1` |

### `data-hx-*` prefix

Only `hx-*` recognized by default. For `data-hx-*`: set `htmx.config.prefix = "data-hx-"`.

## Event Name Changes

htmx 4 naming: `htmx:phase:action`

| htmx 2 | htmx 4 |
|---------|---------|
| `htmx:beforeRequest` | `htmx:before:request` |
| `htmx:afterRequest` | `htmx:after:request` |
| `htmx:beforeSwap` | `htmx:before:swap` |
| `htmx:afterSwap` | `htmx:after:swap` |
| `htmx:afterSettle` | `htmx:after:swap` |
| `htmx:configRequest` | `htmx:config:request` |
| `htmx:beforeOnLoad` | `htmx:before:init` |
| `htmx:afterOnLoad` | `htmx:after:init` |
| `htmx:afterProcessNode` | `htmx:after:init` |
| `htmx:beforeProcessNode` | `htmx:before:process` |
| `htmx:load` | `htmx:after:init` |
| `htmx:beforeCleanupElement` | `htmx:before:cleanup` |
| `htmx:beforeHistorySave` | `htmx:before:history:update` |
| `htmx:beforeHistoryUpdate` | `htmx:before:history:update` |
| `htmx:pushedIntoHistory` | `htmx:after:push:into:history` |
| `htmx:replacedInHistory` | `htmx:after:replace:into:history` |
| `htmx:beforeTransition` | `htmx:before:viewTransition` |
| `htmx:beforeSend` | `htmx:before:request` |
| `htmx:historyRestore` | `htmx:before:restore:history` |
| `htmx:responseError` | `htmx:error` |
| `htmx:sendError` | `htmx:error` |
| `htmx:sendAbort` | `htmx:error` |
| `htmx:swapError` | `htmx:error` |
| `htmx:targetError` | `htmx:error` |
| `htmx:timeout` | `htmx:error` |

## HTTP Header Changes

### Request Headers

| htmx 2 | htmx 4 | Notes |
|---------|---------|-------|
| `HX-Trigger` | `HX-Source` | Format changed: `tagName#id` (not just ID) |
| `HX-Trigger-Name` | _Removed_ | Use `HX-Source` |
| `HX-Target` | `HX-Target` | Format changed: `tagName#id` |
| `HX-Prompt` | _Removed_ | Use `hx-confirm` with `js:` prefix |
| _(new)_ | `HX-Request-Type` | `"partial"` or `"full"` |

### Response Headers

| htmx 2 | htmx 4 |
|---------|---------|
| `HX-Trigger-After-Swap` | _Removed_ (use `HX-Trigger`) |
| `HX-Trigger-After-Settle` | _Removed_ (use `HX-Trigger`) |

## JavaScript API Changes

### Removed (use native equivalents)

| Removed | Use Instead |
|---------|-------------|
| `htmx.addClass()` | `element.classList.add()` |
| `htmx.removeClass()` | `element.classList.remove()` |
| `htmx.toggleClass()` | `element.classList.toggle()` |
| `htmx.closest()` | `element.closest()` |
| `htmx.remove()` | `element.remove()` |
| `htmx.off()` | `removeEventListener()` |
| `htmx.values()` | `new FormData(form)` |
| `htmx.defineExtension()` | `htmx.registerExtension()` |
| `htmx.logAll()` | `htmx.config.logAll = true` |
| `htmx.logNone()` | `htmx.config.logAll = false` |

## Extension Changes

Extensions no longer use `hx-ext` attribute. Load via script + config:

```html
<!-- htmx 2 -->
<div hx-ext="sse">...</div>

<!-- htmx 4 -->
<script src="/ext/hx-sse.js"></script>
<meta name="htmx-config" content='{"extensions": "sse"}'>
```

Custom extensions need a full rewrite: `defineExtension()` → `registerExtension()`, callback-based → event-based hooks.

## Compatibility Extension

For gradual migration, load the `htmx-2-compat` extension which bridges old event names and patterns:

```html
<script src="/ext/htmx-2-compat.js"></script>
```

## Instructions for Claude

When helping with migrations:

1. **Ask about the server framework** -- htmx needs a server that returns HTML
2. **For SPA→htmx:** convert one component at a time, don't try to migrate everything at once
3. **For htmx 2→4:** suggest the two-line config fix first, then incrementally update attributes/events
4. **Show both HTML and server response** for each pattern
5. **Search for htmx 2 patterns** (camelCase events, `hx-ext`, `hx-vars`, etc.) and provide htmx 4 equivalents
6. **Suggest the compat extension** as a bridge for large htmx 2 codebases
7. **Preserve existing URL structure** where possible
