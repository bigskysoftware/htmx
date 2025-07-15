+++
title = "Extensions"
+++

htmx supports extensions to augment the core hypermedia infrastructure it provides.  The extension mechanism takes
pressure off the core library to add new features, allowing it to focus on its main purpose of 
[generalizing hypermedia controls](https://dl.acm.org/doi/10.1145/3648188.3675127).

If you are interested in creating an extension for htmx, please see [Building htmx Extensions](/extensions/building).

htmx extensions are split into two categories:

* [core extensions](#core-extensions) - supported by the htmx team
* [community extensions](#community-extensions) - supported by the broader community

## Core Extensions

| Name                                             | Description                                                                                                                                                                                |
|--------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [head-support](/extensions/head-support)         | Provides support for merging head tag information (styles, etc.) in htmx requests                                                                                                          |
| [htmx-1-compat](/extensions/htmx-1-compat)       | Rolls back most of the behavioral changes of htmx 2 to the htmx 1 defaults.                                                                                                                |
| [idiomorph](/extensions/idiomorph)               | Provides a `morph` swap strategy based on the [idiomorph](https://github.com/bigskysoftware/idiomorph/) morphing library, which was created by the htmx team.                              |
| [preload](/extensions/preload)                   | This extension allows you to load HTML fragments into your browser's cache before they are requested by the user, so that additional pages appear to users to load nearly instantaneously. |
| [response-targets](/extensions/response-targets) | This extension allows you to specify different target elements to be swapped when different HTTP response codes are received.                                                              |
| [sse](/extensions/sse)                           | Provides support for [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) directly from HTML.                                |
| [ws](/extensions/ws)                             | Provides bi-directional communication with [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) servers directly from HTML |

## Community Extensions

<search aria-label="Community extensions">
  <label for="extension-filter" hidden>Search Extensions:</label>
  <input type="search" id="extension-filter" placeholder="Search Extensions..."
       _="init
            set :table to the next <table/>
            set :initialHeight to *computed-height of :table
          on keyup
            if the event's key is 'Escape' then set my value to '' then trigger input end
          on input
            repeat in closest <tr/> to <td:first-of-type/> in :table
              if its textContent.toLowerCase() contains my value.toLowerCase()
                remove @hidden from it
              else
                add @hidden='' to it
              end
            end
            -- hide section header when its section is empty
            show closest <tr/> to <tbody th/> in :table
                 when (the next <tr:not([hidden])/> from it within the closest <tbody/> to it) exists
            -- avoid shift by keeping page size constant
            set *margin-bottom of :table to
                `calc(${:initialHeight} - ${*computed-height of :table})`">
</search>
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{% markdown() %}  [ajax-header](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/ajax-header/README.md)  {% end %}</td>
      <td>{% markdown() %}  Adds an `X-Requested-With` header to all requests made by htmx  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [alpine-morph](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/alpine-morph/README.md)  {% end %}</td>
      <td>{% markdown() %}  Alpine.js now has a lightweight [morph plugin](https://alpinejs.dev/plugins/morph) and this extension allows you to use it as the swapping mechanism in htmx which is necessary to retain Alpine state when you have entire Alpine components swapped by htmx.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [attribute-tools](https://github.com/jamcole/htmx-ext-attribute-tools/blob/main/README.md)  {% end %}</td>
      <td>{% markdown() %}  The `attribute-tools` extension allows you to specify attributes that will be swapped onto or off of the elements by using an `attributes` or `data-attributes` attribute. (similar to class-tools)  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [class-tools](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/class-tools/README.md)  {% end %}</td>
      <td>{% markdown() %}  The `class-tools` extension allows you to specify CSS classes that will be swapped onto or off of the elements by using a `classes` or `data-classes` attribute.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [debug](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/debug/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension will log all htmx events for the element it is on through the `console.debug` function. Note that during dev, using `htmx.logAll()` instead can often be sufficient.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [event-header](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/event-header/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension adds the `Triggering-Event` header to requests. The value of the header is a JSON serialized version of the event that triggered the request.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [loading-states](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/loading-states/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension allows you to easily manage loading states while a request is in flight, including disabling elements, and adding and removing CSS classes.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [morphdom-swap](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/morphdom-swap/README.md)  {% end %}</td>
      <td>{% markdown() %}  Provides a `morph` swap strategy based on the [morphdom](https://github.com/patrick-steele-idem/morphdom/) morphing library.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [multi-swap](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/multi-swap/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension allows you to swap multiple elements marked from the HTML response. You can also choose for each element which swap method should be used.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [no-cache](https://github.com/craigharman/htmx-ext-no-cache/blob/master/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension forces HTMX to bypass client caches and make a new request. An `hx-no-cache` header is also added to allow server-side caching to be bypassed.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [path-deps](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/path-deps/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension supports expressing inter-element dependencies based on paths, inspired by the [intercooler.js dependencies mechanism](http://intercoolerjs.org/docs.html#dependencies).  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [path-params](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/path-params/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension uses request parameters to populate path variables. Used parameters are removed so they won't be sent in the query string or body anymore.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [remove-me](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/remove-me/README.md)  {% end %}</td>
      <td>{% markdown() %}  Allows you to remove an element after a specified interval.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [replace-params](https://github.com/fanelfaa/htmx-ext-replace-params/blob/main/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension uses request parameters to replace existing parameters. If given value is empty string then parameter will be deleted. This extension would be useful in situations like pagination, search that you only want to replace only few parameters instead of reset all parameters.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [restored](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/restored/README.md)  {% end %}</td>
      <td>{% markdown() %}  Triggers an event whenever a back button even is detected while using `hx-boost`  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [safe-nonce](https://github.com/MichaelWest22/htmx-extensions/blob/main/src/safe-nonce/README.md)  {% end %}</td>
      <td>{% markdown() %}  The `safe-nonce` extension can be used to improve the security of the application/web-site and help avoid XSS issues by allowing you to return known trusted inline scripts safely  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [hx-drag](https://www.npmjs.com/package/hx-drag)  {% end %}</td>
      <td>{% markdown() %}  This extension allows htmx requests to be sent for drag drop  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [dynamic-url](https://github.com/FumingPower3925/htmx-dynamic-url/blob/main/README.md)  {% end %}</td>
      <td>{% markdown() %}  Allows dynamic URL path templating using `{varName}` placeholders, resolved via configurable custom function or `window.` fallback. It does not rely on `hx-vals`. Useful when needing to perform requests to paths that depend on application state.  {% end %}</td>
    </tr>
  </tbody>
  <tbody>
    <tr><th scope="rowgroup" colspan="2">Data API</th></tr>
    <tr>
      <td>{% markdown() %}  [client-side-templates](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/client-side-templates/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension supports transforming a JSON/XML request response into HTML via a client-side template before it is swapped into the DOM.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [json-enc](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/json-enc/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension encodes parameters in JSON format instead of url format.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [form-json](https://github.com/xehrad/form-json/blob/main/README.md)  {% end %}</td>
      <td>{% markdown() %}  Similar to `json-enc`, but with **type preservation**. Converts form data into structured JSON while maintaining correct types for numbers, booleans, and files (Base64-encoded). Supports nested structures using dot (`.`) or bracket (`[]`) notation.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [json-enc-custom](https://github.com/Emtyloc/json-enc-custom/blob/main/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension works similarly to json-enc but allows for very complex structures, such as embedding JSON objects, lists, or handling indexes, just by using the name attribute.  {% end %}</td>
    </tr>
  </tbody>
  <tbody>
    <tr><th scope="rowgroup" colspan="2">Integrations</th></tr>
    <tr>
      <td>{% markdown() %}  [amz-content-sha256](https://github.com/felipegenef/amz-content-sha256/blob/main/README.md)  {% end %}</td>
      <td>{% markdown() %}  HTMX extension for interacting with AWS services that require the content hash as part of the request for data integrity verification. {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [signalr](https://github.com/Renerick/htmx-signalr/blob/master/README.md)  {% end %}</td>
      <td>{% markdown() %}  Provides bidirectional real-time communication via [SignalR](https://github.com/dotnet/AspNetCore/tree/main/src/SignalR).  {% end %}</td>
    </tr>
  </tbody>
  <tbody>
    <tr><th scope="rowgroup" colspan="2">Legacy</th></tr>
    <tr>
      <td>{% markdown() %}  [disable-element](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/disable-element/README.md)  {% end %}</td>
      <td>{% markdown() %}  This extension disables an element during an htmx request, when configured on the element triggering the request. Note that this functionality is now part of the core of htmx via the `hx-disabled-elt` attribute.  {% end %}</td>
    </tr>
    <tr>
      <td>{% markdown() %}  [include-vals](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/include-vals/README.md)  {% end %}</td>
      <td>{% markdown() %}  The `include-vals` extension allows you to programmatically include values in a request with a `include-vals` attribute. Note that this functionality is now part of the core of htmx via the `hx-vals` attribute.  {% end %}</td>
    </tr>
  </tbody>
</table>
