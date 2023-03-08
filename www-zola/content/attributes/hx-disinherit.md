+++
title = "hx-disinherit"
+++

The default behavior for htmx is to "inherit" many attributes automatically: that is, an attribute such as
[hx-target](@/attributes/hx-target.md) may be placed on a parent element, and all child elements will inherit
that target.

The `hx-disinherit` attribute allows you to control this automatic attribute inheritance. An example scenario is to 
allow you to place an `hx-boost` on the `body` element of a page, but overriding that behavior in a specific part
of the page to allow for more specific behaviors.

htmx evaluates attribute inheritance as follows:

* when `hx-disinherit` is set on a parent node
  * `hx-disinherit="*"` all attribute inheritance for this element will be disabled
  * `hx-disinherit="hx-select hx-get hx-target"` disable inheritance for only one or multiple specified attributes

```html
<div hx-boost="true" hx-select="#content" hx-target="#content" hx-disinherit="*">
  <a href="/page1">Go To Page 1</a> <!-- boosted with the attribute settings above -->
  <a href="/page2" hx-boost="unset">Go To Page 1</a> <!-- not boosted -->
  <button hx-get="/test" hx-target="this"></button> <!-- hx-select is not inherited -->
</div>
```

```html
<div hx-boost="true" hx-select="#content" hx-target="#content" hx-disinherit="hx-target">
  <!-- hx-select is automatically set to parent's value; hx-target is not inherited -->
  <button hx-get="/test"></button>
</div>
```

```html
<div hx-select="#content">
  <div hx-boost="true" hx-target="#content" hx-disinherit="hx-select">
    <!-- hx-target is automatically inherited from parent's value -->
    <!-- hx-select is not inherited, because the direct parent does
    disables inheritance, despite not specifying hx-select itself -->
    <button hx-get="/test"></button>
  </div>
</div>
```

## Notes

* Read more about [Attribute Inheritance](@/docs.md#inheritance)
