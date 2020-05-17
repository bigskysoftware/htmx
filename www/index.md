---
layout: layout.njk
title: </> htmx - high power tools for html
---

<div class="dark-hero full-width" hx-classes="add appear">
  <span class="logo dark">&lt;<a>/</a>&gt; <span class="no-mobile">htm<a>x</a></span></span>
  <sub class="no-mobile"><i>high power tools for HTML</i></sub>
</div>


## Introduction

Htmx is a set of extensions (attributes, request headers, etc.) that help you build 
[modern UI](/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of HTML. 

Htmx is small ([~6k min.gz'd](https://unpkg.com/htmx.org/dist/)), IE11 compatible, [dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json) 
& you can try it out quickly, without a huge rewrite.

## Quick Start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/htmx.org@0.0.4"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The `hx-post` and `hx-swap` attributes tell htmx:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the response"

Htmx is based on [intercooler.js](http://intercoolerjs.org) and is the successor to that project.

