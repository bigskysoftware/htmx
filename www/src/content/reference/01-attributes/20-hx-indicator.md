---
title: "hx-indicator"
description: "Specifies loading indicator element"
---

The `hx-indicator` attribute selects elements that receive the request-state class during requests.

By default, htmx adds [`.htmx-request`](/reference/config/htmx-config-requestClass). Use it to show loading indicators.

## Syntax

```html
<button hx-post="/submit" hx-indicator="#spinner">Submit</button>
```

Set a CSS selector to choose indicator elements.

Use [`closest SELECTOR`](https://developer.mozilla.org/docs/Web/API/Element/closest) to choose the element itself or nearest matching ancestor.

Here is an example with a spinner adjacent to the button:

```html
<div>
    <button hx-post="/example" hx-indicator="#spinner">
        Post It!
    </button>
    <img  id="spinner" class="htmx-indicator" src="/img/bars.svg" alt="Loading..."/>
</div>
```

Use the `:append` modifier to keep parent indicators and add more selectors (the parent must expose its value with `:inherited`):

```html
<main hx-indicator:inherited="#global-indicator">
    ...
    <button hx-post="/example" hx-indicator:append="#spinner">
        Post It!
    </button>
    <img  id="spinner" class="htmx-indicator" src="/img/bars.svg" alt="Loading..."/>
</main>
```

When a request is in flight, this will cause the `htmx-request` class to be added to the `#spinner`
image. The image also has the `htmx-indicator` class on it, which defines an opacity transition
that will show the spinner:

```css
    .htmx-indicator {
        opacity: 0;
        visibility: hidden;
    }
    .htmx-request .htmx-indicator,
    .htmx-request.htmx-indicator {
        opacity: 1;
        visibility: visible;
        transition: opacity 200ms ease-in;
    }
```

This default `htmx-indicator` CSS also sets the visibility to hidden for better screen reader accessibility and does a
quick fade in of the opacity.

If you would prefer a different effect for showing the spinner you could define and use your own indicator
CSS. Here is an example that uses `display` rather than opacity (Note that we use `my-indicator` instead of
`htmx-indicator`):

```css
    .my-indicator{
        display:none;
    }
    .htmx-request .my-indicator,
    .htmx-request.my-indicator{
        display:inline;
    }
```

Note that the target of the `hx-indicator` selector need not be the exact element that you
want to show: it can be any element in the parent hierarchy of the indicator.

Finally, note that the `htmx-request` class by default is added to the element causing
the request, so you can place an indicator inside of that element and not need to explicitly
call it out with the `hx-indicator` attribute:

```html
<button hx-post="/example">
    Post It!
   <img  class="htmx-indicator" src="/img/bars.svg" alt="Loading..."/>
</button>
```

## Delaying the Indicator

For fast requests, briefly flashing a spinner can look jittery.  

You can control this by adding a delay to the CSS transition for showing the indicator:

```css
.htmx-indicator {
    opacity: 0;
    visibility: hidden;
}
.htmx-request .htmx-indicator,
.htmx-request.htmx-indicator {
    opacity: 1;
    visibility: visible;
    transition: opacity 200ms ease-in 200ms;  /* fade duration, then delay */
}
```

## Demo

This simulates what a spinner might look like in that situation:

```html
<button class="btn" classes="toggle htmx-request:3s">
    Post It!
   <img  class="htmx-indicator" src="/img/bars.svg" alt="Loading..."/>
</button>
```

## Notes

* In the absence of an explicit indicator, the `htmx-request` class will be added to the element triggering the
  request
* If you want to use your own CSS but still use `htmx-indicator` as class name, then you need to disable
  `includeIndicatorCSS`. See [Configuring htmx](/docs#configuration). The easiest way is to add this to the
  `<head>` of your HTML:

```html
<meta name="htmx-config" content='{"includeIndicatorCSS": false}'>
```

* If you want to use your own CSS and disable the built-in indicator styles entirely, set `includeIndicatorCSS` to
  `false` and host your own CSS file with a copy of your preferred `htmx-indicator` style from above
