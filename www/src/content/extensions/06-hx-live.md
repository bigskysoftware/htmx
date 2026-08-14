---
title: "hx-live"
description: "Add reactive bindings to HTML"
category: "UX"
icon: "icon-[mdi--lightning-bolt]"
keywords: ["live", "reactive", "bind", "q", "selector"]
---

The `hx-live` extension binds DOM state with inline expressions.

## Mental Model

```text
Can HTML provide the behavior?
├─ yes → use HTML
└─ no
   Can CSS derive the presentation?
   ├─ yes → use HTML + CSS
   └─ no  → use hx-live
```

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-live.min.js"></script>
```

## Usage

### Bind an Attribute

Prefix an attribute with `:`:

```html
<input value="Ada">

<output :text="'Hello, ' + q('previous input').value"></output>
<button :disabled="!q('previous input').value">Continue</button>
```

```text
Ada    → Hello, Ada  → Continue enabled
empty  → Hello,      → Continue disabled
```

See [Attributes](#attributes) for every binding target.

### Find Elements

Use `q()` to reach DOM state outside the current element:

```js
q('previous input')  // nearby
q('#name')           // by ID
q('.item')           // every match
q('closest .field')  // nearest matching ancestor
```

Reads use the first match. Writes update every match:

```js
q('.item').aria.busy = true
```

See [`q()`](#q) for its full selector grammar.

### Handle an Event

Use [`hx-on`](/reference/attributes/hx-on) to change state after an event:

```html tab="HTML"
<button aria-pressed="false"
        hx-on:click="aria.pressed = !aria.pressed">
  Mute
</button>
```

```css tab="CSS"
[aria-pressed="true"] {
  background: var(--selected);
}
```

### Share State

Put shared state on the nearest common ancestor:

```html
<section data-count="0">
  <button hx-on:click="data.count++">Add</button>
  <output :text="data.count"></output>
</section>
```

When the next value depends on the current value:

```js
data.items = items => [...items, next]
```

See [`data`](#data) for typed values, owner lookup, and functional assignments.

### Run Async Code

A server response can own its transient behavior.

Request:

```html
<form hx-post="/profile"
      hx-target="#status"
      hx-swap="outerHTML">
  <input name="name">
  <button>Save</button>
</form>

<output id="status"></output>
```

Response:

```html tab="HTML"
<output id="status"
        class="notice"
        hx-on:load="
          await timeout('3s')
          class.leaving = true
          await forEvent('transitionend', 500)
          this.remove()
        ">
  Saved
</output>
```

```css tab="CSS"
.notice {
  transition: opacity 200ms;
}

.notice.leaving {
  opacity: 0;
}
```

[`timeout()`](/reference/methods/htmx-timeout) waits before the transition. [`forEvent()`](#foreventargs) waits for the transition or its fallback timeout.

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
<p :.warn="q('previous input').value < 0">Negative balance</p>
```

### `:class`

String form: set the listed classes.

```html
<input type="number" value="0">
<div :class="q('previous input').value < 18 ? 'warn big' : 'ok'"></div>
```

Object form: each key is added or removed by the truthiness of its value.

```html
<input type="number" value="0">
<div :class="{
    warn: q('previous input').value < 18,
    ok:   q('previous input').value >= 18
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
<p :text="q('first input').value * q('last input').value"></p>
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

The helpers work inside `hx-live` expressions and [`hx-on`](/reference/attributes/hx-on) event handlers. The [Public API](#public-api) lists the helpers available to regular JavaScript.

```js
htmx.live.q('.row').attr.hidden = true;
```

Inside expressions, `this` is the element, the full htmx API is available unprefixed, and `await` works at the top level (expressions are `async` functions).

```html
<button hx-on:click="
    attr.disabled = true;
    await ajax('POST', '/save');
    delete attr.disabled;
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

**State and methods**

State writes and method calls apply to every matched element:

```js
q('input').attr.disabled = true          // set attribute on all
q('.row').toggle('.selected')            // toggle class on each
q('.tab.active').take('.active', '.tab') // move a class from peers to self
q('.tab').trigger('select', { id: 1 })   // CustomEvent on each
q('.list').insert('end', '<li>new</li>') // before / after / start / end
```

### Ownership

Bare `attr.*`, `aria.*`, and `class.*` use the current element. Bare `data.*` uses the nearest element carrying that `data-*` attribute.

`q(...)` makes every state bag local to the selected elements. Add `.closest` to use the nearest owner instead:

| Current expression | Selected elements | Nearest owner |
|---|---|---|
| `attr.hidden` | `q('.item').attr.hidden` | `q('.item').closest.attr.hidden` |
| `data.count` | `q('.item').data.count` | `q('.item').closest.data.count` |
| `aria.busy` | `q('.item').aria.busy` | `q('.item').closest.aria.busy` |
| `class.active` | `q('.item').class.active` | `q('.item').closest.class.active` |

A closest write uses the selected element when no owner exists. A closest delete does nothing when no owner exists. When several selected elements share an owner, hx-live updates it once.

### `attr`

Read and write HTML attributes on this element.

```js
attr.hidden                     // boolean attribute presence
attr.hidden = true              // add hidden
delete attr.hidden              // remove hidden
attr['aria-expanded'] = false   // write aria-expanded="false"
attr.contenteditable = false    // write contenteditable="false"
class.active = true             // typed class state
attr.value = 'hello'            // set the value
delete attr['data-x']           // remove data-x
```

Use bracket notation for names that are not JavaScript identifiers, and for computed names.

`checked`, `selected`, and `value` read the live control state and write both the property and the attribute, so the two never drift apart.

On `<input type="number">` and `<input type="range">`, `value` reads as a number, and as `null` when the field is empty. Every other control reads as a string, so `<input type="text" value="007">` stays `"007"`.

Numeric attributes (`tabindex`, `colspan`, `rowspan`, `maxlength`, `minlength`, `size`, `span`, `start`, `rows`, `cols`, `width`, `height`, `min`, `max`, `step`, `low`, `high`, `optimum`) read numeric values as numbers. Values such as dates and `step="any"` remain strings.

Use `delete` to remove an attribute. Assigning `false` writes `"false"`.

```js
delete attr['data-x']
attr['data-x'] = null
```

Use [`class.*`](#class) and [`aria.*`](#aria) for class and ARIA state.

### `toggle(name, values?)`

Toggle or cycle a class, ARIA attribute, or attribute on this element.

```js
toggle('.active')                      // toggle class
toggle('aria-expanded')                // flip "true" ↔ "false"
toggle('hidden')                       // toggle attribute presence
toggle('data-view', 'grid', 'list')    // cycle attribute through values
toggle('.size', 'sm', 'md', 'lg')      // cycle classes (one at a time)
toggle('data-open', 'on', '')          // cycle: 'on' ↔ absent
```

Values can also arrive as one `|`-separated string or one array:

```js
toggle('data-view', 'grid|list|table')
toggle('data-view', ['grid', 'list', 'table'])
```

### `take(name, scope?)`

Move a class or attribute from siblings to this element. Pass a `scope` selector to widen or restrict the source set.

```js
take('.selected', '.tab')              // become the selected tab among .tab
take('aria-current', 'nav a')          // become the current nav item
take('.active')                        // implicit scope: parent element's subtree
```

### `class`

`class`, `attr.class`, and `attr['class']` return the same class state. Read and write membership with boolean properties:

```html
<button class="pending"
        hx-on:click="
            class.pending = false;
            class.done = true
        ">
    Finish
</button>
```

Use bracket notation for class names that are not JavaScript identifiers:

```js
class['is-active'] = true
delete class.pending
```

Set several classes at once with `class.assign({ ... })`. Truthy values add, falsy values remove, unmentioned classes survive:

```html
<button hx-on:click="class.assign({ active: true, loading: false })">Finish</button>
```

Non-object arguments warn and do nothing.

`class` extends the native [`DOMTokenList`](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList):

```js
class.add('a', 'b')        // add classes
class.remove('a', 'b')     // remove classes
class.toggle('x', force?)  // toggle, optional force
class.replace('a', 'b')    // replace one class with another
class.contains('x')        // membership
class.value                // complete class attribute
class.length               // number of classes
[...class]                 // class names
class.assign({...})        // group add/remove by truthiness
'x' in class               // membership
```

Native members win on read. Use `class.contains('toggle')` to read a class whose name collides with a native member. Key writes still change membership, so `class.toggle = false` removes the class named `toggle`.

With multiple selected elements, class writes and mutating `DOMTokenList` methods update every match. Reads and return values use the first match.

Use `q()` to access another element:

```js
q('#menu').class.open = true
```

`toggle()` and `take()` work on classes by name:

```js
toggle('.active')
take('.selected')
```

### `aria`

Read and write typed ARIA state on this element:

```html
<div aria-busy="false">
    <button hx-on:click="q(this).closest.aria.busy = !q(this).closest.aria.busy">Toggle</button>
    <output :hidden="!q(this).closest.aria.busy">Busy</output>
</div>
```

Use `closest.aria.*` when you explicitly want the nearest owner. A write with
no owner adds the state to the current element:

```js
aria.busy                   // aria-busy on this element
closest.aria.busy           // nearest aria-busy, starting at this
q('#form').aria.busy        // aria-busy on the selected form
q('#form').closest.aria.busy // nearest aria-busy from #form up
```

Use `toggle()` and `take()` for transitions:

```html
<button aria-pressed="false"
        hx-on:click="toggle('aria-pressed')">
    Mute
</button>

<button aria-sort="ascending"
        hx-on:click="toggle('aria-sort', 'ascending', 'descending')">
    Name
</button>

<div role="tablist">
    <button role="tab" aria-selected="true">One</button>
    <button role="tab" aria-selected="false"
            hx-on:click="take('aria-selected')">Two</button>
</div>
```

`toggle()` flips boolean ARIA between `"true"` and `"false"`. `take()` writes `"false"` on sibling owners, then `"true"` on this owner.

Each form uses the same value rules. You can use these values as booleans, numbers, and arrays:

```html
<button aria-busy="false"
        aria-controls="panel status"
        hx-on:click="
            aria.busy = !aria.busy;
            aria.controls = [...aria.controls, 'help'];
            q('#progress').aria.valueNow++
        ">
    Update
</button>

<section id="panel">...</section>
<p id="help">...</p>
<output id="status"></output>
<div id="progress" role="progressbar"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="51"></div>
```

After one click:

```html
<button aria-busy="true" aria-controls="panel status help">Update</button>
<div id="progress" role="progressbar"
     aria-valuemin="0" aria-valuemax="100" aria-valuenow="52"></div>
```

Use either form to remove an attribute:

```js
aria.current = null
delete aria.current
```

#### Value types

hx-live uses the value types from [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/).

Numbers use JSON syntax. For example, `aria-valuenow="0.5"` reads as `0.5`, while `aria-valuenow=".5"` remains the string `".5"`.

**Boolean**

- `aria-atomic`
- `aria-busy`
- `aria-checked`
- `aria-current`
- `aria-disabled`
- `aria-expanded`
- `aria-grabbed`
- `aria-haspopup`
- `aria-hidden`
- `aria-invalid`
- `aria-modal`
- `aria-multiline`
- `aria-multiselectable`
- `aria-pressed`
- `aria-readonly`
- `aria-required`
- `aria-selected`

**Number**

- `aria-colcount`
- `aria-colindex`
- `aria-colspan`
- `aria-level`
- `aria-posinset`
- `aria-rowcount`
- `aria-rowindex`
- `aria-rowspan`
- `aria-setsize`
- `aria-valuemax`
- `aria-valuemin`
- `aria-valuenow`

**Token list (`string[]`)**

- `aria-dropeffect`
- `aria-relevant`

**ID reference list (`string[]`)**

- `aria-controls`
- `aria-describedby`
- `aria-flowto`
- `aria-labelledby`
- `aria-owns`

All other `aria-*` attributes remain strings.

You can use `aria.*` in `hx-live`, bindings, `hx-on`, `js:` attribute values, and `hx-trigger` filters.

### `data`

Read and write `data-*` attributes as JSON or plain text.

```html
<div data-size="medium">
    <button hx-on:click="data.size = 'small'">S</button>
    <button hx-on:click="data.size = 'medium'">M</button>
    <button hx-on:click="data.size = 'large'">L</button>
    <p :text="`Size: ${data.size}`"></p>
</div>
```

`data-*` holds state shared by a subtree, so `data.*` walks up to the nearest element that has the attribute. Every other namespace reads this element:

```js
data.count                    // nearest data-count, starting at this
q(this).data.count            // data-count on this element only
q('#cart').data.count         // data-count on the selected cart
q('#cart').closest.data.count // nearest data-count from #cart up
```

On write, hx-live converts booleans, numbers, arrays, and objects to JSON. On read, it converts the JSON back to JavaScript values:

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

Writes preserve strings that look like JSON by quoting them:

```js
data.code = '123' // data-code='"123"', reads as '123'
data.code = 123   // data-code="123", reads as 123
```

Use `toggle()` and `take()` for transitions:

```html
<button data-active
        hx-on:click="toggle('data-active')">Toggle details</button>

<button data-view="grid"
        hx-on:click="toggle('data-view', 'grid', 'list')">Change view</button>
```

Without values, `toggle()` adds or removes the attribute. Pass values to cycle through them.

Use `take()` to move state between siblings:

```html
<div>
    <button data-active="">One</button>
    <button hx-on:click="take('data-active')" data-active="">Two</button>
</div>
```

Clicking Two removes `data-active` from One and leaves an empty `data-active=""` on Two.

The `data` proxy is enumerable, so object spread, rest destructuring, and `Object.keys()`/`Object.entries()` work:

```html
<section data-x="1" data-y="2">
    <button data-y="3"
            hx-post="/cursor"
            hx-vals="js:{ ...data }">
        Send cursor
    </button>
</section>
```

Here, `hx-vals` receives `{ x: 1, y: 3 }`.

Delete a value or assign `undefined` to remove its attribute:

```js
data.count = undefined         // remove the nearest data-count
delete data.count              // remove the nearest data-count
delete closest.data.count      // remove the nearest data-count
delete q('#cart').data.count   // remove data-count from the selected cart
```

`data.count = null` writes `data-count="null"`. `data.count = ''` writes an empty `data-count=""` attribute.

Use `dataset` when you need raw strings:

```js
this.dataset.count
q('#cart').dataset.count
```

#### Assign a Function

Assign a function when the next value depends on the current value:

```html
<section data-cart='[{"id":"1"}]'>
    <button value="2" hx-on:click="
        data.cart = cart => [...cart, { id: this.value }]
    ">
        Add
    </button>
</section>
```

```text
[{"id":"1"}]  →  [{"id":"1"},{"id":"2"}]
```

The function must return a value synchronously. It also works with DOM properties and `attr.*`:

```js
q('#panel').hidden = hidden => !hidden
attr.hidden = hidden => !hidden
```

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
    class.add('fade-out');
    await forEvent('transitionend', 500);
    this.remove();
">Dismiss</button>
```

### `nextFrame()`

Resolve on the next animation frame.

```html
<button hx-on:click="
    class.remove('shake');
    await nextFrame();
    class.add('shake');
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
    <button hx-on:click="aria.expanded = !aria.expanded" aria-expanded="false">Menu</button>
</header>
<aside :hidden="!q('header button').aria.expanded">...</aside>
```

**Toggle button.**

```html
<button hx-on:click="aria.pressed = !aria.pressed" aria-pressed="false">Bold</button>
```

```css
[aria-pressed="true"] { background: lightblue }
```

**Tabs.**

```html
<div role="tablist">
    <button role="tab" hx-on:click="take('aria-selected')" aria-selected="true">A</button>
    <button role="tab" hx-on:click="take('aria-selected')" aria-selected="false">B</button>
    <button role="tab" hx-on:click="take('aria-selected')" aria-selected="false">C</button>
</div>
```

`take('aria-selected')` writes `"false"` on every other tab, then `"true"` on this one.

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
<div role="slider" :aria-valuenow="q('#slider').value"></div>
```

## Advanced Examples

### Auto-clearing flash messages

Server response:

```http
HX-Trigger: {"flash":{"target":"#flash", "level":"success", "message":"Saved"}}
```

Client state:

```html
<style>
#flash:empty { display: none; }
</style>

<div id="flash"
     data-message=""
     data-level=""
     hx-on="flash -> data.message = message; data.level = level;
                     await timeout('3s');
                     data.message = ''"
     :text="data.message"
     :.success="data.level === 'success'"
     :.error="data.level === 'error'"></div>
```

## How it works

### Re-run triggers

A single document-wide `MutationObserver` and `input` / `change` listeners trigger a recompute of every live expression. Any of these schedule one:

- DOM additions, removals, attribute changes, text changes
- `input` or `change` events from any control
- completion of an htmx swap (recomputes pause mid-swap, run once at the end)

Each expression is pre-compiled once when registered. All pre-compiled expressions then run in a single microtask, so multiple synchronous mutations coalesce into one recompute.

### Self-mutation is safe

When an expression writes to the DOM, the observer drains its own pending records inside the same microtask. Writes made by `hx-live` cannot trigger a feedback loop.

### Slow expressions

After a change, hx-live runs every live expression once. If this takes more than `16ms`, hx-live logs one warning:

```text
htmx: hx-live expressions took 18.4ms.
```

The warning does not stop the expressions.

### Coordinating with htmx swaps

Recomputes are deferred between [`htmx:before:swap`](/reference/events/htmx-before-swap) and [`htmx:finally:swap`](/reference/events/htmx-finally-swap). One consolidated recompute runs when the swap finishes, regardless of how much markup changed.

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

**ARIA attributes** (`aria-*`). Values are stringified. `null` or `undefined` remove the attribute.

```html
<button :aria-expanded="truthyExpr">    <!-- <button aria-expanded="true">  -->
<button :aria-expanded="falsyExpr">     <!-- <button aria-expanded="false"> -->
<button :aria-pressed="'mixed'">        <!-- <button aria-pressed="mixed">  -->
```

**String boolean attributes** (`contenteditable`, `draggable`, `spellcheck`, `writingsuggestions`). Parse JSON values and preserve other values as strings.

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

**Anything else.** Stringify the value. `null` or `undefined` remove the attribute.

```html
<a :href="'/profile'">    <!-- <a href="/profile"> -->
<a :href="null">          <!-- <a>                 -->
<a :href="false">         <!-- <a href="false">    -->
<a :href="''">            <!-- <a href="">         -->
```

## Public API

Use these helpers from regular JavaScript:

```js
htmx.live.q('.row')
htmx.live.$('.row')
htmx.live.take('.tab.active', '.active', '.tab')
htmx.live.toggle('.tab', 'data-view', 'grid', 'list')
```

`htmx.live.refresh()` forces a recompute. Use it when an expression reads from a source the observer cannot see (a JS variable, a getter, an external store) and you've just mutated it.

```js
window.appState = 'loading';
htmx.live.refresh();
```

Selector directionals (`next`, `previous`, `closest`) need an anchor and only work inside `hx-live` / `hx-on`, not from `htmx.live.q`.

## Configuration

### `config.live.inputDebounce`

Set how long hx-live waits after an `input` event. Use a number of milliseconds or an interval string. The default is `100ms`.

```html
<meta name="htmx-config" content="live.inputDebounce:20ms">
```

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

### `config.live.useDollar`

Enable `$()` as an alias for [`q()`](#q):

```html
<!-- Because jQuery rocks -->
<meta name="htmx-config" content="live.useDollar:true">

<input id="name">
<p :text="$('#name').value"></p>
```

The alias works in:

- [`hx-live`](#hx-live)
- [`:attr` bindings](#attributes)
- [`hx-on`](/reference/attributes/hx-on)
- `js:` attributes
- [`hx-trigger` filters](/reference/attributes/hx-trigger)

Defaults to `false`.

## Notes

- Expressions run on any DOM mutation. There is no per-variable tracking. The microtask coalescing keeps this cheap, but expensive expressions should `debounce` or guard themselves.
- The DOM is the source of truth. To share state between expressions, use ARIA attributes, `data-*` attributes (the `data` proxy makes this ergonomic), or hidden inputs.
- When using morph swap styles (`innerMorph` / `outerMorph`), server responses will overwrite `data-*` attributes by default. To preserve client-side state during morphs, add a prefix to `morphIgnore` — e.g. `morphIgnore:["data-"]` will protect all `data-*` attributes from being overwritten. Non-morph swaps (`innerHTML`, `outerHTML`) replace the DOM entirely, so state should live on an ancestor element that isn't swapped.
- Expressions must be safe to run repeatedly. Avoid unconditional `fetch()` calls. Use `debounce` or guard on a value change.
- If your build pipeline strips `:`-prefixed attributes, use the canonical `hx-live:<attr>` form instead. Behavior is identical.
- If using Alpine.js on the same page, hx-live auto-detects it and disables the `:` short form. See [Configuration](#configuration) for details.

### Async Code

Use top-level `await` in `hx-live`. Do not add an async wrapper.

```html
<!-- Good: htmx handles errors -->
<div hx-live="await update()"></div>

<!-- Bad: errors go unhandled -->
<div hx-live="(async () => { await update() })()"></div>
```

## See Also

- [`hx-on`](/reference/attributes/hx-on) (attribute)
- [Locality of Behaviour](/essays/locality-of-behaviour) (essay)
