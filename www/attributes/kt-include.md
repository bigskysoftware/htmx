---
layout: layout.njk
title: </> kutty - kt-indicator
---

## `kt-indicator`

The `kt-indicator` attribute allows you to specify the element that will have the `kutty-request` class
added to it for the duration of the request. This can be used to show spinners or progress indicators
while the request is in flight.

The value of this attribute is a CSS query selector of the element or elements to apply the class to.

Here is an example with a spinner in a parent div:

```html
<style>
.spinner {
    opacity: 0;
}
.kutty-request .spinner {
    opacity: 1;
    transition: opacity 500ms ease-in;
}
</style>

<div id="parent-div">
    <button kt-post="/example" kt-indicator="#parent-div">
        Post It!
    </button>
    <img class="spinner" src="spinner.gif"/>
</div>
```

In addition to the normal variables included with this request, the value of the element with the
id `hidden-value` will be included.

### Notes

* In the absence of an explicit indicator, the `kutty-request` class will be added to the element triggering the
  request