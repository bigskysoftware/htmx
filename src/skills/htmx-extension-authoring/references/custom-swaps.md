# Custom Swap Strategies

## Custom Swap Strategies

```javascript
handle_swap: (swapStyle, target, fragment, swapSpec) => {
    if (swapStyle === "my-custom-swap") {
        // fragment is a DocumentFragment with the response content
        target.replaceChildren(fragment);
        return true; // Signal that this swap was handled
    }
    return false; // Not our swap style, let htmx handle it
},
```

Usage in HTML:
```html
<div hx-get="/data" hx-swap="my-custom-swap">Load</div>
```
