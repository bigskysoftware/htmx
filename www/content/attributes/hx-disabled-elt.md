+++
title = "hx-disabled-elt"
description = """\
  The hx-disabled-elt attribute in htmx allows you to specify elements that will have the `disabled` attribute added \
  to them for the duration of the request."""
+++

The `hx-disabled-elt` attribute allows you to specify elements that will have the `disabled` attribute
added to them for the duration of the request. The value of this attribute can be:

* A CSS query selector of the element to disable.
* `this` to disable the element itself
* `closest <CSS selector>` which will find the [closest](https://developer.mozilla.org/docs/Web/API/Element/closest)
  ancestor element or itself, that matches the given CSS selector
  (e.g. `closest fieldset` will disable the closest to the element `fieldset`).
* `find <CSS selector>` which will find the first child descendant element that matches the given CSS selector
* `next` which resolves to [element.nextElementSibling](https://developer.mozilla.org/docs/Web/API/Element/nextElementSibling)
* `next <CSS selector>` which will scan the DOM forward for the first element that matches the given CSS selector
  (e.g. `next button` will disable the closest following sibling `button` element)
* `previous` which resolves to [element.previousElementSibling](https://developer.mozilla.org/docs/Web/API/Element/previousElementSibling)
* `previous <CSS selector>` which will scan the DOM backwards for the first element that matches the given CSS selector.
  (e.g. `previous input` will disable the closest previous sibling `input` element)

Here is an example with a button that will disable itself during a request:

```html
<button hx-post="/example" hx-disabled-elt="this">
    Post It!
</button>
```

When a request is in flight, this will cause the button to be marked with [the `disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled), 
which will prevent further clicks from occurring.  

The `hx-disabled-elt` attribute also supports specifying multiple CSS selectors separated by commas to disable multiple
 elements during the request. Here is an example that disables buttons and text input fields of a particular form during the request:

```html
<form hx-post="/example" hx-disabled-elt="find input[type='text'], find button">
    <input type="text" placeholder="Type here...">
    <button type="submit">Send</button>
</form>
```

Note that you can also use the `inherit` keyword to inherit parent values for a disabled elements and add additional 
disabled element CSS selectors:

```html
<main hx-disabled-elt="#logout-button">
    ...
  <form hx-post="/example" hx-disabled-elt="inherit, find input[type='text'], find button">
    <input type="text" placeholder="Type here...">
    <button type="submit">Send</button>
  </form>
</main>
```

## Notes

* `hx-disabled-elt` is inherited and can be placed on a parent element

[hx-trigger]: https://htmx.org/attributes/hx-trigger/
