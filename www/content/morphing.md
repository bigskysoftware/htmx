+++
title = "Morphing"
[extra]
table_of_contents = true
+++

## Introduction

Morphing is a DOM manipulation technique where htmx intelligently updates existing elements by comparing the old and new DOM trees and making minimal changes to transform one into the other. Unlike traditional swap methods that completely replace elements, morphing preserves as much of the existing DOM as possible, resulting in smoother transitions and better preservation of element state (like focus, scroll position, and CSS animations).

htmx includes a built-in morphing algorithm accessible via the `innerMorph` and `outerMorph` swap styles.

## Swap Styles

- **`innerMorph`**: Morphs only the children of the target element, leaving the target itself unchanged
- **`outerMorph`**: Morphs the target element itself along with its children

```html
<div id="content" hx-get="/updates" hx-swap="innerMorph">...</div>
<div id="content" hx-get="/updates" hx-swap="outerMorph">...</div>
```

## How Morphing Works

The morphing algorithm works by:

1. **Comparing** the old DOM tree with the new DOM tree
2. **Matching** elements between the old and new trees based on:
   - Element ID (highest priority - elements with matching IDs are always preserved)
   - Tag name and position (for elements without IDs)
   - Structural similarity
3. **Updating** matched elements by:
   - Syncing attributes (except those in `morphIgnore`)
   - Recursively morphing children
   - Preserving elements that haven't changed
4. **Reordering** elements when necessary (elements with IDs can be moved to new positions)
5. **Adding** new elements that don't exist in the old tree
6. **Removing** old elements that don't exist in the new tree

This approach minimizes DOM changes, which helps preserve:
- **Element identity**: The same DOM node is reused, not replaced
- **Element focus**: Focused elements remain focused
- **Scroll positions**: Scroll state is maintained
- **CSS transition states**: Ongoing animations continue
- **Form input values**: User-entered values are intelligently preserved (see below)
- **Event listeners**: Both htmx and native JavaScript event listeners remain attached

## Configuration Options

htmx provides four configuration options to control morphing behavior:

### `htmx.config.morphScanLimit`

A number that limits how many siblings to scan when looking for matching elements during morphing. The default is `10`.

```javascript
// Increase scan limit for large lists
htmx.config.morphScanLimit = 100;
```

**How it works:** When morphing tries to match an element from the new content with an element in the old content, it scans through siblings to find exact matches. This limit prevents excessive scanning in very large DOM trees.

**Important:** Elements with matching IDs will always be found regardless of the scan limit, as ID-based matches are prioritized and continue scanning even after the limit is reached.

**Use cases:**
- **Large lists**: Increase the limit when morph accuracy is needed with long lists of items without IDs
- **Performance tuning**: Decrease the limit to improve performance if morphing is slow
- **Default behavior**: Most applications don't need to change this value

### `htmx.config.morphIgnore`

An array of attribute names that should be ignored when morphing elements. By default, this is set to `["data-htmx-powered"]` to prevent htmx from overwriting its own internal attributes.

```javascript
// Add custom attributes to ignore during morphing
htmx.config.morphIgnore = ["data-htmx-powered", "data-custom-id", "data-state"];
```

```html
<!-- Or configure via meta tag -->
<meta name="htmx-config" content='{"morphIgnore": ["data-htmx-powered", "data-custom-id"]}'>
```

**Use case:** Preserve certain attributes that should not be updated during morphing, such as client-side state tracking attributes.

### `htmx.config.morphSkip`

A CSS selector that identifies elements that should be completely skipped during morphing. When an element matches this selector, it will not be morphed at all - it will be left exactly as is.

```javascript
// Skip morphing for elements with specific class
htmx.config.morphSkip = ".no-morph";
```

```html
<div hx-get="/updates" hx-swap="innerMorph">
  <div class="no-morph">
    This element will never be morphed
  </div>
  <div>
    This element will be morphed normally
  </div>
</div>
```

**Use cases:**
- **Third-party widgets**: Preserve complex widgets that shouldn't be re-initialized
- **Active animations**: Elements with ongoing CSS or JavaScript animations
- **Client-side state**: Elements with complex state that would be lost on re-creation
- **Performance**: Skip expensive DOM operations for elements that don't need updates

### `htmx.config.morphSkipChildren`

A CSS selector that identifies elements whose children (Light DOM) should not be morphed. The element itself may be updated (attributes), but its children will be left untouched.

This is particularly useful for **custom web components** where you want to update the component's attributes but preserve the Light DOM children that the component manages internally.

```javascript
// Prevent morphing of Light DOM children in custom web components
htmx.config.morphSkipChildren = "my-component, other-component";
```

```html
<div hx-get="/updates" hx-swap="innerMorph">
  <!-- Component attributes will update, but children are preserved -->
  <my-component data-value="123">
    <div class="internal-state">Managed by component</div>
    <p>This Light DOM content won't be morphed</p>
  </my-component>
</div>
```

**Use cases:**
- **Web Components**: Preserve Light DOM children that the component's Shadow DOM references or manipulates
- **Rich text editors**: Update container attributes while preserving the editor's internal DOM structure
- **Canvas/chart containers**: Update configuration attributes without disrupting rendered content
- **Third-party widgets**: Allow attribute updates while protecting widget-managed children

## Examples

### Basic Morphing

```html
<div id="user-list" hx-get="/users" hx-trigger="every 5s" hx-swap="innerMorph">
  <div id="user-1">Alice</div>
  <div id="user-2">Bob</div>
</div>
```

When the server returns updated content, htmx will:
- Keep existing user divs if they're still present
- Update their content if changed
- Add new users
- Remove users that are no longer in the list

### Preserving Form State

```html
<form hx-get="/form-update" hx-swap="outerMorph">
  <input type="text" id="username" name="username">
  <input type="email" id="email" name="email">
  <button type="submit">Submit</button>
</form>
```

Morphing intelligently preserves form input values:
- **When the value attribute is unchanged**: User-entered values are preserved (e.g., user types "John" but server still sends `value=""`)
- **When the value attribute changes**: The new value from the server is applied (e.g., server validation updates the value)
- **Checkboxes and radio buttons**: User state is preserved when the `checked` attribute hasn't changed
- **Textareas**: User-entered content is preserved when the server content is unchanged

> **Warning**: Because morphing preserves user-entered input values, you **cannot** use morphing to reset a form. If the server returns a form with empty `value=""` attributes, but the user has typed values into those fields, morphing will keep the user's values. To reset a form, either:
> - Use a non-morphing swap style like `innerHTML` or `outerHTML`
> - Manually reset the form with JavaScript: `form.reset()`



### Preserving Web Component Light DOM

```html
<script>
  // Prevent morphing children of all custom web components
  htmx.config.morphSkipChildren = "user-card, product-list, data-table";
</script>

<div hx-get="/dashboard" hx-swap="innerMorph">
  <!-- Attributes update, but Light DOM children are preserved -->
  <user-card user-id="123" status="active">
    <img slot="avatar" src="/avatar.jpg">
    <span slot="name">John Doe</span>
  </user-card>
  
  <!-- This component's children will be morphed normally -->
  <div class="stats">
    <p>Regular content that morphs</p>
  </div>
</div>
```

When the server returns updated HTML with `user-id="456"`, the `user-card` element's attributes will update, but the `<img>` and `<span>` children (Light DOM) will remain untouched. This is crucial for web components that use slots or manipulate their Light DOM children.

## Morphing vs. Other Swap Styles

| Swap Style | Behavior |
|------------|----------|
| `innerHTML` / `outerHTML` | Completely replaces content |
| `innerMorph` / `outerMorph` | Intelligently updates content, preserving element identity and state |

**When to use morphing:** Preserve form state, event listeners, focus, scroll position, and ongoing animations.

**When NOT to use morphing:** Resetting forms, clearing user input, or when simple replacement is faster.

## Morphing vs. Idiomorph Extension

The built-in morphing is sufficient for most applications. The [idiomorph extension](@/extensions/idiomorph.md) provides a more advanced algorithm for complex DOM transformations.

## Best Practices

1. **Use stable IDs** for elements you want preserved - they can be moved anywhere and will still match
2. **Don't use morphing to reset forms** - use `innerHTML`/`outerHTML` or `form.reset()` instead
3. **Use `morphSkip` sparingly** - only for elements that must be frozen
4. **Keep consistent HTML structure** between updates for better morphing results
5. **Test with realistic data** - morphing behavior varies based on content structure

## Important Considerations

### Form Input Preservation

Morphing's intelligent input value preservation is usually beneficial, but can be surprising in certain scenarios:

**Problem:** If a user types "John" and submits, morphing will preserve "John" even if the server returns `value=""`.

**Solutions:**
```html
<!-- Option 1: Use non-morphing swap -->
<form hx-post="/submit" hx-swap="outerHTML">

<!-- Option 2: Manual reset -->
<form hx-post="/submit" hx-swap="outerMorph" hx-on::after-request="this.reset()">
```

## Notes

- Elements with IDs are always preserved and can be reordered anywhere in the tree
- Element reordering uses `moveBefore()` when available (modern browsers), with `insertBefore()` as fallback
- Both methods preserve element identity and event listeners during reordering but modern browsers may preserve more state
- Elements without IDs are matched by tag name and position
- `data-htmx-powered` is automatically in the `morphIgnore` list
- Morphing respects the `hx-preserve` attribute
