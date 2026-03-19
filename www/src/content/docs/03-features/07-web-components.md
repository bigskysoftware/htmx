---
title: "Web Components"
description: "Use htmx inside Web Components and Shadow DOM"
---

htmx doesn't automatically scan inside web components' shadow DOM. You must manually initialize it.

After creating your shadow DOM, call [`htmx.process`](/reference/methods/htmx-process):

```javascript
customElements.define('my-counter', class extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({mode: 'open'})
        shadow.innerHTML = `
          <button hx-post="/increment" hx-target="#count">+1</button>
          <div id="count">0</div>
        `
        htmx.process(shadow) // Initialize htmx for this shadow DOM
    }
})

```

### Targeting Elements Outside Shadow DOM

Selectors like [`hx-target`](/reference/attributes/hx-target) only see elements inside the same shadow DOM.

To break out:

1. Target the host element, using `host`:

```html
<button hx-get="..." hx-target="host">
  ...
</button>
```

2. Target elements in main document, using `global:<selector>`:

```html
<button hx-get="..." hx-target="global:#target">
  ...
</button>
```

### Components Without Shadow DOM

Still call [`htmx.process`](/reference/methods/htmx-process) on the component:

```javascript
customElements.define('simple-widget', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `Load`
        htmx.process(this)
    }
})
```
