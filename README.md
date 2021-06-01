[![</> htmx](https://raw.githubusercontent.com/bigskysoftware/htmx/master/www/img/htmx_logo.1.png "high power tools for HTML")](https://htmx.org)

*high power tools for HTML*

[![Discord](https://img.shields.io/discord/725789699527933952)](https://htmx.org/discord)
[![Netlify](https://img.shields.io/netlify/dba3fc85-d9c9-476a-a35a-e52a632cef78)](https://app.netlify.com/sites/htmx/deploys)
[![Bundlephobia](https://badgen.net/bundlephobia/dependency-count/htmx.org)](https://bundlephobia.com/result?p=htmx.org)
[![Bundlephobia](https://badgen.net/bundlephobia/minzip/htmx.org)](https://bundlephobia.com/result?p=htmx.org)


## introduction

htmx allows you to access  [AJAX](https://htmx.org/docs#ajax), [CSS Transitions](https://htmx.org/docs#css_transitions),
[WebSockets](https://htmx.org/docs#websockets) and [Server Sent Events](https://htmx.org/docs#sse) 
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
  <script src="https://unpkg.com/htmx.org@1.4.1" ></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The [`hx-post`](https://htmx.org/attributes/hx-post) and [`hx-swap`](https://htmx.org/attributes/hx-swap) attributes tell htmx:

> "When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the response"

htmx is the successor to [intercooler.js](http://intercoolerjs.org)

## website & docs

* <https://htmx.org>
* <https://htmx.org/docs>

## contributing

* please write code, including tests, in ES5 for [IE 11 compatibility](https://stackoverflow.com/questions/39902809/support-for-es6-in-internet-explorer-11)
* please include test cases in [`/test`](https://github.com/bigskysoftware/htmx/tree/dev/test) and docs in [`/www`](https://github.com/bigskysoftware/htmx/tree/dev/www)
* if you are adding a feature, consider doing it as an [extension](https://htmx.org/extensions) instead to
keep the core htmx code tidy
* development pull requests should be against the `dev` branch, docs fixes can be made directly against `master`
* No time? Then [become a sponsor](https://github.com/sponsors/bigskysoftware#sponsors)

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*
