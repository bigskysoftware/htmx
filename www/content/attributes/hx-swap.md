+++
title = "hx-swap"
description = """\
  The hx-swap attribute in htmx allows you to specify the 'swap strategy', or how the response will be swapped in \
  relative to the target of an AJAX request. The default swap strategy is `innerHTML`."""
+++

The `hx-swap` attribute allows you to specify how the response will be swapped in relative to the
[target](@/attributes/hx-target.md) of an AJAX request. If you do not specify the option, the default is
`htmx.config.defaultSwapStyle` (`innerHTML`).

The possible values of this attribute are:

* `innerHTML` - Replace the inner html of the target element
* `outerHTML` - Replace the entire target element with the response
* `innerMorph` - Morphs the inner HTML of the target to the new content (see [Morphing](@/morphing.md) for details)
* `outerMorph` - Morphs the outer HTML of the target to the new content (see [Morphing](@/morphing.md) for details)
* `textContent` - Replace the text content of the target element, without parsing the response as HTML
* `before` or `beforebegin` - Insert the response before the target element
* `prepend` or `afterbegin` - Insert the response before the first child of the target element
* `append` or `beforeend` - Insert the response after the last child of the target element
* `after` or `afterend` - Insert the response after the target element
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

#### Transition: `transition`

If you want to use the new [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) API
when a swap occurs, you can use the `transition:true` option for your swap.  You can also enable this feature globally by
setting the `htmx.config.transitions` config setting to `true`.

Note that the default view transition is a cross-fade effect that takes
[250 milliseconds](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using) to complete.  During a view
transition, the application will not allow user interactions and, thus, can make the web application feel unresponsive.

We strongly recommend a much lower transition time, in the sub-50ms range.  Here is how you would update the default
view transition to take only 20 milliseconds:

```css
  ::view-transition-group(*) {
    animation-duration: 20ms;
  }
```

This affords a much better user experience when using view transitions in most cases.


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
  <!-- this will wait 1s before doing the settle after it is received -->
  <div hx-get="/example" hx-swap="innerHTML settle:1s">Get Some HTML & Append It</div>
```

These attributes can be used to synchronize htmx with the timing of CSS transition effects.

#### Title: `ignoreTitle`

By default, htmx will update the title of the page if it finds a `<title>` tag in the response content.  You can turn
off this behavior by setting the `ignoreTitle` option to true.

#### Scrolling: `scroll` & `show`

You can also change the scrolling behavior of the target element by using the `scroll` and `show` modifiers, both
of which take the values `top` and `bottom`:

```html
  <!-- this fixed-height div will scroll to the bottom of the div after content is appended -->
  <div style="height:200px; overflow: scroll" 
       hx-get="/example" 
       hx-swap="beforeend scroll:bottom">
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

#### Unwrapping: `strip`

The `strip` modifier allows you to control whether the outer element of the response content should be removed before swapping. This is useful when you want to swap only the children of the response's root element.

If the server response is:
```html
<div class="wrapper">
  <p>Content 1</p>
  <p>Content 2</p>
</div>
```

With `strip:true`, only the `<p>` elements are swapped in.
With `strip:false`, the entire `<div class="wrapper">` and its contents are swapped in.

## Notes

* The default value of this attribute is `innerHTML`
* Due to DOM limitations, it’s not possible to use the `outerHTML` method on the `<body>` element.
  htmx will change `outerHTML` on `<body>` to use `innerHTML`.
* The default swap delay is 0ms
* The default settle delay is 1ms
