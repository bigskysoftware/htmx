[![</> htmx](https://raw.githubusercontent.com/bigskysoftware/htmx/master/www/img/htmx_logo.1.png "high power tools for HTML")]()

*high power tools for HTML*

[![Gitter](https://badges.gitter.im/intercooler-js/Lobby.svg)](https://gitter.im/intercooler-js/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Netlify Status](https://api.netlify.com/api/v1/badges/dba3fc85-d9c9-476a-a35a-e52a632cef78/deploy-status)](https://app.netlify.com/sites/htmx/deploys)
[![Circle CI](https://circleci.com/gh/bigskysoftware/htmx.svg?style=svg)]()

## introduction

htmx is a set of HTML extensions give you to access to [AJAX](https://htmx.org/docs#ajax), 
[WebSockets](https://htmx.org/docs#websockets) and [Server Sent Events](https://htmx.org/docs#sse) 
via [attributes](https://htmx.org/reference#attributes), allowing you to build [modern UI](https://htmx.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~6k min.gz'd](https://unpkg.com/htmx.org/dist/)), 
[dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json),
[extendable](https://htmx.org/extensions),
IE11 compatible & you can try it out quickly, without a huge rewrite

## quick start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/htmx.org@0.0.4"></script>
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
* please include test cases in `/test` and docs in `/www`
* if you are adding a feature, consider doing it as an [extension](https://htmx.org/extensions) instead to
keep the core htmx code tidy
* development pull requests should be against the `dev` branch, docs fixes can be made directly against `master`

## haiku

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*