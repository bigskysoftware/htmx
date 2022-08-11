---
layout: docs.njk
title: </> htmx - Documentation - Introduction
---

## <a name="introduction"></a>[Htmx in a Nutshell](#introduction)

Htmx is a library that allows you to access modern browser features directly from HTML, rather than using
javascript.

To understand htmx, first lets take a look at an anchor tag:

```html
<a href="/blog">Blog</a>
```

This anchor tag tells a browser:

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content
> into the browser window".

With that in mind, consider the following bit of HTML:

```html
<button
  hx-post="/clicked"
  hx-trigger="click"
  hx-target="#parent-div"
  hx-swap="outerHTML"
>
  Click Me!
</button>
```

This tells htmx:

> "When a user clicks on this button, issue an HTTP POST request to '/clicked' and use the content from the response
> to replace the element with the id `parent-div` in the DOM"

Htmx extends and generalizes the core idea of HTML as a hypertext, opening up many more possibilities directly
within the language:

- Now any element, not just anchors and forms, can issue an HTTP request
- Now any event, not just clicks or form submissions, can trigger requests
- Now any [HTTP verb](https://en.wikipedia.org/wiki/HTTP_Verbs), not just `GET` and `POST`, can be used
- Now any element, not just the entire window, can be the target for update by the request

Note that when you are using htmx, on the server side you typically respond with _HTML_, not _JSON_. This keeps you firmly
within the [original web programming model](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm),
using [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS)
without even needing to really understand that concept.

It's worth mentioning that, if you prefer, you can use the `data-` prefix when using htmx:

```html
<a data-hx-post="/click">Click Me!</a>
```