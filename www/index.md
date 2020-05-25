---
layout: layout.njk
title: </> htmx - high power tools for html
---

<div class="dark-hero full-width" classes="add appear">
  <span class="logo dark">&lt;<a>/</a>&gt; <span class="no-mobile">htm<a>x</a></span></span>
  <sub class="no-mobile"><i>high power tools for HTML</i></sub>
</div>


## introduction

htmx is a set of extensions (attributes, request headers, etc.) that help you build 
[modern UI](/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of HTML. 

htmx is small ([~6k min.gz'd](https://unpkg.com/htmx.org/dist/)), 
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json),
[extendable](/extensions),
IE11 compatible & you can try it out quickly & easily, without a huge rewrite.

## quick start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/htmx.org@e0.0.4"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The `hx-post` and `hx-swap` attributes tell htmx:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the response"

htmx is based on [intercooler.js](http://intercoolerjs.org) and is the successor to that project.

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*