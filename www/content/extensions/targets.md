+++
title = "htmx Targets Extension"
+++

The `hx-targets` extension adds an `hx-targets` attribute that swaps the same response content into multiple elements
matching a CSS selector. This is useful when you want to update several elements at once with the same response.

## Installing

Include the extension after htmx:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-targets.js"></script>
```

## Usage

Add an `hx-targets` attribute with a CSS selector to any element that makes an htmx request. The response will be
swapped into every element matching that selector, using the element's normal `hx-swap` strategy.

```html
<button hx-get="/api/notification" hx-targets=".alert-box">
    Refresh All Alerts
</button>

<div class="alert-box">Alert 1</div>
<div class="alert-box">Alert 2</div>
<div class="alert-box">Alert 3</div>
```

When the button is clicked, the response from `/api/notification` is swapped into all three `.alert-box` elements.

### Inheritance

The `hx-targets` attribute is inherited, so you can set it on a parent element:

```html
<div hx-targets=".card-body">
    <button hx-get="/api/content">Update All Cards</button>
    <button hx-get="/api/reset">Reset All Cards</button>

    <div class="card"><div class="card-body">Card 1</div></div>
    <div class="card"><div class="card-body">Card 2</div></div>
</div>
```

Both buttons will swap their response into all `.card-body` elements.

### Extended Selectors

The `hx-targets` attribute supports htmx's extended selector syntax, including `closest`, `find`, `next`, and
`previous`:

```html
<div class="container">
    <button hx-get="/api/status" hx-targets="find .status">
        Update Statuses
    </button>
    <span class="status">OK</span>
    <span class="status">OK</span>
</div>
```

### Interaction with hx-target

When `hx-targets` is present, it overrides `hx-target`. The swap style from `hx-swap` (default: `innerHTML`) is
applied to each matched element.

```html
<button hx-get="/api/time" hx-swap="innerHTML" hx-targets=".clock">
    Sync Clocks
</button>

<span class="clock">--:--</span>
<span class="clock">--:--</span>
```

## How It Works

The extension hooks into the `htmx_before_swap` event. When `hx-targets` is set on the source element:

1. All elements matching the selector are found
2. The main swap task is replaced with one task per matched element
3. The response fragment is cloned for each target so every element receives the full response content

## Limitations

* If the selector matches zero elements, a warning is logged and the swap proceeds as normal (falling back to `hx-target` or the default target).
* Each target receives a clone of the full response — there is no way to distribute different parts of the response to different targets. Use `<hx-partial>` or `hx-swap-oob` for that.
