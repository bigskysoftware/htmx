+++
title = "htmx Head Tag Support Extension"
+++

The `hx-head` extension adds support for [head tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
in responses to htmx requests with intelligent resource loading and FOUC prevention.

htmx began as a library focused on _partial replacement_ of HTML within the `body` tag.  As such, merging additional
information such as the head tag was not a focus of the library.  (This is in contrast with, for example, TurboLinks,
which was focused on merging entire web pages retrieved via AJAX into the browser.)

The [`hx-boost`](@/attributes/hx-boost.md) attribute moved htmx closer to this world of full HTML-document support &
support for extracting the `title` tag out of head elements was eventually added, but full head tag support has never been
a feature of the library.  This extension addresses that shortcoming.

## Installing

Include the extension after htmx:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-head.js"></script>
```

## Usage

All responses that htmx receives that contain a `head` tag in them (even if they are not complete
HTML documents with a root `<html>` element) will be processed.

How the head tag is handled depends on the swap target:

* If the swap target is `document.body`, the **merge** strategy is used
* For all other targets, the **append** strategy is used

### Merge Strategy

* Elements that exist in the current head as exact textual matches will be left in place
* Elements that do not exist in the current head will be added at the end of the head tag
* Elements that exist in the current head, but not in the new head will be removed from the head

### Append Strategy

* All new head elements will be appended to the existing head element
* Existing elements are preserved unless marked for re-evaluation

If you wish to override this behavior, you can place the `hx-head` attribute on the new `<head>` tag,
with either of the following two values:

* `merge` - follow the merging algorithm outlined above
* `append` - append the elements to the existing head

## Resource Loading

The extension intelligently handles different types of head elements:

### Render-Critical Resources (Loaded Before Swap)

* **Stylesheets** (`<link rel="stylesheet">`) - Awaited to prevent FOUC (Flash of Unstyled Content)
* **Blocking Scripts** (`<script src="..." >` without `async` or `defer`) - Awaited to ensure dependencies load

### Fire-and-Forget Resources (Loaded Immediately)

* **Meta tags** - Added immediately
* **Title tags** - Added immediately  
* **Base tags** - Added immediately
* **Preload/Prefetch links** - Added immediately
* **Async scripts** (`<script async>`) - Added immediately
* **Inline scripts** (`<script>` without `src`) - Added immediately

### Deferred Resources (Loaded After Swap)

* **Deferred Scripts** (`<script defer>`) - Executed after DOM swap completes. A `<link rel="preload">` (or `rel="modulepreload"` for ES modules) hint is temporarily injected immediately when the deferred script is identified, so the browser can fetch it in parallel rather than waiting until after the swap fires.

### Controlling Merge Behavior

Beyond this, you may also control merging behavior of individual elements with the following attributes:

* If you place `hx-head="re-eval"` on a head element, it will be re-added (removed and appended) to the head tag on every
request, even if it already exists.  This can be useful to execute a script on every htmx request, for example.
* If you place `hx-preserve="true"` on an element, it will never be removed from the head

### Example

As an example, consider the following head tag in an existing document:

```html
<head>
<link rel="stylesheet" href="https://the.missing.style">
<link rel="stylesheet" href="/css/site1.css">
<script src="/js/script1.js"></script>
<script src="/js/script2.js"></script>
</head>
```

If htmx receives a request containing this new head tag:

```html
<head>
<link rel="stylesheet" href="https://the.missing.style">
<link rel="stylesheet" href="/css/site2.css">
<script src="/js/script2.js"></script>
<script src="/js/script3.js"></script>
</head>
```

Then the following operations will occur:

* `<link rel="stylesheet" href="https://the.missing.style">` will be left alone
* `<link rel="stylesheet" href="/css/site1.css">` will be removed from the head
* `<link rel="stylesheet" href="/css/site2.css">` will be added to the head (awaited before swap)
* `<script src="/js/script1.js"></script>` will be removed from the head
* `<script src="/js/script2.js"></script>` will be left alone
* `<script src="/js/script3.js"></script>` will be added to the head (awaited before swap)

The final head element will look like this:

```html
<head>
<link rel="stylesheet" href="https://the.missing.style">
<script src="/js/script2.js"></script>
<link rel="stylesheet" href="/css/site2.css">
<script src="/js/script3.js"></script>
</head>
```

## Events

This extension triggers the following events:

* `htmx:before:head:remove` - triggered when a head element is about to be removed, with the element being removed
available in `event.detail.headElement`.  If `preventDefault()` is invoked on the event, the element will not be removed.
* `htmx:before:head:add` - triggered when a head element is about to be added, with the element being added
available in `event.detail.headElement`.  If `preventDefault()` is invoked on the event, the element will not be added.
* `htmx:after:head:merge` - triggered after a head tag merge has occurred, with the following values available in the event `detail`:
  * `added` - added head elements
  * `kept` -  kept head elements
  * `removed` -  removed head elements
* `htmx:before:head:merge` - triggered before a head merge occurs
