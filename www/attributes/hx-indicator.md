---
layout: layout.njk
title: </> htmx - hx-indicator
---

## `hx-indicator`

The `hx-indicator` attribute allows you to specify the element that will have the `htmx-request` class
added to it for the duration of the request. This can be used to show spinners or progress indicators
while the request is in flight.

The value of this attribute is a CSS query selector of the element or elements to apply the class to.

Here is an example with a spinner adjacent to the button:

```html
<div>
    <button hx-post="/example" hx-indicator="#spinner">
        Post It!
    </button>
    <img  id="spinner" class="htmx-indicator" src="/img/bars.svg"/>
</div>
```

When a request is in flight, this will cause the `htmx-request` class to be added to the `#spinner`
image.  The image also has the `htmx-indicator` class on it, which defines an opacity transition
that will show the spinner:

```css
    .htmx-indicator{
        opacity:0;
        transition: opacity 500ms ease-in;
    }
    .htmx-request .htmx-indicator{
        opacity:1
    }
    .htmx-request.htmx-indicator{
        opacity:1
    }
```

If you would prefer a different effect for showing the spinner you could define and use your own indicator
CSS.  Here is an example that uses `display` rather than opacity:

```css
    .my-indicator{
        display:none;
    }
    .htmx-request .my-indicator{
        display:inline;
    }
    .htmx-request.my-indicator{
        display:inline;
    }
```

Note that the target of the `hx-indicator` selector need not be the exact element that you
want to show: it can be any element in the parent hierarchy of the indicator.

Finally, note that the `htmx-request` class by default is added to the element causing
the request, so you can place an indicator inside of that element and not need to explictly
call it out with the `hx-indicator` attribute:

```html
<button hx-post="/example">
    Post It!
   <img  class="htmx-indicator" src="/img/bars.svg"/>
</button>
```

### Demo

This simulates what a spinner might look like in that situation:

<button class="btn" classes="toggle htmx-request:3s">
    Post It!
   <img  class="htmx-indicator" src="/img/bars.svg"/>
</button>

### Notes

* `hx-indicator` is inherited and can be placed on a parent element
* In the absence of an explicit indicator, the `htmx-request` class will be added to the element triggering the
  request
