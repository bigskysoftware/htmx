---
layout: layout.njk
title: </> htmx - high power tools for html
---

<div class="dark-hero full-width" classes="add appear">
  <span class="logo dark">&lt;<a>/</a>&gt; <span class="no-mobile">htm<a>x</a></span></span>
  <sub class="no-mobile"><i>high power tools for HTML</i></sub>
</div>


## introduction

htmx gives you access to  [AJAX](https://htmx.org/docs#ajax), [CSS Transitions](https://htmx.org/docs#css_transitions),  [WebSockets](https://htmx.org/docs#websockets) and [Server Sent Events](https://htmx.org/docs#sse) 
directly in HTML, using [attributes](https://htmx.org/reference#attributes), so you can build 
[modern user interfaces](https://htmx.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~10k min.gz'd](https://unpkg.com/htmx.org/dist/)), 
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json),
[extendable](https://htmx.org/extensions) & 
IE11 compatible

## motivation

* Why should only [`<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a) and [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) be able to make HTTP requests?
* Why should only [`click`](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event) & [`submit`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) events trigger them?
* Why should only [`GET`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) & [`POST`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) methods be [available](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)?
* Why should you only be able to replace the **entire** screen?

By removing these arbitrary constraints, htmx completes HTML as a [hypertext](https://en.wikipedia.org/wiki/Hypertext)

## quick start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/htmx.org@1.7.0"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The [`hx-post`](https://htmx.org/attributes/hx-post) and [`hx-swap`](https://htmx.org/attributes/hx-swap) attributes on
this button tell htmx:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the HTML response"

htmx is the successor to [intercooler.js](http://intercoolerjs.org)

Read the [docs introduction](/docs#introduction) for a more in-depth... introduction.

## sponsors

Thank you to our corporate sponsors!

<div class="row" style="text-align: center">
<div class="col 2" style="padding: 16px">

<a href="https://www.commspace.co.za/"><img src="/img/commspace.svg" style="width:90%"></a>

</div>

<div class="col 2" style="padding: 16px">

<a href="https://bigsky.software"><img src="/img/bss.png" style="width:90%"></a>

</div>

<div class="col 2" style="padding: 16px">

<a href="https://craftcms.com"><img src="/img/logo-craft-cms.svg" style="width:90%"></a>

</div>
</div>

If you use htmx commercially & wish to support the 
project you can sponsor us via [Github](https://github.com/sponsors/bigskysoftware)

[Consulting](mailto:htmx@bigsky.software) is available.

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*
