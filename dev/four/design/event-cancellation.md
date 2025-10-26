# Event Cancellation Design

## Problem Statement

When htmx intercepts browser events (clicks on links, form submissions), it needs to prevent the browser's default behavior (navigation, form POST) to handle the request via AJAX instead. The challenge is determining **when** to call `preventDefault()` without breaking legitimate use cases.

## Core Principle

**Cancel an event if and only if it would trigger default browser behavior that htmx is replacing.**

Do not try to be "smart" about event types. Trust the user's `hx-trigger` specification.

## Implementation

### Two-Step Check

```javascript
// Step 1: Early exit for modifier keys
__isModifierKeyClick(evt) {
    return evt.type === 'click' && (evt.ctrlKey || evt.metaKey || evt.shiftKey)
}

// Step 2: Determine if event should be cancelled
__shouldCancel(evt) {
    const elt = evt.currentTarget
    
    // Cancel submit events on forms
    if (evt.type === 'submit' && elt?.tagName === 'FORM') {
        return true
    }
    
    // Cancel clicks on submit buttons that have a form
    if (evt.type === 'click' && evt.button === 0) {
        const btn = elt?.closest?.('button, input[type="submit"], input[type="image"]')
        if (btn && !btn.disabled) {
            const form = btn.form || btn.closest('form')
            if (form && (btn.type === 'submit' || btn.type === 'image' || 
                        (!btn.type && btn.tagName === 'BUTTON'))) {
                return true
            }
        }
        
        // Cancel clicks on links (except fragment-only anchors)
        const link = elt?.closest?.('a')
        if (link && link.href) {
            const href = link.getAttribute('href')
            if (href === '#' || !href.startsWith('#')) {
                return true
            }
        }
    }
    
    return false
}
```

### Usage in Event Handler

```javascript
async handleTriggerEvent(elt, cfg, evt) {
    if (!elt.isConnected) return
    
    if (this.__isModifierKeyClick(evt)) return  // Let browser handle Ctrl+Click, etc.
    
    if (this.__shouldCancel(evt)) evt.preventDefault()  // Cancel default behavior
    
    // ... proceed with htmx request
}
```

## Why This Design is Better

### 1. Uses `evt.currentTarget` Instead of Passing Element

**Old htmx:** `shouldCancel(evt, elt)` - passed element separately

**htmx4:** Uses `evt.currentTarget` directly

**Why better:**
- `currentTarget` is the element the listener is attached to (respects `from:` modifier)
- More correct for event delegation scenarios
- Simpler API - one parameter instead of two

### 2. No Keyboard Event Logic

**Old htmx had:**
```javascript
__isFormSubmissionKeyEvent(evt) {
    return (evt.key === 'Enter') && 
           evt.target.matches('input[type="text"]') &&
           evt.target.closest('form') && ...
}
```

**htmx4:** Removed entirely

**Why better:**
- **Redundant:** Browsers already convert Enter → submit event on forms
- **Wrong:** If user listens to `keydown`, they want ALL keydown events
- **Confusing:** Mixing event type concerns in cancellation logic

**Example scenarios:**
```html
<!-- Scenario 1: Default form (listens to submit) -->
<form hx-post="/submit">
  <input type="text">
</form>
<!-- Enter → browser fires submit → shouldCancel returns true ✓ -->

<!-- Scenario 2: Explicit keyboard trigger -->
<input hx-get="/search" hx-trigger="keyup[key=='Enter']">
<!-- User wants keyup events, don't interfere ✓ -->
```

### 3. Handles `form` Attribute Correctly

**Old htmx:** Only checked `btn.closest('form')`

**htmx4:** Checks `btn.form || btn.closest('form')`

**Why better:**
- `btn.form` is the DOM property that handles the `form` attribute
- Supports buttons outside forms: `<button form="myform">`
- More spec-compliant

### 4. Clearer Link Logic

**Old htmx:** 
```javascript
const samePageAnchor = /^#.+/
if (!samePageAnchor.test(href)) return true
```

**htmx4:** 
```javascript
const isFragmentOnly = href && href.startsWith('#') && href.length > 1
if (!isFragmentOnly) return true
```

**Why better:**
- More explicit: "is this a fragment-only link?"
- No regex needed
- Self-documenting code
- Same behavior: allows `#section`, cancels `#` and full URLs

**Note on fragment links:** While this means the browser may scroll before htmx swaps content, this is intentional:
- Supports progressive enhancement (works without JS)
- Common pattern for tabs/accordions that should function even if htmx fails
- After swap, htmx's anchor handling will scroll to the correct element anyway

### 5. Separation of Concerns

**Modifier key check is separate:**
```javascript
if (this.__isModifierKeyClick(evt)) return  // Early exit
if (this.__shouldCancel(evt)) evt.preventDefault()  // Then cancel
```

**Why better:**
- Modifier keys mean "open in new tab" - completely different intent
- Don't even call shouldCancel, just return immediately
- Clearer code flow

## What Gets Cancelled

| Event Type | Element | Condition | Cancel? |
|------------|---------|-----------|---------|
| `submit` | `<form>` | Always | ✓ |
| `click` | `<button>` in form | type=submit/image or no type | ✓ |
| `click` | `<input type=submit>` in form | - | ✓ |
| `click` | `<button form="id">` | type=submit or no type | ✓ |
| `click` | `<button type=button>` | - | ✗ |
| `click` | `<button type=reset>` | - | ✗ |
| `click` | `<button disabled>` | - | ✗ |
| `click` | `<a href="/path">` | - | ✓ |
| `click` | `<a href="#">` | Bare hash | ✓ |
| `click` | `<a href="#section">` | Fragment identifier | ✗ |
| `click` | Any element | button !== 0 (right/middle) | ✗ |
| `click` | Any element | Ctrl/Meta/Shift pressed | ✗ |
| `keydown` | Any element | - | ✗ |

## Edge Cases Handled

1. **Nested elements:** `<a href="/"><button>Click</button></a>`
   - Uses `closest()` to find parent link/button/form
   - Cancels correctly regardless of nesting

2. **External form buttons:** `<button form="myform">`
   - Checks `btn.form` property (DOM spec)
   - Works even when button is outside form element

3. **Disabled buttons:** `<button disabled>`
   - Explicitly checks `!btn.disabled`
   - Doesn't cancel (browser won't submit anyway)

4. **Fragment anchors:** `<a href="#section">`
   - Allows normal in-page navigation (browser scrolls to element)
   - Only cancels `#` (bare hash) or full URLs
   - Rationale: Progressive enhancement - works without JS, common pattern for tabs/accordions

5. **Event delegation:** `hx-trigger="click from:body"`
   - Uses `evt.currentTarget` (where listener attached)
   - Not `evt.target` (where click originated)

## Migration from Old htmx

### Removed Functions
- `__isNavigationClick()` - merged into `__shouldCancel()`
- `__isFormSubmissionClick()` - merged into `__shouldCancel()`
- `__isFormSubmissionKeyEvent()` - removed (unnecessary)

### Behavioral Changes
- **Keyboard events:** No longer automatically cancelled
  - If you want form submission, use `hx-trigger="submit"` (default for forms)
  - If you want keyboard handling, use `hx-trigger="keydown"` and handle yourself

### Compatibility
- All standard use cases work identically
- Edge cases (form attribute, nested elements) work better
- Explicit keyboard triggers now work correctly

## Testing

See `test/tests/unit/shouldCancel.js` for comprehensive test coverage including:
- All button types (submit, reset, button)
- Form attribute handling
- Disabled buttons
- Nested elements
- Fragment anchors
- Modifier keys
- Right/middle clicks
