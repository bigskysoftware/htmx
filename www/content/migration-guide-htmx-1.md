+++
title = "htmx 1.x &rarr; htmx 2.x Migration Guide"
+++

The purpose of this guide is to provide instructions for migrations from htmx 1.x to htmx 2.x.
We place a very high value on backwards compatibility, so in most cases this migrations should require very little, if any, work.

* If you are using htmx in a module setting, we now provide module-type specific files for all three of the major
  JavaScript module types
  * ESM Modules: `/dist/htmx.esm.js`
  * UMD Modules: `/dist/htmx.umd.js`
  * AMD Modules: `/dist/htmx.amd.js`
  * The `/dist/htmx.js` file continues to be browser-loadable
* All extensions have been removed from the core htmx distribution and are distributed separately on
  [their own website](https://extensions.htmx.org).  While many 1.x extensions will continue to work with htmx 2, you
  must upgrade the SSE extension to the 2.x version, and it is recommended that you upgrade all of them to the 2.x
  versions.
* If you are still using the legacy `hx-ws` and `hx-sse` attributes, please upgrade to the extension versions 
* Default Changes
  * If you want to retain the 1.0 behavior of "smooth scrolling" by default, revert `htmx.config.scrollBehavior` to `'smooth'`
  * If you want `DELETE` requests to use a form-encoded body rather than parameters, revert
    `htmx.config.methodsThatUseUrlParams` to `["get"]` (it's a little crazy, but `DELETE`, according to the spec, should
     use request parameters like `GET`.)
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
* If you are an extension author and your extension was using `selectAndSwap` method from internal API, it was removed and replaced with `swap` method,
  which is available from both internal and public htmx APIs

To do a swap using new method, you need to simply use

  ```js
  let content = "<div>Hello world</div>"; // this is HTML that will be swapped into target
  let target = api.getTarget(child);
  let swapSpec = api.getSwapSpecification(child);
  api.swap(target, content, swapSpec);
  ```

`swap` method documentation is available on [JS API Reference](/api/#swap)

IE is no longer supported in htmx 2.0, but [htmx 1.x](https://v1.htmx.org) continues to support IE and will be supported 
for the foreseeable future.

## Upgrade Music

This is the official htmx 1.x -> 2.x upgrade music:

<iframe width="640" height="360" src="https://www.youtube.com/embed/YDkD-N5goMg" title="PYLOT - Upgrades (Visualizer)" 
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

