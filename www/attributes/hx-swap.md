---
layout: layout.njk
title: </> htmx - hx-swap
---

## `hx-swap`

The `hx-swap` attribute allows you to specify how the response will be swapped in relative to the
[target](/attributes/hx-target) of an AJAX request.

The possible values of this attribute are:

* `innerHTML` - The default, replace the inner html of the target element
* `outerHTML` - Replace the entire target element with the response
* `beforebegin` - Insert the response before the target element
* `afterbegin` - Insert the response before the first child of the target element
* `beforeend` - Insert the response after the last child of the target element
* `afterend` - Insert the response after the target element
* `delete` - Deletes the target element regardless of the response
* `none`- Does not append content from response (out of band items will still be processed).

These options are based on standard DOM naming and the 
[`Element.insertAdjacentHTML`](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML)
specification.

So in this code:

```html
  <div hx-get="/example" hx-swap="afterend">Get Some HTML & Append It</div>
```

The `div` will issue a request to `/example` and append the returned content after the `div`

### Modifiers

The `hx-swap` attributes supports modifiers for changing the behavior of the swap.  They are outlined below.

#### Timing: `swap` & `settle`

You can modify the amount of time that htmx will wait after receiving a response to swap the content
by including a `swap` modifier:

```html
  <!-- this will wait 1s before doing the swap after it is received -->
  <div hx-get="/example" hx-swap="innerHTML swap:1s">Get Some HTML & Append It</div>
```

Similarly, you can modify the time between the swap and the settle logic by including a `settle`
modifier:

```html
  <!-- this will wait 1s before doing the swap after it is received -->
  <div hx-get="/example" hx-swap="innerHTML settle:1s">Get Some HTML & Append It</div>
```

These attributes can be used to synchronize htmx with the timing of CSS transition effects.

#### Scrolling: `scroll` & `show`

You can also change the scrolling behavior of the target element by using the `scroll` and `show` modifiers, both
of which take the values `top` and `bottom`:

```html
  <!-- this fixed-height div will scroll to the bottom of the div after content is appended -->
  <div style="height:200px; overflow: scroll" 
       hx-get="/example" 
       hx-swap="beforeEnd scroll:bottom">
     Get Some HTML & Append It & Scroll To Bottom
  </div>
```

```html
  <!-- this will get some content and add it to #another-div, then ensure that the top of #another-div is visible in the 
       viewport -->
  <div hx-get="/example" 
       hx-swap="innerHTML show:top"
       hx-target="#another-div">
    Get Some Content
  </div>
```

If you wish to target a different element for scrolling or showing, you may place a CSS selector after the `scroll:`
or `show:`, followed by `:top` or `:bottom`:

```html
  <!-- this will get some content and swap it into the current div, then ensure that the top of #another-div is visible in the 
       viewport -->
  <div hx-get="/example" 
       hx-swap="innerHTML show:#another-div:top">
    Get Some Content
  </div>
```

You may also use `window:top` and `window:bottom` to scroll to the top and bottom of the current window.


```html
  <!-- this will get some content and swap it into the current div, then ensure that the viewport is scrolled to the
       very top -->
  <div hx-get="/example" 
       hx-swap="innerHTML show:window:top">
    Get Some Content
  </div>
```

Finally, htmx attempts to preserve focus between requests.  This will cause the focused element to scroll into view
which can be unwanted behavior in some cases.  To disable this, you can use `focus-scroll:false`:

```html
  <input hx-get="/validation" 
       hx-swap="outerHTML focus-scroll:false"/>
```

### Notes

* `hx-swap` is inherited and can be placed on a parent element
* The default value of this attribute is `innerHTML`
* The default swap delay is 0ms
* The default settle delay is 20ms
