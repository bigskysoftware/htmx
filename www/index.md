---
layout: layout.njk
title: </> htmx - high power tools for html
---

<div class="dark-hero full-width" classes="add appear">
  <span class="logo dark">&lt;<a>/</a>&gt; <span class="no-mobile">htm<a>x</a></span></span>
  <sub class="no-mobile"><i>high power tools for HTML</i></sub>
</div>


## introduction

htmx allows you to access  [AJAX](https://htmx.org/docs#ajax), [CSS Transitions](https://htmx.org/docs#css_transitions),  [WebSockets](https://htmx.org/docs#websockets) and [Server Sent Events](https://htmx.org/docs#sse) 
directly in HTML, using [attributes](https://htmx.org/reference#attributes), so you can build 
[modern user interfaces](https://htmx.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~10k min.gz'd](https://unpkg.com/htmx.org/dist/)), 
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json),
[extendable](https://htmx.org/extensions) & 
IE11 compatible

## motivation

* Why should only `<a>` and `<form>` be able to make HTTP requests?
* Why should only `click` & `submit` events trigger them?
* Why should only GET & POST be available?
* Why should you only be able to replace the *entire* screen?

By removing these arbitrary constraints htmx completes HTML as a 
[hypertext](https://en.wikipedia.org/wiki/Hypertext)

## quick start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/htmx.org@1.6.1"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The [`hx-post`](https://htmx.org/attributes/hx-post) and [`hx-swap`](https://htmx.org/attributes/hx-swap) attributes tell htmx:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the response"

htmx is the successor to [intercooler.js](http://intercoolerjs.org)

Read the [docs introduction](/docs#introduction) for a more in-depth... introduction.

<div class="row">
<div class="col 2" style="padding: 0">

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*

</div>
<div class="col 2" style="padding: 0">

## support

If you use htmx commercially & wish to support the 
project you can sponsor us on [Github](https://github.com/sponsors/bigskysoftware)

For consulting & training on htmx, [contact us](mailto:consulting@bigsky.software)


</div>