+++
title = "Web Components"
template = "demo.html"
+++

This example shows how to integrate HTMX with web components, allowing it to be used inside of shadow DOM.

By default, HTMX doesn't know anything about your web components, and won't see anything inside their shadow
DOM. Because of this, you'll need to manually tell HTMX about your component's shadow DOM by using 
[`htmx.process`](https://htmx.org/api/#process).

```js
customElements.define('my-component', class MyComponent extends HTMLElement {
  // This method runs when your custom element is added to the page
  connectedCallback() {
    const root = this.attachShadow({ mode: 'closed' })
    root.innerHTML = `
      <button hx-get="/my-component-clicked" hx-target="next div">Click me!</button>
      <div></div>
    `
    htmx.process(root) // Tell HTMX about this component's shadow DOM
  }
})
```

Once you've told HTMX about your component's shadow DOM, most things should work as expected. However, note
that selectors such as in `hx-target` will only see elements inside the same shadow DOM - if you need to
access things outside of your web components, you can use one of the following options:

- `host`: Selects the element hosting the current shadow DOM
- `global`: If used as a prefix, selects from the main document instead of the current shadow DOM

The same principles generally apply to web components that don't use shadow DOM as well; while selectors
won't be encapsulated like with shadow DOM, you'll still have to point HTMX to your component's content by
calling `htmx.process`.

{{ demoenv() }}

<script>
  //=========================================================================
  // Fake Server Side Code
  //=========================================================================

  // data
  let timesClicked = 0

  customElements.define('my-component', class MyComponent extends HTMLElement {
    // This method runs when your custom element is added to the page
    connectedCallback() {
      const root = this.attachShadow({ mode: 'closed' })
      root.innerHTML = `
        <button hx-get="/my-component-clicked" hx-target="next div">Click me!</button>
        <div></div>
      `
      htmx.process(root) // Tell HTMX about this component's shadow DOM
    }
  })

  // routes
  init('/demo', function() {
    return `<my-component></my-component>`
  })

  onGet('/my-component-clicked', function() {
    return `<p>Clicked ${++timesClicked} time${timesClicked > 1 ? 's' : ''}!</p>`
  })
</script>