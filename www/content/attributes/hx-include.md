+++
title = "hx-include"
description = "The hx-include attribute in htmx allows you to include additional element values in an AJAX request."
+++

The `hx-include` attribute allows you to include additional element values in an AJAX request. The value of this
attribute can be:

* A CSS query selector of the elements to include.
* `this` which will include the descendants of the element.
* `closest <CSS selector>` which will find the [closest](https://developer.mozilla.org/docs/Web/API/Element/closest)
  ancestor element or itself, that matches the given CSS selector
  (e.g. `closest tr` will target the closest table row to the element).
* `find <CSS selector>` which will find the first child descendant element that matches the given CSS selector.
* `next <CSS selector>` which will scan the DOM forward for the first element that matches the given CSS selector.
  (e.g. `next .error` will target the closest following sibling element with `error` class)
* `previous <CSS selector>` which will scan the DOM backwards for the first element that matches the given CSS selector.
  (e.g. `previous .error` will target the closest previous sibling with `error` class)

Here is an example that includes a separate input value:

```html
<div>
    <button hx-post="/register" hx-include="[name='email']">
        Register!
    </button>
    Enter email: <input name="email" type="email"/>
</div>
```

This is a little contrived as you would typically enclose both of these elements in a `form` and submit
the value automatically, but it demonstrates the concept.

Note that you can also use the `inherit` keyword to inherit parent values for inclusion and add additional values:

```html
<main hx-include="#hidden-input">
    ...
    <button hx-post="/example" hx-include="inherit, [name='email']">
        Post It!
    </button>
    Enter email: <input name="email" type="email"/>
</main>
```


Finally, note that if you include a non-input element, all input elements enclosed in that element will be included.

## Notes

* `hx-include` is inherited and can be placed on a parent element
* While `hx-include` is inherited, it is evaluated from the element triggering the request. It is easy to get confused
  when working with the extended selectors such as `find` and `closest`.
  ```html
  <div hx-include="find input">
      <button hx-post="/register">
          Register!
      </button>
      Enter email: <input name="email" type="email"/>
  </div>
  ```
  In the above example, when clicking on the button, the `find input` selector is resolved from the button itself, which
  does not return any element here, since the button doesn't have any `input` child, thus in this case, raises an error.
* A standard CSS selector resolves
  to [document.querySelectorAll](https://developer.mozilla.org/docs/Web/API/Document/querySelectorAll) and will include
  multiple elements, while the extended selectors such as `find` or `next` only return a single element at most to
  include
* `hx-include` will ignore disabled inputs
