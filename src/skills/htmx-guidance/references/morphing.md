# Morphing

## Morphing

`innerMorph` and `outerMorph` merge new content into the existing DOM instead of replacing it.

**Preserves:** focus, scroll position, CSS animations, event listeners, playing video, form input values.

**ID matching** is highest priority -- elements with matching IDs are updated in place.

**Warning:** morphing preserves user input values. It cannot be used to reset forms -- use `innerHTML`/`outerHTML` for
that.

**Excluding elements from morphing** -- add attributes to your server templates:

```html
<!-- freeze entire element: attrs + children unchanged -->
<custom-widget hx-morph-skip>...</custom-widget>

<!-- freeze only children: attrs still update -->
<lit-component hx-morph-skip-children>...</lit-component>
```

Or set CSS selectors globally in config:

```javascript
htmx.config.morphSkip         = 'custom-widget, .frozen';
htmx.config.morphSkipChildren = 'lit-component, .sortable';
```
