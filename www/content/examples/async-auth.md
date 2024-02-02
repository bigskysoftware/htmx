+++
title = "Async Authentication"
template = "demo.html"
+++

This example shows how to implement an an async auth token flow for htmx.

The technique we will use here will take advantage of the fact that you can delay requests
using the [`htmx:confirm`](@/events.md#htmx:confirm) event.

We first have a button that should not issue a request until an auth token has been retrieved:

```html
  <button hx-post="/example" hx-target="next output">
    An htmx-Powered button
  </button>
  <output>
    --
  </output>
```

Next we will add some scripting to work with an `auth` promise (returned by a library):

```html
<script>
  // auth is a promise returned by our authentication system

  // await the auth token and store it somewhere
  let authToken = null;
  auth.then((token) => {
    authToken = token
  })
  
  // gate htmx requests on the auth token
  htmx.on("htmx:confirm", (e)=> {
    // if there is no auth token
    if(authToken == null) {
      // stop the regular request from being issued
      e.preventDefault() 
      // only issue it once the auth promise has resolved
      auth.then(() => e.detail.issueRequest()) 
    }
  })

  // add the auth token to the request as a header
  htmx.on("htmx:configRequest", (e)=> {
    e.detail.headers["AUTH"] = authToken
  })
</script>
```

Here we use a global variable, but you could use `localStorage` or whatever preferred mechanism
you want to communicate the authentication token to the `htmx:configRequest` event.

With this code in place, htmx will not issue requests until the `auth` promise has been resolved.
