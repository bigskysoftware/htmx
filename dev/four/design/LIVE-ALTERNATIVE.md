# htmx-live (Alternative Syntax)

Client-side reactivity via a single `hx-live` attribute. Hyperscript-inspired syntax with DOM literals.

*Same functionality as LIVE.md, different syntax.*

---

## In Action

```html
<div data-h="200"
     data-s="80"
     data-l="55">

  <label>
    Hue
    <input type="range" min="0" max="360" hx-live="
      bind value to data.h
      on input { data.h = this.value }
    ">
  </label>

  <label>
    Saturation
    <input type="range" min="0" max="100" hx-live="
      bind value to data.s
      on input { data.s = this.value }
    ">
  </label>

  <label>
    Lightness
    <input type="range" min="0" max="100" hx-live="
      bind value to data.l
      on input { data.l = this.value }
    ">
  </label>

  <div hx-live="bind style.background to `hsl(${data.h}, ${data.s}%, ${data.l}%)`"></div>

  <code hx-live="bind textContent to `hsl(${data.h}, ${data.s}%, ${data.l}%)`"></code>

  <button hx-live="on click { navigator.clipboard.writeText(`hsl(${data.h}, ${data.s}%, ${data.l}%)`) }">
    Copy
  </button>

</div>
```

One attribute. Events and bindings together. DOM literals instead of `$()`. Data inheritance.

---

## Events

```html
on <event> { <javascript> }
```

The `event` variable is implicit.

```html
<button hx-live="on click { log('clicked') }">
<button hx-live="on click once { log('once') }">              <!-- once -->
<input hx-live="on keyup changed delay:300ms { search() }">   <!-- debounce -->
<div hx-live="on scroll throttle:100ms { handleScroll() }">   <!-- throttle -->
<div hx-live="on keydown[key=='Escape'] from:document { close() }">  <!-- filter -->
```

Same modifiers as `hx-trigger`.

**Multiple events:**

```html
<input hx-live="
  on focus { activate() }
  on blur { deactivate() }
">
```

---

## Bindings

```html
bind <target> to <expression>
```

Reactive. When dependencies change, the DOM updates.

```html
<span hx-live="bind textContent to data.count">                <!-- text -->
<span hx-live="bind textContent to data.count === 1 ? 'item' : 'items'">  <!-- computed -->
<a hx-live="bind href to '/users/' + data.id">                 <!-- attribute -->
<button hx-live="bind disabled to data.count < 1">             <!-- boolean -->
<div hx-live="bind .text-red-500 to data.count > data.max">    <!-- class -->
<div hx-live="bind style.background to data.color">            <!-- style -->
```

**Multiple bindings:**

```html
<a hx-live="
  bind href to '/products/' + data.id
  bind textContent to data.name
">
```

---

## State

State lives in `data-*` attributes. The `data` proxy provides inheritance:

```html
<div data-count="0">
  <button hx-live="on click { data.count++ }">+</button>   <!-- inherits -->
  <span hx-live="bind textContent to data.count"></span>   <!-- inherits -->
</div>
```

---

## DOM Literals

Instead of `$()`, use hyperscript-style literals:

```html
<button hx-live="on click { #modal.showModal() }">         <!-- #id -->
<button hx-live="on click { .item.forEach(...) }">         <!-- .class -->
<button hx-live="on click { (closest form).submit() }">    <!-- relative -->
<button hx-live="bind disabled to <input:checked/>.length === 0">  <!-- query literal -->
```

---

## Script Tags

When attributes get long, use a child `<script>` tag (Surreal-inspired):

```html
<button>
  −
  <script type="text/hx-live">
    bind disabled to data.count <= 1
    on click { data.count-- }
  </script>
</button>
```

The script applies to its parent element.

---

## Examples

### Counter

```html
<div data-count="0">
  <button hx-live="on click { data.count++ }">+</button>
  <span hx-live="bind textContent to data.count"></span>
</div>
```

### Modal

```html
<button hx-live="on click { #modal.showModal() }">Open</button>

<dialog id="modal" hx-live="on close { this.remove() }">
  <p>Modal content</p>
  <button hx-live="on click { (closest dialog).close() }">Close</button>
</dialog>
```

### Character Counter

```html
<div data-count="0" data-max="280">
  <textarea hx-live="on input { data.count = this.value.length }"></textarea>
  <span hx-live="bind textContent to data.count"></span>/<span hx-live="bind textContent to data.max"></span>
</div>
```

### Product Quantity

```html
<div data-count="1"
     data-price="29.99"
     data-max="10">

  <button hx-live="
    bind disabled to data.count <= 1
    on click { data.count-- }
  ">−</button>

  <span hx-live="bind textContent to data.count"></span>

  <button hx-live="
    bind disabled to data.count >= data.max
    on click { data.count++ }
  ">+</button>

  <p>Total: $<span hx-live="bind textContent to (data.count * data.price).toFixed(2)"></span></p>

</div>
```

### Form Loading State

```html
<form hx-post="/submit"
      hx-live="
        on htmx:before-request { aria.busy = true }
        on htmx:after-request { aria.busy = false }
      "
      class="group"
      aria-busy="false">

  <input class="group-aria-busy:opacity-50">

  <button hx-live="bind disabled to (closest form).aria.busy"
          class="disabled:opacity-50">
    Submit
  </button>

</form>
```

### Chart Initialization

```html
<!-- Before -->
<canvas id="myChart"></canvas>
<script>
  new Chart(document.getElementById('myChart'), { type: 'line', ... });
</script>

<!-- After -->
<canvas data-chart='{ "type": "line", "data": {...} }'
        hx-live="on load { new Chart(this, data.chart) }">
</canvas>
```

---

## Comparison

|                  | LIVE.md                 | LIVE-ALTERNATIVE.md        |
|------------------|-------------------------|----------------------------|
| **Attributes**   | `hx-on` + `hx-bind`     | Single `hx-live`           |
| **Events**       | `hx-on="click => code"` | `on click { code }`        |
| **Bindings**     | `hx-bind:text="expr"`   | `bind textContent to expr` |
| **Selectors**    | `$('#id')`              | `#id`                      |
| **Long scripts** | Attributes only         | Child `<script>` tags      |
| **Style**        | JavaScript-like         | English-like               |
