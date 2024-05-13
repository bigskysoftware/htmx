+++
title = "hx-disabled-elt"
+++

The `hx-disabled-elt` attribute allows you to specify elements that will have the `disabled` attribute
added to them for the duration of the request.

The value of this attribute is a CSS query selector of the element or elements to disable, extended by keywords `closest`, `find`, `next` and `previous` (see [hx-trigger][] `from:` modifier for syntax details), or the keyword `this`.

Here is an example with a button that will disable itself during a request:

```html
<button hx-post="/example" hx-disabled-elt="this">
    Post It!
</button>
```

When a request is in flight, this will cause the button to be marked with [the `disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled), 
which will prevent further clicks from occurring.  

The `hx-disabled-elt` attribute also supports specifying multiple CSS selectors separated by commas to disable multiple elements during the request. Here is an example that disables buttons and text input fields of a particular form during the request:

```html
<form hx-post="/example" hx-disabled-elt="find input[type='text'], find button">
    <input type="text" placeholder="Type here...">
    <button type="submit">Send</button>
</form>
```

## Notes

* `hx-disabled-elt` is inherited and can be placed on a parent element

[hx-trigger]: https://htmx.org/attributes/hx-trigger/
