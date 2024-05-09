[![htmx](https://raw.githubusercontent.com/bigskysoftware/htmx/master/www/static/img/htmx_logo.1.png "high power tools for HTML")](https://htmx.org)

# high power tools for HTML

[![Discord](https://img.shields.io/discord/725789699527933952)](https://htmx.org/discord)
[![Netlify](https://img.shields.io/netlify/dba3fc85-d9c9-476a-a35a-e52a632cef78)](https://app.netlify.com/sites/htmx/deploys)
[![Bundlephobia](https://badgen.net/bundlephobia/dependency-count/htmx.org)](https://bundlephobia.com/result?p=htmx.org)
[![Bundlephobia](https://badgen.net/bundlephobia/minzip/htmx.org)](https://bundlephobia.com/result?p=htmx.org)

## introduction

htmx allows you to access [AJAX](https://htmx.org/docs#ajax), [CSS Transitions](https://htmx.org/docs#css_transitions),
[WebSockets](https://htmx.org/docs#websockets) and [Server Sent Events](https://htmx.org/docs#sse)
directly in HTML, using [attributes](https://htmx.org/reference#attributes), so you can build
[modern user interfaces](https://htmx.org/examples) with the [simplicity](https://en.wikipedia.org/wiki/HATEOAS) and
[power](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of hypertext

htmx is small ([~14k min.gz'd](https://unpkg.com/htmx.org/dist/)),
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
<script src="https://unpkg.com/htmx.org@1.9.12"></script>
<!-- have a button POST a click via AJAX -->
<button hx-post="/clicked" hx-swap="outerHTML">
  Click Me
</button>
The hx-post and hx-swap attributes tell htmx:

"When a user clicks on this button, issue an AJAX request to /clicked, and replace the entire button with the response"

htmx is the successor to intercooler.js

installing as a node package
To install using npm:

bash
Copy code
npm install htmx.org --save
Note there is an old broken package called htmx. This is htmx.org.

website & docs
https://htmx.org
https://htmx.org/docs
contributing
Want to contribute? Check out our contribution guidelines

No time? Then become a sponsor

hacking guide
To develop htmx locally, you will need to install the development dependencies.

Requires Node 15.

Run:

bash
Copy code
npm install
Then, run a web server in the root.

This is easiest with:

bash
Copy code
npx serve
You can then run the test suite by navigating to:

http://0.0.0.0:3000/test/

At this point you can modify /src/htmx.js to add features, and then add tests in the appropriate area under /test.

/test/index.html - the root test page from which all other tests are included
/test/attributes - attribute specific tests
`/test/core

*javascript fatigue:<br/>
longing for a hypertext<br/>
already in hand*
