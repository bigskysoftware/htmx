---
layout: layout.html
title: HTMx - HTML Extensions
---

HTMx is a set of extensions to HTML that bring many of the useful features of modern web browsers directly
into HTML. It fills gaps in functionality found in standard HTML, dramatically expanding its expressiveness while
retaining the fundamental simplicity of declarative hypertext.</p>

Here is a simple example of HTMx in action:

``` html
  <button hx-get="/example" hx-target="#myDiv">
    Click Me
  </button>
```

This example issues an AJAX request to <code>/example</code> when a user clicks on it, and swaps the response
HTML into the element with the id `myDiv`

HTMx is based on [intercooler.js](http://intercoolerjs.org), and aims to be a minimalist &amp;
dependency free successor to that project.
