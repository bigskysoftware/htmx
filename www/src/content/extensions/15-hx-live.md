---
title: "hx-live"
description: "Add lightweight reactivity backed by the DOM"
category: "UX"
icon: "icon-[mdi--lightning-bolt]"
keywords: ["live", "reactive", "bind", "q", "selector"]
---

Expressions live in HTML attributes. They read from the page, write to it, and re-run as it changes.

```html
<input type="text">
<p :text="'Hello, ' + q('previous input').value"></p>
```

The paragraph updates as you type.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-live.min.js"></script>
```

## Attributes

### `:<attr>`

Prefix any HTML attribute with `:` and put an expression in it. The result is written to the attribute.

```html
<input id="name">
<button :disabled="!q('#name').value">Submit</button>
```

The same shape works for any attribute:

```html
<a :href="'/users/' + q('#user-id').value">profile</a>
<button :hidden="q('.row').count === 0">Clear all</button>
<input :required="q('#mode').value === 'final'">
```

> ⚠️ **Alpine.js conflict:** The `:` short form uses the same syntax as Alpine.js (`x-bind:`). If Alpine is detected on the page at initialization time, hx-live automatically disables the `:` short form and logs a console warning. You can override this behavior by explicitly setting [`config.live.bindPrefix`](#configlivebindprefix).

How each attribute is written (booleans, ARIA, property-backed, generic) is described in [Attribute writing rules](#attribute-writing-rules).

### `hx-live:<attr>`

The full form. Behaves identically to `:<attr>`.

```html
<button hx-live:disabled="!q('#name').value">Submit</button>
```

Use it if your build pipeline strips `:`-prefixed attributes.

### `:.<class>`

Bind a single class to an expression. Truthy adds it, falsy removes it.

```html
<input type="number" value="0">
<p :.warn="q('previous input').valueAsNumber < 0">Negative balance</p>
```

### `:class`

String form: set the listed classes.

```html
<input type="number" value="0">
<div :class="q('previous input').valueAsNumber < 18 ? 'warn big' : 'ok'"></div>
```

Object form: each key is added or removed by the truthiness of its value.

```html
<input type="number" value="0">
<div :class="{
    warn: q('previous input').valueAsNumber < 18,
    ok:   q('previous input').valueAsNumber >= 18
}"></div>
```

A key may list several classes that share one condition. Quote the key when it contains spaces.

```html
<input id="strict" type="checkbox">
<div :class="{ 'warn big': q('#strict').checked }">Notice</div>
```

`:class` only manages classes it writes. Other classes set in HTML are untouched. If a class appears both statically and in the binding, the binding wins.

### `:text`

Bind the element's [`textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) to an expression.

```html
<input type="number" value="2">
<input type="number" value="3">
<p :text="q('first input').valueAsNumber * q('last input').valueAsNumber"></p>
```

Numbers and other non-strings are stringified.

### `:html`

Bind the element's [`innerHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) to an expression.

```html
<input value="world">
<div :html="`<b>${q('previous input').value}</b>`"></div>
```

Make sure to sanitize anything untrusted.

### `:style`

String form: a CSS declaration string.

```html
<input id="pct" type="range" value="50">
<div :style="`width: ${q('#pct').value}%; height: 8px; background: tomato`"></div>
```

Object form: each key sets a CSS property. Camel-case keys convert to kebab-case.

```html
<input id="pct" type="range" value="50">
<input id="color" type="color" value="#ff0000">
<div :style="{
    width: q('#pct').value + '%',
    backgroundColor: q('#color').value,
    height: '8px'
}"></div>
```

`:style` only manages properties it writes. Other inline style properties are untouched. If a property appears both statically and in the binding, the binding wins.

### `hx-live`

An escape hatch. Use it when no single `:<attr>` fits, or for multi-step logic and side effects.

```html
<input placeholder="search">
<div hx-live="
    let term = q('previous input').value;
    if (!term) { this.textContent = ''; return; }
    await debounce(250);
    this.textContent = await fetch('/search?q=' + encodeURIComponent(term))
                              .then(r => r.text());
"></div>
```

## Helpers

The helpers work inside `hx-live` expressions, inside [`hx-on`](/reference/attributes/hx-on) event handlers, and from regular JavaScript via `htmx.live.*`.

```js
htmx.live.q('.row').attr('hidden', true);
```

Inside expressions, `this` is the element, the full htmx API is available unprefixed, and `await` works at the top level (expressions are `async` functions).

```html
<button hx-on:click="
    attr('disabled', true);
    await ajax('POST', '/save');
    attr('disabled', false);
">Save</button>
```

### `q()`

`q()` returns a proxy over a set of elements. Read from the first match, write to all.

```js
q('.row')                       // every .row in the document
q('#bar')                       // single element by id
q(element)                      // wrap an existing element
q(nodeList)                     // wrap a collection

q('.row').count                 // number of matches
q('.row').arr()                 // Array<Element>
for (let e of q('.row')) {...}  // iterate

q('input').value                // value of the first match
q('input').value = ''           // assign to every match

q('.row').classList.add('done') // method calls chain through
q('.row').dataset.state = 'on'
q('button').click()
```

**Selector grammar**

```js
q('first .foo')                 // first match in document order
q('last .foo')                  // last match
q('next .foo')                  // first match after this element
q('previous .foo')              // closest match before this element
q('closest .foo')               // nearest ancestor matching .foo
q('.foo in #scope')             // restrict to a specific root
q('.foo in this')               // restrict to the current element
```

`next`, `previous`, and `closest` resolve against `this` (the element that owns the expression). They only work inside `hx-live` / `hx-on` scopes.

**Chaining** 

`.q(...)` on a proxy re-runs the grammar with each element as the anchor:

```js
q('.error').q('closest .field')   // surrounding .field of each .error
q('section').q('first .item')     // first .item per section
q('.row').q('next .row')          // each row's successor
```

For plain descendant queries, CSS is shorter: `q('.card .title')` and `q('.card').q('.title')` are equivalent. Use chaining when you need a directional per matched element.

**Built-in methods**

The helpers below also work as methods on the proxy, applying across all matched elements:

```js
q('input').attr('disabled', true)        // set attribute on all
q('.row').toggle('.selected')            // toggle class on each
q('.tab.active').take('.active', '.tab') // move a class from peers to self
q('.tab').trigger('select', { id: 1 })   // CustomEvent on each
q('.list').insert('end', '<li>new</li>') // before / after / start / end
```

### `attr(name, value?)`

Get or set an attribute, class, or property on this element. Pass one argument to read, two to write.

```js
attr('hidden')                              // is hidden present?
attr('hidden', true)                        // add (false/null/undefined removes)
attr('.active')                             // has class .active?
attr('.active', q('#src').checked)          // add/remove class
attr('class', 'foo bar')                    // multi-class string
attr('class', { active: matches('.tab') })  // multi-class object
attr('aria-expanded', matches('.open'))     // any aria-*: writes "true"/"false"
attr('value', 'hello')                      // value/checked/selected: syncs property + attribute
attr('data-x', null)                        // remove
```

### `toggle(name, values?)`

Toggle (no `values`) or cycle (with `values`) a class or attribute on this element.

```js
toggle('.active')                      // toggle class
toggle('aria-expanded')                // flip "true" ↔ "false"
toggle('hidden')                       // toggle attribute presence
toggle('data-view', 'grid|list|table') // cycle attribute through values
toggle('.size', 'sm|md|lg')            // cycle classes (only one at a time)
toggle('data-open', 'on|')             // cycle: 'on' ↔ absent
```

`values` accepts a `|`-separated string or an array.

### `take(name, scope?)`

Move a class or attribute from siblings to this element. Pass a `scope` selector to widen or restrict the source set.

```js
take('.selected', '.tab')              // become the selected tab among .tab
take('aria-current', 'nav a')          // become the current nav item
take('.active')                        // implicit scope: parent element's subtree
```

### `data`

Read or write `data-*` attributes on the closest ancestor that has them. Lets components share state up the tree.

```html
<div data-size="medium">
    <button hx-on:click="data.size = 'small'">S</button>
    <button hx-on:click="data.size = 'medium'">M</button>
    <button hx-on:click="data.size = 'large'">L</button>
    <p :text="`Size: ${data.size}`"></p>
</div>
```

`data.foo` reads from the closest `[data-foo]` ancestor. Writing assigns to that ancestor too. 

Values are automatically JSON-serialized on write and parsed on read. Booleans, numbers, arrays, and objects round-trip transparently:

```html
<div data-count="1" data-active="false" data-cart="[]">
    <input id="sku" placeholder="Product code">
    <button hx-on:click="data.cart = [...data.cart, {sku: q('#sku').value, qty: data.count}]">Add to cart</button>
    <button hx-on:click="data.count++">+</button>
    <button hx-on:click="data.count--">−</button>
    <button hx-on:click="data.active = !data.active">Toggle details</button>
    <p :text="`Qty: ${data.count} | ${data.cart.length} items in cart`"></p>
</div>
```

Plain strings that aren't valid JSON are returned as-is.

`data` is also available on `q()` proxies via `q(selector).data`. It cascades from the first matched element:

```js
q('#cart-panel').data.items              // read: JSON-parsed value from closest [data-items] ancestor
q('#cart-panel').data.items = [{id: 1}]  // write: JSON-stringified to that ancestor
```

For direct, this-only access, use `this.dataset` instead (note: `this.dataset` is always strings). For per-element writes across a set, use `q('.row').dataset.state = 'on'`.

Because `:<attr>` works on `data-*`, you can also store derived values in the DOM:

```html
<div data-first="Ada" data-last="Lovelace"
     :data-full="data.first + ' ' + data.last">
    <span :text="data.full"></span>
</div>
```

### `style`

Shorthand for `this.style`.

```html
<input type="color" value="#ff0000">
<button hx-on:click="style.setProperty('--accent', q('previous input').value)">Apply</button>
```

### `classList`

Shorthand for `this.classList`.

```html
<button hx-on:click="classList.add('shake')">Wiggle</button>
```

### `matches(selector)`

Shorthand for `this.matches(selector)`.

```html
<button :aria-busy="matches('.htmx-request')" hx-post="/save">Save</button>
```

### `trigger(type, detail?, bubbles?)`

Dispatch a `CustomEvent` from this element.

```html
<li hx-on:click="trigger('select', { id: this.dataset.id })" data-id="42">Item</li>
```

### `insert(position, html)`

Insert an HTML string. Wraps [`insertAdjacentHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML) with friendlier position names: `before` and `after` for siblings, `start` and `end` for children.

```js
insert('start',  '<li>first</li>')   // first child
insert('end',    '<li>last</li>')    // last child
insert('before', '<hr>')             // sibling before
insert('after',  '<hr>')             // sibling after
```

```html
<ul hx-on:click="insert('end', '<li>+</li>')">Click to add a row</ul>
```

Sanitize anything untrusted.

### `debounce(ms)`

Wait `ms` milliseconds. If called again on the same element before resolving, the previous call is cancelled.

```html
<input placeholder="search">
<div hx-live="
    await debounce(200);
    this.textContent = await fetch('/q?term=' + q('previous input').value).then(r => r.text());
"></div>
```

Each element has its own channel.

### `forEvent(...args)`

Resolve on the next matching event. Mix event names, milliseconds, intervals, and target elements. First to fire wins.

```js
await forEvent('click')                 // next click on this element
await forEvent('click', 1000)           // click OR 1s timeout
await forEvent('a', 'b', '5s')          // any number of events / intervals
```

Typical use: wait for a CSS transition to finish, with a safety timeout.

```html
<button hx-on:click="
    classList.add('fade-out');
    await forEvent('transitionend', 500);
    this.remove();
">Dismiss</button>
```

### `nextFrame()`

Resolve on the next animation frame.

```html
<button hx-on:click="
    classList.remove('shake');
    await nextFrame();
    classList.add('shake');
">Replay shake</button>
```

## ARIA as state

ARIA attributes serve two purposes: they describe the component to assistive tech, and they hold UI state.

Bind them with `:aria-*` and drive CSS off the same attribute. You avoid `.is-open`, `.active`, and `.loading` classes.

| Attribute       | Meaning             | Typical UI use                        |
|-----------------|---------------------|---------------------------------------|
| `aria-expanded` | "is open"           | Disclosure, menu, accordion           |
| `aria-selected` | "is the active one" | Tabs, listbox option                  |
| `aria-pressed`  | "toggle is on"      | Toggle button (bold, mute)            |
| `aria-checked`  | "checkbox state"    | Custom checkboxes, radios             |
| `aria-busy`     | "is loading"        | Form during submit, list during fetch |
| `aria-disabled` | "can't interact"    | Greyed-out non-button control         |
| `aria-current`  | "the current one"   | Nav item, breadcrumb, step            |
| `aria-hidden`   | "hidden from a11y"  | Decorative content                    |

**Disclosure.**

For a single inline section, native [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/details) is the right tool. Use `aria-expanded` when the trigger and target are separated in the DOM.

```html
<header>
    <button hx-on:click="toggle('aria-expanded')" aria-expanded="false">Menu</button>
</header>
<aside :hidden="!q('header button').attr('aria-expanded')">...</aside>
```

**Toggle button.**

```html
<button hx-on:click="toggle('aria-pressed')" aria-pressed="false">Bold</button>
```

```css
[aria-pressed="true"] { background: lightblue }
```

**Tabs.**

```html
<div role="tablist">
    <button role="tab" hx-on:click="take('aria-selected', '[role=tab]')" aria-selected="true">A</button>
    <button role="tab" hx-on:click="take('aria-selected', '[role=tab]')">B</button>
    <button role="tab" hx-on:click="take('aria-selected', '[role=tab]')">C</button>
</div>
```

`take('aria-selected', '[role=tab]')` writes `"false"` on every `[role=tab]`, then `"true"` on this one.

**Loading state.**

```html
<form :aria-busy="matches('.htmx-request')" hx-post="/save">
    <input name="email">
    <button type="submit">Save</button>
</form>
```

```css
[aria-busy="true"] { opacity: 0.5; pointer-events: none }
```

**Non-boolean ARIA.** Strings pass through, so `aria-current="page"`, `aria-pressed="mixed"`, and numeric ARIA (`aria-valuenow="50"`) work in the simple form:

```html
<a :aria-current="location.pathname === '/home' ? 'page' : false" href="/home">Home</a>
<button :aria-pressed="state.bold ? 'mixed' : !!state.bold">Bold</button>
<div role="slider" :aria-valuenow="q('#slider').valueAsNumber"></div>
```

## How it works

### Re-run triggers

A single document-wide `MutationObserver` and `input` / `change` listeners trigger a recompute of every live expression. Any of these schedule one:

- DOM additions, removals, attribute changes, text changes
- `input` or `change` events from any control
- completion of an htmx swap (recomputes pause mid-swap, run once at the end)

All expressions run in a single microtask, so multiple synchronous mutations coalesce into one recompute.

### Self-mutation is safe

When an expression writes to the DOM, the observer drains its own pending records inside the same microtask. Writes made by `hx-live` cannot trigger a feedback loop.

### Runaway cap

If recomputes exceed 50/sec, the extension logs a warning. Bindings continue running. Tune your expression or add `debounce`.

### Coordinating with htmx swaps

Recomputes are deferred between [`htmx:before:swap`](/reference/events/htmx-before-swap) and [`htmx:swap:finally`](/reference/events/htmx-swap-finally). One consolidated recompute runs when the swap finishes, regardless of how much markup changed.

### Cleanup

When an `hx-live` element is removed, its expression drops out on the next scheduled run. When all expressions are gone, the observer and listeners detach.

[`hx-ignore`](/reference/attributes/hx-ignore) descendants are not registered.

### Boolean, ARIA, and other attribute kinds

[`:<attr>`](#attr) writes the value differently depending on the attribute, following HTML conventions.

**Boolean attributes** (`disabled`, `hidden`, `required`, `open`, `readonly`, `inert`, ...). Truthy adds the attribute; falsy removes it.

```html
<button  :disabled="truthyExpr">   <!-- <button disabled="">  -->
<button  :disabled="falsyExpr">    <!-- <button>              -->
<div     :hidden="truthyExpr">     <!-- <div hidden="">       -->
<div     :hidden="falsyExpr">      <!-- <div>                 -->
<input   :required="truthyExpr">   <!-- <input required="">   -->
<input   :required="falsyExpr">    <!-- <input>               -->
<details :open="truthyExpr">       <!-- <details open="">     -->
<details :open="falsyExpr">        <!-- <details>             -->
<input   :readonly="truthyExpr">   <!-- <input readonly="">   -->
<input   :readonly="falsyExpr">    <!-- <input>               -->
<div     :inert="truthyExpr">      <!-- <div inert="">        -->
<div     :inert="falsyExpr">       <!-- <div>                 -->
```

**ARIA attributes** (`aria-*`). Strings and numbers pass through (`"mixed"`, `"page"`, `50`). Other values coerce to `"true"` or `"false"` per the [WAI-ARIA spec](https://www.w3.org/TR/wai-aria-1.2/). Never removed.

```html
<button :aria-expanded="truthyExpr">    <!-- <button aria-expanded="true">  -->
<button :aria-expanded="falsyExpr">     <!-- <button aria-expanded="false"> -->
<button :aria-pressed="'mixed'">        <!-- <button aria-pressed="mixed">  -->
```

**Stringy enumerated attributes** (`contenteditable`, `draggable`, `spellcheck`). Stringify the value. Accepts strings beyond `true`/`false` for attributes that support them.

```html
<div :contenteditable="true">                <!-- <div contenteditable="true">           -->
<div :contenteditable="false">               <!-- <div contenteditable="false">          -->
<div :contenteditable="'plaintext-only'">    <!-- <div contenteditable="plaintext-only"> -->
```

**Property-backed attributes** (`checked`, `value`, `selected`). Sync both the DOM property and the HTML attribute.

```html
<input type="checkbox" :checked="true">     <!-- .checked = true,  checked=""        -->
<input type="checkbox" :checked="false">    <!-- .checked = false, attribute removed -->
<input :value="'hello'">                    <!-- .value = "hello", value="hello"     -->
```

**Anything else.** Stringify the value. `null`, `undefined`, or `false` remove the attribute.

```html
<a :href="'/profile'">    <!-- <a href="/profile"> -->
<a :href="null">          <!-- <a>                 -->
<a :href="false">         <!-- <a>                 -->
<a :href="''">            <!-- <a href="">         -->
```

## Public API

All [helpers](#helpers) are exposed under `htmx.live.*` for use from regular JavaScript (outside `hx-live` / `hx-on` expressions):

```js
htmx.live.q('.row')
htmx.live.attr('.row', 'hidden', true)
htmx.live.take('.tab.active', '.active', '.tab')
```

`htmx.live.refresh()` forces a recompute. Use it when an expression reads from a source the observer cannot see (a JS variable, a getter, an external store) and you've just mutated it.

```js
window.appState = 'loading';
htmx.live.refresh();
```

Selector directionals (`next`, `previous`, `closest`) need an anchor and only work inside `hx-live` / `hx-on`, not from `htmx.live.q`.

## Configuration

### `config.live.bindPrefix`

Controls the short-form prefix for binding attributes. Defaults to `':'` (or disabled automatically if Alpine.js is detected).

| Value | Effect | Example attribute |
|-------|--------|-------------------|
| undefined (default) | `:attr` enabled, unless Alpine detected | `:hidden`, `:text`, `:.active` |
| `':'` | `:attr` short form forced on | `:hidden`, `:text`, `:.active` |
| `''` or falsy | Short form disabled, only `hx-live:attr` works | `hx-live:hidden` |
| `'hx:'` | Custom prefix | `hx:hidden`, `hx:text`, `hx:.active` |

The long form `hx-live:<attr>` always works regardless of this setting.

**Alpine.js auto-detection**

If `window.Alpine` exists when hx-live initializes and no `bindPrefix` is configured, the `:` short form is automatically disabled and a console warning is logged. To resolve:

- Use the long form `hx-live:<attr>` (always works)
- Or explicitly set a non-conflicting prefix:

```html
<!-- Use hx: as short form instead -->
<meta name="htmx-config" content='{"live":{"bindPrefix":"hx:"}}'>
```

- Or force `:` if you know what you're doing:

```html
<meta name="htmx-config" content='{"live":{"bindPrefix":":"}}'>
```

**Manually disabling the short form**

If Alpine loads after hx-live (or you want to be explicit), disable it yourself:

```html
<meta name="htmx-config" content='{"live":{"bindPrefix":""}}'>
```

With `bindPrefix: ''`, use the canonical long form:

```html
<!-- Alpine handles :class, hx-live handles hx-live:text -->
<p :class="alpineVar" hx-live:text="q('#name').value"></p>
```

With `bindPrefix: 'hx:'`:

```html
<!-- Alpine handles :class, hx-live handles hx:text -->
<p :class="alpineVar" hx:text="q('#name').value"></p>
```

## Notes

- Expressions run on any DOM mutation. There is no per-variable tracking. The microtask coalescing keeps this cheap, but expensive expressions should `debounce` or guard themselves.
- The DOM is the source of truth. To share state between expressions, use ARIA attributes, `data-*` attributes (the `data` proxy makes this ergonomic), or hidden inputs.
- When using morph swap styles (`innerMorph` / `outerMorph`), server responses will overwrite `data-*` attributes by default. To preserve client-side state during morphs, add a prefix to `morphIgnore` — e.g. `morphIgnore:["data-"]` will protect all `data-*` attributes from being overwritten. Non-morph swaps (`innerHTML`, `outerHTML`) replace the DOM entirely, so state should live on an ancestor element that isn't swapped.
- Expressions must be safe to run repeatedly. Avoid unconditional `fetch()` calls. Use `debounce` or guard on a value change.
- If your build pipeline strips `:`-prefixed attributes, use the canonical `hx-live:<attr>` form instead. Behavior is identical.
- If using Alpine.js on the same page, hx-live auto-detects it and disables the `:` short form. See [Configuration](#configuration) for details.

## See also

- [`hx-on`](/reference/attributes/hx-on) (attribute)
- [Locality of Behaviour](/essays/locality-of-behaviour) (essay)
