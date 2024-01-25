+++
title = "htmx 1.x &rarr; htmx 2.x Migration Guide"
+++

The purpose of this guide is to provide instructions for migrations from htmx 1.x to htmx 2.x.
We place a very high value on backwards compatibility, so in most cases this migrations should require very little, if any, work.

* If you are still using the legacy `hx-ws` and `hx-sse` attributes, please upgrade to the extension versions (available in 1.x)
* Default Changes
  * If you want to retain the 1.0 behavior of "smooth scrolling" by default, revert `htmx.config.scrollBehavior` to `'smooth'`
  * If you want `DELETE` requests to use a form-encoded body rather than parameters, revert
    `htmx.config.methodsThatUseUrlParams` to `["get"]` (it's a little crazy, but `DELETE`, according to the spec, should
     use request parameters.)
  * If you want to make cross-domain requests with htmx, revert `htmx.config.selfRequestsOnly` to `false`
* Convert any `hx-on` attributes to their `hx-on:` equivalent:
  ```html
     <button hx-get="/info" hx-on="htmx:beforeRequest: alert('Making a request!')
                                   htmx:afterRequest: alert('Done making a request!')">
      Get Info!
     </button>
  ```
  becomes:
  ```html
     <button hx-get="/info" hx-on:htmx:before-request="alert('Making a request!')"
                            hx-on:htmx:after-request="alert('Done making a request!')">
      Get Info!
     </button>
  Note that you must use the kebab-case of the event name due to the fact that attributes are case-insensitive in HTML.
  ```
* The `htmx.makeFragment()` method now **always** returns a `DocumentFragment` rather than either an `Element` or `DocumentFragment`
* If you are using htmx in a module setting, we now provide module-type specific files for all three of the major
  JavaScript module types: `/dist/htmx.esm.js`, `/dist/htmx.umd.js` & `/dist/htmx.amd.js`
* htmx 2.0 offers automatic head merging with boosted links.  If you do not want this behavior, you can set `htmx.config.head.boosted` to `"none"`
* If you are an extension author and your extension was using `selectAndSwap` method from internal API, it was removed and replaced with `swap` method,
  which is available from both internal and public htmx APIs

  To do swap using new method, you need to simply use

  ```js
  let content = "<div>Hello world</div>"; // this is HTML that will be swapped into target
  let target = api.getTarget(child);
  let swapSpec = api.getSwapSpecification(child);
  api.swap(target, content, swapSpec);
  ```

 `swap` method documentation is available on [JS API Reference](/api/#swap)

IE is no longer supported in htmx 2.0, but htmx 1.x continues to support IE and will be supported for the foreseeable future.

