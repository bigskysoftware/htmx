---
title: "hx-live Programmers Guide"
description: "A programmers guide to hx-live."
---

<script src="/js/ext/hx-live.js"></script>
<style>
.hilite { background: #fde68a; color: #1c1917; }
.demo-container button,
.demo-container input,
.demo-container textarea,
.demo-container progress {
    border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
    border-radius: 4px;
    padding: 3px 10px;
}
.demo-container button { cursor: pointer; }
.demo-container button:hover:not(:is(.hilite, .warm, .cool, [aria-expanded="true"])) {
    background: color-mix(in srgb, currentColor 12%, transparent);
}
.demo-container a { text-decoration: underline; margin-right: 12px; }
.demo-container [aria-current="true"] { background: #fde68a; color: #1c1917; text-decoration: none; }
.warm { background: #fecaca; color: #1c1917; }
.cool { background: #bfdbfe; color: #1c1917; }
.demo-container button:disabled { opacity: .4; cursor: default; }
.demo-container :disabled { opacity: .4; }
.demo-container [aria-expanded="true"] { background: #fde68a; color: #1c1917; }
/* Glow rather than a thicker border: the box does not resize, so nothing shifts,
   and it sits alongside the focus ring instead of fighting it. */
.demo-container .too-much-text {
    border-color: crimson;
    box-shadow: 0 0 8px 2px color-mix(in srgb, crimson 45%, transparent);
}
/* Recolour the focus ring rather than drawing a red glow behind the browser's blue
   one. One ring, in the error colour, stays visible while focused. */
@keyframes hx-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60%  { transform: translateX(-6px); }
    40%, 80%  { transform: translateX(6px); }
}
.demo-container .shake { animation: hx-shake .4s; }
.demo-container .too-much-text:focus,
.demo-container .too-much-text:focus-visible {
    outline: 2px solid crimson;
    outline-offset: 1px;
}
</style>

`hx-live` is an htmx extension for client-side scripting in htmx-based applications, inspired by jQuery, Alpine.js and
hyperscript.  It provides helpers that make imperative scripting more pleasant as well as reactivity, while
keeping with the flavor of htmx: locality of behavior & hypermedia as the engine of application state.

hx-live gives you the following tools for scripting:

* A jQuery-like query helper, `q()`, that includes directional selectors such as `closest .field` and `next input`
* Useful DOM helpers for common scripting needs scripting: `toggle()`, `take()`, `trigger()`, `insert()` and `matches()`
* Properties for storing typed scripting state in the DOM: `data`, `attr`, `aria` and `class`
* A set of reactive binding attributes: `:hidden`, `:text`, `:class`, etc
* A reactive attribute, `hx-live`, for general reactive expressions 
* Async helpers: `debounce()`, `forEvent()` and `nextFrame()`

These tools integrate with the existing `hx-on` functionality in htmx to make scripting more powerful, succinct & fun.

## Getting Started

You can install hx-live like any other htmx extension:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-live.min.js"></script>
```

## Finding Elements With `q()`

The first tool hx-live provides is `q()`, a method for finding elements in the DOM.  It replaces `document.querySelector()` and `document.querySelectorAll()`:

```html
<button hx-on:click="q('#pick-me').toggle('.hilite')">Toggle</button>
<p id="pick-me">Pick me</p>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('#pick-me').toggle('.hilite')">Toggle</button>
    <p id="pick-me">Pick me</p>
</div>

Like jQuery, the result of `q()` is a proxy that can map a single property or function to multiple elements:

```html
<button hx-on:click="q('.pick-us').toggle('.hilite')">Toggle all</button>
<p class="pick-us">First</p>
<p class="pick-us">Second</p>
<p class="pick-us">Third</p>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('.pick-us').toggle('.hilite')">Toggle all</button>
    <p class="pick-us">First</p>
    <p class="pick-us">Second</p>
    <p class="pick-us">Third</p>
</div>

`q()` can also use relative selectors, which will resolve elements relative to the context it is executed in:

```html
<button hx-on:click="q('next p').toggle('.hilite')">Toggle the next one</button>
<p>I am next</p>
<p>I am not</p>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('next p').toggle('.hilite')">Toggle the next one</button>
    <p>I am next</p>
    <p>I am not</p>
</div>

## DOM Helpers

hx-live provides a set of helper methods that are available on the result of `q()` to make common DOM manipulation
operations easier.

### `toggle()`

We've already seen the `.toggle()` method in the examples above.  You can use this method to toggle classes, ARIA 
attributes and boolean attributes:

```html
<button hx-on:click="toggle('.hilite')">A class</button>
<button aria-expanded="false" hx-on:click="toggle('aria-expanded')">An ARIA attribute</button>
<button hx-on:click="q('next input').toggle('disabled')">An attribute</button>
<input value="I can be disabled">
```

<div class="not-prose demo-container">
    <button hx-on:click="toggle('.hilite')">A class</button>
    <button aria-expanded="false" hx-on:click="toggle('aria-expanded')">An ARIA attribute</button>
    <button hx-on:click="q('next input').toggle('disabled')">An attribute</button>
    <input value="I can be disabled">
</div>

The three different forms are:

* A leading dot means a class
* An `aria-` prefix flips a string between `"true"` and `"false"`
* Everything else is treated as a boolean attribute and is added or removed

You can also pass multiple values and `toggle()` will cycle through them:

```html
<button class="warm" hx-on:click="toggle('.theme', 'warm|cool')">Change theme</button>
```

<div class="not-prose demo-container">
    <button class="warm" hx-on:click="toggle('.theme', ['warm', 'cool'])">Change theme</button>
</div>

Here, `.theme` is the group name (and flag that this is a class we are toggling) and toggle will cycle between the `warm` and `cool` classes.

### `take()`

`take()` can be used to take a value from multiple elements.  The element you call it on gains the class or
attribute, and every other element in scope loses it.

Here is a set of tab buttons:

```html
<button class="hilite" hx-on:click="take('.hilite')">Details</button>
<button hx-on:click="take('.hilite')">Reviews</button>
<button hx-on:click="take('.hilite')">Shipping</button>
```

<div class="not-prose demo-container">
    <button class="hilite" hx-on:click="take('.hilite')">Details</button>
    <button hx-on:click="take('.hilite')">Reviews</button>
    <button hx-on:click="take('.hilite')">Shipping</button>
</div>

`take()` accepts the same three forms as `toggle()`:

* A leading dot means a class, which is added here and removed from the others
* An `aria-` prefix sets this element to `"true"` and the others to `"false"`
* Everything else is a boolean attribute, added here and removed from the others

The ARIA form is worth knowing, because a nav needs exactly one current item:

```html
<a href="#a" aria-current="true" hx-on:click="take('aria-current')">Home</a>
<a href="#b" hx-on:click="take('aria-current')">Docs</a>
<a href="#c" hx-on:click="take('aria-current')">Examples</a>
```

<div class="not-prose demo-container">
    <a href="#a" aria-current="true" hx-on:click="take('aria-current')">Home</a>
    <a href="#b" hx-on:click="take('aria-current')">Docs</a>
    <a href="#c" hx-on:click="take('aria-current')">Examples</a>
</div>

By default `take()` scopes to the children of the parent of the target element.  

You can pass a second argument to change the scope that the class or property is taken from:

```html
<button hx-on:click="q('#one').take('.hilite', '.card')">Pick one</button>
<button hx-on:click="q('#two').take('.hilite', '.card')">Pick two</button>
<p id="one" class="card hilite">One</p>
<p id="two" class="card">Two</p>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('#one').take('.hilite', '.card')">Pick one</button>
    <button hx-on:click="q('#two').take('.hilite', '.card')">Pick two</button>
    <p id="one" class="card hilite">One</p>
    <p id="two" class="card">Two</p>
</div>

Here the buttons are not the targets.  `q()` picks the target, and `.card` names the set of elements 
that the class is taken from.

### `trigger()`

`trigger()` provides a convenient way to dispatch a custom event.  

```html
<button hx-on:click="q('#bell').trigger('ring')">Ring the bell</button>
<p id="bell" hx-on:ring="this.textContent = 'Heard it'">Waiting</p>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('#bell').trigger('ring')">Ring the bell</button>
    <p id="bell" hx-on:ring="this.textContent = 'Heard it'">Waiting</p>
</div>

Events bubble by default.  

You can pass a second argument to be used as `event.detail`.

The third argument can be used to stop bubbling:

```js
trigger('ring', {times: 3})        // event.detail.times is 3
trigger('ring', {}, false)         // does not bubble
```

### `insert()`

`insert()` adds HTML around or inside an element.  The first argument to `insert()` says where to insert it:

| Position   | Places the HTML                 |
|------------|---------------------------------|
| `'before'` | as a sibling before the element |
| `'start'`  | as the first child              |
| `'end'`    | as the last child               |
| `'after'`  | as a sibling after the element  |
| `'into'`   | in place of the children        |
| `'replace'`| in place of the element itself   |

```html
<button hx-on:click="q('#list').insert('end', '<li>Another item</li>')">Add an item</button>
<ul id="list"><li>First item</li></ul>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('#list').insert('end', '<li>Another item</li>')">Add an item</button>
    <ul id="list"><li>First item</li></ul>
</div>

`insert()` will process the content it inserts with `htmx.process()`, so htmx and hx-live attributes in the new content work:

```html
<button hx-on:click="q('#slot').insert('into', '<button hx-on:click=&quot;toggle(`.hilite`)&quot;>New button</button>')">
    Insert a live button
</button>
<span id="slot"></span>
```

<div class="not-prose demo-container">
    <button hx-on:click="q('#slot').insert('into', '<button hx-on:click=&quot;toggle(`.hilite`)&quot;>New button</button>')">
        Insert a live button
    </button>
    <span id="slot"></span>
</div>

### Helper Methods & `hx-on`

Each of the methods above can be used without qualification in an `hx-on` expression:

```html
<button hx-on:click="toggle('.hilite')">toggle()</button>
<button hx-on:click="take('.hilite')">take()</button>
<button hx-on:click="insert('after', '<em> added</em>')">insert()</button>
```

<div class="not-prose demo-container">
    <button hx-on:click="toggle('.hilite')">toggle()</button>
    <button hx-on:click="take('.hilite')">take()</button>
    <button hx-on:click="insert('after', '<em> added</em>')">insert()</button>
</div>

When used like this, the element that the hx-on handler is on is the context element.

In addition, the standard DOM `matches()` method is available at the top level:

```html
<p hx-on:click="toggle('.hilite'); q('next span').textContent = matches('.hilite')">Click me</p>
<span>false</span>
```

<div class="not-prose demo-container">
    <p hx-on:click="toggle('.hilite'); q('next span').textContent = matches('.hilite')">Click me</p>
    <span>false</span>
</div>

## State In The DOM

hx-live tries to follow the concept of Hypermedia as The Engine of Application State by encouraging you to keep scripting state in the DOM itself, rather than in JavaScript in global variables, etc.

### The `data` Property

In order to make this easier for you, it surfaces a `data` property.

This attribute can be used to read and store data needed for scripting, and it will be stored in the DOM, via `data-` attributes.  The data will be serialized & deserialized when writing & reading, so you can use typed data without needing to convert it.

As with the helper methods, you can access the `data` property either via the `q()` selector or at the top level of an `hx-on`, where the `data` will be associated with the element the `hx-on` attribute is on.

Here is an example:

```html
    <button data-count="0" hx-on:click="q('next output').innerText = ++data.count; ">Add 1</button>
    <output>0</output>
```

<div class="not-prose demo-container">
    <button data-count="0" hx-on:click="q('next output').innerText = ++data.count">Add 1</button>
    <output>0</output>
</div>

If you use the brower inspector and watch while you click the button you will see that the
text of the output tag is updated as well as the `data-count` attribute.

It's important to recognize that we are able to treat the data in `data-count` as a number, not a string: this is hx-live deserialzing and researalizing the value.

#### Scoping `data`

By default, the data property uses _DOM Scoping_: that is, it looks up the parent hierarchy for matching `data-` entries that match a given name.  That means you can put data on parent elements and refer to it in children:

```html
  <div data-count="0">
    <button hx-on:click="q('next output').innerText = ++data.count; ">Add 1</button>
    <button hx-on:click="q('next output').innerText = --data.count; ">Subtract 1</button>
    <output>0</output>
  </div>
```

<div class="not-prose demo-container">
    <div data-count="0">
        <button hx-on:click="q('next output').innerText = ++data.count; ">Add 1</button>
        <button hx-on:click="q('next output').innerText = --data.count; ">Subtract 1</button>
        <output>0</output>
    </div>
</div>

Here both buttons are using a shared piece of data on the parent `div`.  (Note that this example would be cleaner to implement using reactivity, we will look at that in a moment.)

If you want to scope the `data-` resolution to a specific element, you can use the `local`
property to do so:

```html
  <button data-count="0" 
        hx-on:click="q('next output').innerText = ++this.data.count; ">Add 1</button>
```

This is typically not necessary, but can be useful if you want the data to live on a particular element.

The `data` property is also available on the result of `q()` queries:

```html
  <button hx-on:click="q('#some-div').data.count; ">Add 1</button>
```

And you can also use the `local` modifier in this form as well.

### The `aria` property

Many examples of client-side state can and should use ARIA properties, rather than data attributes, in order to provide maximum accessibility.

```html
<button aria-expanded="false" aria-controls="details"
        hx-on:click="aria.expanded = !aria.expanded; 
                     q('#details').hidden = !aria.expanded">
    Details
</button>
<p id="details" hidden>
    This panel is driven by aria-expanded, not by a class.
</p>      
```

<div class="not-prose demo-container">
    <button aria-expanded="false" aria-controls="details"
            hx-on:click="aria.expanded = !aria.expanded; 
                         q('#details').hidden = !aria.expanded">
        Details
    </button>
    <p id="details" hidden>
        This panel is driven by aria-expanded, not by a class.
    </p>      
</div>

The handler reads `aria.expanded` as a boolean, writes the flipped value back, and uses the same value to hide or show the panel.  

`aria-controls` names the region the button expands, so assistive tech can follow the link.

## Reactive Bindings

Thus far we have been using `hx-live` in an imperative mode.  It also supports reactive-style programming with two features:

* Reactive `:`-prefixed attributes
* The `hx-live` attribute

Let's look at the attribute binding syntax first.

### Reactive Attributes

| Binding     | Sets                                                                             |
|-------------|----------------------------------------------------------------------------------|
| `:<attr>`   | that attribute.  Boolean attributes are added or removed, and `null` removes any |
| `:.<class>` | one class.  Truthy adds it, falsy removes it                                     |
| `:class`    | several classes, from a string of names or an object of name to condition        |
| `:text`     | `textContent`, so the value is never parsed as HTML                              |
| `:html`     | `innerHTML`                                                                      |
| `:style`    | inline styles, from a declaration string or an object of properties              |

Here is an example text area that uses a reactive `.too-much-text` class, a `:text` attribute and a `:hidden` attribute
to implement dynamic feedback on the length of a message:

```html
<textarea id="msg" placeholder="Say something" :.too-much-text="q('#msg').value.length > 60"></textarea>
<p :text="`${q('#msg').value.length} / 60`"></p>
<p :hidden="q('#msg').value.length <= 60">Too long.</p>
```

<div class="not-prose demo-container">
    <textarea id="msg" placeholder="Say something" :.too-much-text="q('#msg').value.length > 60"></textarea>
    <p :text="`${q('#msg').value.length} / 60`"></p>
    <p :hidden="q('#msg').value.length <= 60">Too long.</p>
</div>

Let's go back to the shared `data`-based counter example we saw earlier and
clean it up using reactivity:

```html
  <div data-count="0">
    <button hx-on:click="data.count++">Add 1</button>
    <button hx-on:click="data.count--">Subtract 1</button>
    <output :text="data.count">0</output>
  </div>
```

<div class="not-prose demo-container">
  <div data-count="0">
    <button hx-on:click="data.count++">Add 1</button>
    <button hx-on:click="data.count--">Subtract 1</button>
    <output :text="data.count">0</output>
  </div>
</div>

You can see how using reactivity tidies this particular bit of code up nicely.

### The `hx-live` property

If you want to execute general logic beyond just setting an attribute, inner text, etc. you can use the `hx-live` attribute.

This takes an arbitrary program that will re-run reactively.

Here is an example that caps a progress bar at 20% (well, I had to come up
with something!):

```html
<div data-total="0">
    <button hx-on:click="data.total += 5">Add 5</button>
    <button hx-on:click="data.total = 0">Reset</button>
    <progress max="30" value="0" hx-live="this.value = Math.min(data.total, 20)"></progress>
    <p :text="`${data.total} / 20`"></p>
</div>
```

<div class="not-prose demo-container">
    <div data-total="0">
        <button hx-on:click="data.total += 5" class="border rounded px-3 py-1">Add 5</button>
        <button hx-on:click="data.total = 0" class="border rounded px-3 py-1 ml-2">Reset</button>
        <progress class="block mt-3 w-full" max="30" value="0"
                  hx-live="this.value = Math.min(data.total, 20)"></progress>
        <p class="mt-2 font-mono text-sm" :text="`${data.total} / 20`"></p>
    </div>
</div>

This can be useful when you have arbitrary logic that needs to be rerun when data has changed.

### DOM-based Reactivity

`hx-live` uses coarse-grained, DOM-based reactivity.  What this means is that, generally, it tracks mutations to the DOM when recomputing reactive elements, rather than using effect callbacks, signals, etc.

This is a simple reactive model that works well for many cases and does not require a build step, complicated wiring, unreliable runtime dependency tracking and so on.

There is one common pattern where this approach doesn't work, something that is a perpetual annoyance when scripting: the distinction between the `value` attribute of inputs and the `value` property.

If you update the `value` property of an input element programmatically, it does not update the DOM and it does not trigger a `change` event.  This means that, short of doing some very sleazy property hijacking that would break lots of things in interesting ways, a DOM-based reactive solution can't see these mutations.

However, hx-live has simple a solution: set the value of inputs through the `q()` query finder and the mutation will be tracked and trigger a recalculation of reactive elements on the page.

Finally, if all else fails, you can trigger a recalculation of reactive elements by calling `htmx.live.refresh()`.

```html
<button hx-on:click="window.count = (window.count ?? 0) + 1">Change a JS variable</button>
<button hx-on:click="htmx.live.refresh()">Refresh</button>
<p :text="`window.count is ${window.count ?? 0}`"></p>
```

Of course, this goes against the spirit of hx-live, but sometimes life is messy and, as the kids say: it is what it is.

## Async Helpers

The final set of tools that hx-live offers is a set of methods to make asynchronous programming a bit more pleasant, especially in `hx-on` attributres.

### `debounce()`

The `debounce()` method allows you to debounce an action by awaiting it and passing in a millisecond timer.  The the hx-on is retriggered in that interval, the action will not be taken and the timer will be reset.

```html
<input placeholder="Type here"
       hx-on:input="await debounce(300); q('#settled').textContent = this.value">
<p>settled: <span id="settled"></span></p>
```

<div class="not-prose demo-container">
    <input placeholder="Type here" class="border rounded px-2 py-1"
           hx-on:input="await debounce(300); q('#settled').textContent = this.value">
    <p class="mt-3 font-mono text-sm">settled: <span id="settled"></span></p>
</div>

### `forEvent()` 

The `forEvent()` method lets you wait for an event to occur before continuing, while also passing in an optional timeout if the event does not occur in that amount of time.

This allows you to wait for a transition to finish, for example:

```html
<button hx-on:click="
    class.add('nudge');
    await forEvent('transitionend', 500);
    class.remove('nudge')
">Nudge me</button>
```

<div class="not-prose demo-container">
    <button class="border rounded px-3 py-1 transition-transform duration-300 [&.nudge]:translate-x-8"
            hx-on:click="class.add('nudge'); await forEvent('transitionend', 500); class.remove('nudge')">
        Nudge me
    </button>
</div>

### `nextFrame()`

The `nextFrame()` method waits for the next animation frame.  This allows you
to, for example, trigger a CSS animation and then allow it to apply before moving on to another action.

```html
<button hx-on:click="class.remove('shake'); class.add('shake')">Without nextFrame</button>
<button hx-on:click="class.remove('shake'); await nextFrame(); class.add('shake')">With nextFrame</button>
```

<div class="not-prose demo-container">
    <button hx-on:click="class.remove('shake'); class.add('shake')">Without nextFrame</button>
    <button hx-on:click="class.remove('shake'); await nextFrame(); class.add('shake')">With nextFrame</button>
</div>


## Conclusion

And that's it.  We hope hx-live will make your client-side scripting in htmx more enjoyable.
