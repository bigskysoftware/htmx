---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `local-vars` Extension

This extension allows you to pass localStorage variables to the server. It also allows the 
server to return values in the same variables.  Set the Local-Vars header on the response
if you need to set the localStorage values after your ajax response.  Send a space delimited 
list of local variables in "include-local-vars".

The localStorage values do not need to be instanciated, but uninstanciated variables aren't sent to the server.  Also, this extension will not clear localStorage variables on unload event.

### Usage

```html
<div hx-post='/test' hx-ext='local-vars' include-local-vars="ncount clientdate">click me</div>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/local-vars.js>
