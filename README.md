![</> htmx](https://raw.githubusercontent.com/bigskysoftware/htmx/master/www/img/htmx_logo.1.png "high power tools for HTML")

*high power tools for HTML*

[![Gitter](https://badges.gitter.im/intercooler-js/Lobby.svg)](https://gitter.im/intercooler-js/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Netlify Status](https://api.netlify.com/api/v1/badges/dba3fc85-d9c9-476a-a35a-e52a632cef78/deploy-status)](https://app.netlify.com/sites/htmx/deploys)
[![Circle CI](https://circleci.com/gh/bigskysoftware/htmx.svg?style=svg)]()

## Introduction

htmx is a set of extensions (attributes, request headers, etc.) that help you build 
[modern UI](https://htmx.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of HTML. 

htmx is small ([~6k min.gz'd](https://unpkg.com/htmx.org/dist/)), IE11 compatible, [dependency-free](https://github.com/bigskysoftware/htmx/blob/master/package.json) 
& you can try it out quickly, without a huge rewrite.

## Quick Start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/htmx.org@0.0.3"></script>
  <!-- have a button POST a click via AJAX -->
  <button hx-post="/clicked" hx-swap="outerHTML">
    Click Me
  </button>
```

The `hx-post` and `hx-swap` attributes tell htmx:

> "When a user clicks on this button, issue an AJAX request to /example, and replace the entire button with the response"

htmx is based on [intercooler.js](http://intercoolerjs.org) and is the successor to that project.

## Website & Docs

[https://htmx.org](https://htmx.org)

[https://htmx.org/docs](https://htmx.org/docs)
