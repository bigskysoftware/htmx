# htmx-live

Client-side reactivity via `hx-on` and `hx-bind`. State lives in `data-*` and `aria-*` attributes.

---

## In Action

```html
<div data-h="200"
     data-s="80"
     data-l="55">

  <label>
    Hue
    <input type="range" min="0" max="360"
           hx-bind:value="data.h"
           hx-on:input="data.h = this.value">
  </label>

  <label>
    Saturation
    <input type="range" min="0" max="100"
           hx-bind:value="data.s"
           hx-on:input="data.s = this.value">
  </label>

  <label>
    Lightness
    <input type="range" min="0" max="100"
           hx-bind:value="data.l"
           hx-on:input="data.l = this.value">
  </label>

  <div hx-bind:style="`background: hsl(${data.h}, ${data.s}%, ${data.l}%)`"></div>

  <code hx-bind:text="`hsl(${data.h}, ${data.s}%, ${data.l}%)`"></code>

  <button hx-on:click="navigator.clipboard.writeText(`hsl(${data.h}, ${data.s}%, ${data.l}%)`)">
    Copy
  </button>

</div>
```

Three sliders, live preview, computed output, copy button. No JavaScript file. Data inheritance means children access parent's `data-h`, `data-s`, `data-l`.

---

## Events (`hx-on`)

`hx-on:click` works. But what if you want debounce, throttle, once, keyboard filters?

With `hx-trigger`, you can. With `hx-on`, you couldn't. Now you can:

```html
<button hx-on="click once => log('once')">                    <!-- once -->
<input hx-on="keyup changed delay:300ms => search()">         <!-- debounce -->
<div hx-on="scroll throttle:100ms => handleScroll()">         <!-- throttle -->
<div hx-on="keydown[key=='Escape'] from:document => close()"> <!-- filter + from -->
<button hx-on="click queue:none => await save()">             <!-- queue -->
```

Same modifiers as `hx-trigger`: `once`, `changed`, `delay:<time>`, `throttle:<time>`, `from:<selector>`, `target:<selector>`, `consume`, `queue:<option>`, `[<filter>]`.

**Multiple events:**

```html
<input hx-on="focus => activate(); blur => deactivate()">
```

**Multi-statement:**

```html
<button hx-on="click => { validate(); submit() }">
```

---

## Bindings (`hx-bind`)

Reactive bindings. When dependencies change, the DOM updates.

```html
<span hx-bind:text="data.count">                              <!-- text content -->
<span hx-bind:text="data.count === 1 ? 'item' : 'items'">     <!-- computed -->
<a hx-bind:href="'/users/' + data.id">                        <!-- attribute -->
<button hx-bind:disabled="data.count < 1">                    <!-- boolean attribute -->
<div hx-bind:.text-red-500="data.count > data.max">           <!-- class (prefix with .) -->
<div hx-bind:style="`color: ${data.color}`">                  <!-- style -->
```

**Multiple bindings:**

```html
<a hx-bind="
    href: '/products/' + data.id; 
    text: data.name">
```

**CSS-first:** For simple boolean states, prefer CSS over `hx-bind`:

```html
<button class="aria-busy:opacity-50" aria-busy="true">        <!-- CSS handles it -->
<input class="data-has-error:border-red" data-has-error>      <!-- CSS handles it -->
```

Use `hx-bind` when CSS can't express the logic (comparisons, computed values).

---

## State

### `data-*` attributes

State lives in `data-*` attributes. The `data` proxy provides:

- **Type conversion:** `"5"` → `5`, `"true"` → `true`
- **Inheritance:** Children find `data-*` on ancestors
- **Boolean as presence:** `data.loading = true` adds attribute, `false` removes it

```html
<div data-count="0">
  <button hx-on:click="data.count++">   <!-- inherits from parent -->
  <span hx-bind:text="data.count">      <!-- inherits from parent -->
</div>
```

### `aria-*` attributes

The `aria` proxy converts `"true"`/`"false"` to booleans. No inheritance.

```html
<button hx-on:click="toggle('aria-expanded')" class="aria-expanded:rotate-180">
```

### CSS-first

Prefer semantic attributes + CSS over `hx-bind` for styling:

```html
<!-- ✓ CSS-first -->
<button aria-busy="false" class="aria-busy:opacity-50">

<!-- ✗ Avoid when CSS works -->
<button hx-bind:.opacity-50="aria.busy">
```

---

## Examples

### Counter

```html
<div data-count="0">
  <button hx-on:click="data.count++">+</button>
  <span hx-bind:text="data.count"></span>
</div>
```

### Character Counter

```html
<div data-count="0" data-max="280">
  <textarea hx-on:input="data.count = this.value.length"></textarea>
  <span hx-bind:text="data.count"></span>/<span hx-bind:text="data.max"></span>
</div>
```

### Product Quantity

```html
<div data-count="1"
     data-price="29.99"
     data-max="10">

  <button hx-on:click="data.count--"
          hx-bind:disabled="data.count <= 1">−</button>

  <span hx-bind:text="data.count"></span>

  <button hx-on:click="data.count++"
          hx-bind:disabled="data.count >= data.max">+</button>

  <p>Total: $<span hx-bind:text="(data.count * data.price).toFixed(2)"></span></p>

</div>
```

### Form Loading State

```html
<form hx-post="/submit"
      hx-on::before-request="aria.busy = true"
      hx-on::after-request="aria.busy = false"
      class="group"
      aria-busy="false">

  <input class="group-aria-busy:opacity-50">

  <button hx-bind:disabled="$('closest form').aria.busy"
          class="disabled:opacity-50">
    Submit
  </button>

</form>
```

### Chart Initialization

Data in hypermedia, not script blocks:

```html
<!-- Before -->
<canvas id="myChart"></canvas>
<script>
  new Chart(document.getElementById('myChart'), { type: 'line', ... });
</script>

<!-- After -->
<canvas data-chart='{ "type": "line", "data": {...} }'
        hx-on::load="new Chart(this, data.chart)">
</canvas>
```

---

## Reference

### Selectors — `$()`

```html
<button hx-on:click="$('#modal').showModal()">                <!-- by ID → element -->
<button hx-on:click="$('.item').forEach(...)">                <!-- by class → array -->
<button hx-on:click="$('closest form').submit()">             <!-- ancestor -->
<button hx-on:click="$('next .panel').show()">                <!-- next sibling -->
<button hx-on:click="$('find input').focus()">                <!-- descendant -->
<button hx-on:click="$('<input:checked/>').forEach(...)">     <!-- query literal → array -->
```

### Elements

| Name       | Description                     |
|------------|---------------------------------|
| `this`     | Current element                 |
| `body`     | `<body>` element                |
| `document` | Global document                 |
| `event`    | Triggering event (`hx-on` only) |

### Helpers

```html
<button hx-on:click="add('.active')">              <!-- adds class -->
<button hx-on:click="add('disabled')">             <!-- adds attribute -->
<button hx-on:click="remove('.active')">           <!-- removes class -->
<button hx-on:click="toggle('aria-expanded')">     <!-- "true" ↔ "false" -->
<button hx-on:click="toggle('data-theme', ['light', 'dark'])">  <!-- cycles -->
<button hx-on:click="$('#x').toggle('.open')">     <!-- on other element -->
<button hx-on:click="log('debug', data)">          <!-- console.log -->
```

---

## Unresolved

### Two-Way Binding
Verbose: `hx-bind:value="data.x" hx-on:input="data.x = this.value"`. Need shorthand.

### Core vs Extension
What goes in htmx core vs htmx-live extension?

### `remove()` Collision
`Element.prototype.remove()` (removes element) vs our `remove('.class')` (removes class).
