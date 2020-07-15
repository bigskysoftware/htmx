---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `local-vars` Extension

This extension allows you to send localStorage or sessionStorage variables' 
values to the server. It also allows the 
server to return values to the same variables.  

Set the **Local-Vars** header on the response
if you need to send the the localStorage or sessionStorage variables' values back to the client browser.  

**Parameters** for include-local-vars or data-include-local-vars 
should be a space delimited 
list of local variables or "sessionStorage:1" if you want to use sessionStorage
instead of localStorage.  

The localStorage variables do not need to be instanciated, but uninstanciated variables aren't sent to the server.  Also, this extension will not clear localStorage variables on unload event.  

If you use sessionStorage variables, they are of course removed at the end of the session and hence a good reason to use them.

**NOTE:** localStorage and sessionStorage use cookies to "save" the data.  If the browser has cookies disabled, then neither will work.

### Usage

```html
<div hx-post='/test' hx-ext='local-vars' include-local-vars="ncount clientdate">click me</div>

<div hx-post='/test2' hx-ext='local-vars' include-local-vars="sessionStorage:1 mdata">click me</div>

```

### Source

<https://unpkg.com/htmx.org/dist/ext/local-vars.js>
