---
title: "Attribute Inheritance"
description: "Hoist attributes to parents to reduce repetition"
---

<details class="warning">
<summary>Changes in htmx 4.0</summary>

In htmx 2.0 attribute inheritance was implicit by default: elements inherited the attributes on their parents, such
as hx-target. In htmx 4.0 attribute inheritance is now explicit by default, using the `:inherited` modifier.

</details>

Inheritance allows you to "hoist" attributes up the DOM to avoid code duplication.

Consider the following htmx:

```html
<button hx-delete="/account" hx-confirm="Are you sure?">
    Delete My Account
</button>
<button hx-put="/account" hx-confirm="Are you sure?">
    Update My Account
</button>
```

Here we have a duplicate `hx-confirm` attribute.

We can hoist this attribute to a parent element using the `:inherited` modifier:

```html
<div hx-confirm:inherited="Are you sure?">
    <button hx-delete="/account">
        Delete My Account
    </button>
    <button hx-put="/account">
        Update My Account
    </button>
</div>
```

This `hx-confirm` attribute will now apply to all htmx-powered elements within it.
