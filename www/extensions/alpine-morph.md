---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `alpine-morph` Extension

Alpine.js now has a lightweight [morph plugin](https://alpinejs.dev/plugins/morph) and this extension allows you to use it as the swapping mechanism in htmx which is necessary to retain Alpine state when you have entire Alpine components swapped by htmx.

#### Usage

```html
<header>
  <script src="https://unpkg.com/htmx.org@latest"></script>
  <!-- Alpine Plugins -->
  <script defer src="https://unpkg.com/@alpinejs/morph@3.x.x/dist/cdn.min.js"></script>
  <!-- Alpine Core -->
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
</header>

<body>
  <div hx-target="this" hx-ext="alpine-morph" hx-swap="morph">
      <div x-data="{ count: 0, replaced: false, 
                     message: 'Change me, then press the button!' }">
          <input type="text" x-model="message">
          <div x-text="count"></div>
          <button x-bind:style="replaced && {'backgroundColor': '#fecaca'}" 
                  x-on:click="replaced = true; count++" 
                  hx-get="/swap">
            Morph
          </button>
      </div>
  </div>
</body>
```

In the above example, all the Alpine x-data states (count, replaced, and message) are preserved even the entire Alpine component is swapped.

#### Source

<https://unpkg.com/htmx.org/dist/ext/alpine-morph.js>

