---
title: "hx-live"
description: "Add reactive expressions and a compact q() selector helper"
category: "UX"
icon: "icon-[mdi--lightning-bolt]"
keywords: ["live", "reactive", "q", "selector", "hyperscript"]
---

The `hx-live` extension adds a small reactive scripting layer to htmx, inspired by [\_hyperscript](https://hyperscript.org). It introduces:

* an `hx-live` attribute that holds a JavaScript expression which automatically re-runs whenever the DOM changes, and
* a compact `q()` helper for selecting and manipulating elements, available both inside `hx-live` expressions and inside [`hx-on`](/reference/attributes/hx-on) handlers.

The goal is to cover the common "glue" cases — derived values, simple bindings, class juggling, conditional UI — without pulling in a full reactive framework.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-live.min.js"></script>

<body hx-ext="hx-live">
    ...
</body>
```

## The `hx-live` Attribute

Put a JavaScript expression in `hx-live`. It runs once when the element is processed, and again whenever any input/change event or DOM mutation occurs.

```html
<input id="name" value="world">
<output hx-live="this.textContent = 'hello, ' + q('#name').value"></output>
```

Inside the expression:

* `this` is the element.
* `q(...)` selects elements (see below).
* `wait`, `trigger`, and `debounce` are also injected (see below).
* The full htmx public API (`htmx.ajax`, `htmx.find`, etc.) is available unprefixed.

### How re-runs are triggered

The extension installs a single document-wide `MutationObserver` and listens for `input` and `change` events. Any of these schedule a recompute of all live expressions:

* DOM additions, removals, attribute changes, text changes anywhere in the document
* an `input` or `change` event from any control
* the completion of an htmx swap (recomputes are paused mid-swap and run once at the end)

All `hx-live` expressions on the page run on the same microtask, so multiple synchronous mutations coalesce into a single recompute.

If a live expression itself causes more than 50 recomputes per second, the extension assumes a self-mutating expression, logs a warning, and deactivates. Read or write more deliberately if you hit this — usually it means the expression is writing the same value on every run and tripping the mutation observer.

### Coordinating with htmx swaps

While an htmx swap is in progress (between [`htmx:before:swap`](/reference/events/htmx-before-swap) and [`htmx:swap:finally`](/reference/events/htmx-swap-finally)), recomputes are deferred. When the swap finishes, a single consolidated recompute runs. This means you can rely on `hx-live` expressions to see the post-swap DOM and run exactly once per swap, regardless of how much markup changed.

### Cleanup

When an `hx-live` element is removed from the document, its expression is dropped from the active set on its next scheduled run. When the active set becomes empty, the mutation observer and event listeners are disconnected.

[`hx-ignore`](/reference/attributes/hx-ignore) is honored: descendants of `hx-ignore` are not registered.

## The `q()` Helper

`q()` returns a thin proxy over a set of elements. It is exposed both as a global (`htmx.live.q`) and inside the scope of `hx-live` and [`hx-on`](/reference/attributes/hx-on) expressions.

### Selecting

```js
q('.foo')             // every .foo in the document
q('#bar')             // a single element by id
q(elt)                // wrap an existing element
q(nodeListOrArray)    // wrap a collection
```

### Selector grammar

`q()` accepts a small selector grammar on top of CSS:

```js
q('first .foo')       // first match
q('last .foo')        // last match
q('next .foo')        // first match that follows the current element
q('prev .foo')        // closest match preceding the current element
q('closest .foo')     // nearest ancestor matching .foo
q('.foo in #scope')   // restrict to a specific root
q('.foo in this')     // restrict to the current element
```

`next`, `prev`, and `closest` are relative to the element that owns the expression — i.e. `this` in `hx-live`/`hx-on`. They are only meaningful from inside an element-scoped expression; using them from the global `htmx.live.q` is undefined (there is no anchor element to resolve from).

### Reading and writing

```js
q('.row').count                 // number of matched elements
q('.row').arr()                 // a real Array<Element>
for (let e of q('.row')) {...}  // iterate

q('input').value                // value of the first match
q('input').value = ''           // assign to every match
```

Property access and method calls chain through the proxy:

```js
q('.row').classList.add('done')
q('.row').dataset.state = 'on'
q('button').click()
```

When you read a property, the proxy returns the value from the **first** element. When you assign, it writes to **every** element.

### Chaining

Calling `.q(...)` on a proxy runs the same selector grammar again, with each matched element acting as both the anchor for directionals and the root for plain selectors. Results are flattened and deduplicated.

```js
q('.error').q('closest .field')   // for each .error, the surrounding .field
q('section').q('first .item')     // the first .item inside each section
q('section').q('last .item')      // the last .item inside each section
q('.row').q('next .row')          // each row's successor
```

For pure descendant queries plain CSS is shorter (`q('.card .title')` and `q('.card').q('.title')` are equivalent). The reason to chain is when you need a directional **per matched element** — particularly `closest`, which plain CSS can't express cleanly.

### Built-in shortcuts

A few common operations are first-class to keep call sites short:

```js
q('.tab').trigger('select', { id: 1 })  // CustomEvent on each element
q('.list').insert('end', '<li>new</li>')  // before / after / start / end
q('.tab.selected').take('selected', '.tab')  // move a class from peers to self
```

`take(class, from)` removes `class` from every element matching `from`, then adds it to the elements in the proxy. This is the standard "tab selected" / "active filter" pattern.

## Scope Helpers

Inside `hx-live` (and [`hx-on`](/reference/attributes/hx-on)) expressions, several helpers are injected, bound to the current element where context applies. Each delegates to its `htmx.*` equivalent, so the same primitives are usable from regular JavaScript.

```js
timeout(250)                    // resolves after 250ms (htmx.timeout)
timeout('500ms')                // string interval also accepted

forEvent('click')               // resolves on next 'click' on this element with the Event
forEvent('click', 1000)         // whichever happens first — event or timeout;
                                // result is the Event (event won) or 1000 (timeout won)
forEvent('a', 'b', '5s')        // any number of events and timeouts; first to fire wins

nextFrame()                     // resolves on the next animation frame

trigger('myEvent', { x: 1 })    // dispatches a CustomEvent from this element

debounce(200)                   // resolves in 200ms; if called again before then,
                                // the previous call rejects

take('selected', '.tab')        // this element takes 'selected' from every .tab;
                                // shorthand for q(this).take('selected', '.tab')
```

`take(class, from)` is the same operation as the proxy method, with the current element as the implicit target — the natural form for `hx-on:click` handlers. Outside an expression scope, use `htmx.live.q(target).take(class, from)`.

`hx-live` bodies are evaluated as the body of an `async` function, so you can use `await` at the top level — no need to wrap in `(async () => { ... })()`:

```html
<output hx-live="
    await debounce(200);
    this.textContent = await fetch('/q?term=' + q('#search').value).then(r => r.text());
"></output>
```

`debounce` is per-element, so successive recomputes of the same `hx-live` block supersede earlier in-flight calls — exactly what you want for live search.

## Examples

### Derived value

```html
<input id="price" value="10">
<input id="qty"   value="3">
<output hx-live="this.textContent = q('#price').valueAsNumber * q('#qty').valueAsNumber">
</output>
```

### Conditional class

```html
<input id="age" type="number" value="0">
<p hx-live="this.classList.toggle('warn', q('#age').valueAsNumber < 18)">
    Adult content
</p>
```

### Live filter

```html
<input id="filter" placeholder="filter…">
<ul>
    <li>apple</li><li>apricot</li><li>banana</li>
</ul>
<div hx-live="
    let f = q('#filter').value.toLowerCase();
    for (let li of q('li')) li.hidden = !li.textContent.toLowerCase().includes(f);
"></div>
```

### Tab selection (inside `hx-on`)

```html
<nav>
    <button hx-on:click="take('selected', 'button in closest nav')">A</button>
    <button hx-on:click="take('selected', 'button in closest nav')">B</button>
    <button hx-on:click="take('selected', 'button in closest nav')">C</button>
</nav>
```

### Debounced live search

```html
<input id="q" placeholder="search">
<output hx-live="
    let term = q('#q').value;
    if (!term) { this.textContent = ''; return; }
    await debounce(250);
    this.textContent = await fetch('/search?q=' + encodeURIComponent(term))
                              .then(r => r.text());
"></output>
```

## Public API

`htmx.live.q` is exposed for use outside of `hx-live`/`hx-on`:

```js
htmx.live.q('.row').classList.add('loaded');
```

The selector directionals (`next`, `prev`, `closest`) need an anchor element to resolve from, so they are only meaningful inside `hx-live`/`hx-on` expressions, not from the global `htmx.live.q`.

## Notes

* Live expressions run on **any** DOM mutation — the system intentionally does not do per-variable dependency tracking. The microtask coalescing keeps this cheap, but expensive expressions should opt into `debounce` or guard themselves.
* There is no JavaScript-variable reactivity. The DOM is the source of truth: read from the DOM, write to the DOM. To "share state" between expressions, use `data-*` attributes or hidden inputs.
* `hx-live` requires the expression to be safe to run repeatedly. Avoid side effects that aren't idempotent (e.g. unconditional `fetch()` calls) — use `debounce` or guard on a value change.