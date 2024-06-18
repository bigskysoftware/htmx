+++
title = "hx-inherit"
+++

The default behavior for htmx is to "inherit" many attributes automatically: that is, an attribute such as
[hx-target](@/attributes/hx-target.md) may be placed on a parent element, and all child elements will inherit
that target.  Some people do not like this feature and instead prefer to explicitly specify inheritance for attributes.

To support this mode of development, htmx offers the `htmx.config.disableInheritance` setting, which can be set to
`false` to prevent inheritance from being the default behavior for any of the htmx attributes.

The `hx-inherit` attribute allows you to control the inheritance of attributes manually.

htmx evaluates attribute inheritance as follows:

* when `hx-inherit` is set on a parent node
  * `inherit="*"` all attribute inheritance for this element will be enabled
  * `hx-inherit="hx-select hx-get hx-target"` enable inheritance for only one or multiple specified attributes

Here is an example of a div that shares an `hx-target` attribute for a set of anchor tags when `htmx.config.disableInheritance`
is set to false:

```html
<div hx-target="#tab-container" hx-inherit="hx-target">
  <a hx-boost="true" href="/tab1">Tab 1</a>
  <a hx-boost="true" href="/tab2">Tab 2</a>
  <a hx-boost="true" href="/tab3">Tab 3</a>
</div>
```

## Notes

* Read more about [Attribute Inheritance](@/docs.md#inheritance)
