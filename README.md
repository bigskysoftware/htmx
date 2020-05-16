![</> kutty](https://github.com/bigskysoftware/kutty/raw/master/www/img/kutty_logo.1.png "high power tools for HTML")

*high power tools for HTML*

## Introduction

Kutty is a set of extensions (attributes, request headers, etc.) that help you build 
[modern UI](https://kutty.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and 
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of HTML. 

Kutty is small ([~6k min.gz'd](https://unpkg.com/kutty.org/dist/)), IE11 compatible, [dependency-free](https://github.com/bigskysoftware/kutty/blob/master/package.json) 
& you can try it out quickly, without a huge rewrite.

## Quick Start

```html
  <!-- Load from unpkg -->
  <script src="https://unpkg.com/kutty.org@0.0.2"></script>
  <!-- have a button POST a click via AJAX -->
  <button kt-post="/clicked" kt-swap="outerHTML">
    Click Me
  </button>
```

The `kt-post` and `kt-swap` attributes tell kutty:

> "When a user clicks on this button, issue an AJAX request to /example, and replace the entire button with the response"

Kutty is based on [intercooler.js](http://intercoolerjs.org) and is the successor to that project.

## Website & Docs

[https://kutty.org](https://kutty.org)

[https://kutty.org/docs](https://kutty.org/docs)
