---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `local-vars` Extension

This extension allows you to pass localStorage variables to the server. It also allows the 
server to return values in the same variables.  Set the HX-Local-Vars header on the response
if you need to set the localStorage values after your ajax response.

### Usage

```html
<div hx-post='/test' hx-ext='local-vars' hx-include-local-vars="ncount">click me</div>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/local-vars.js>
