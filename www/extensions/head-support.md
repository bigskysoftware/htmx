---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `head-support` Extension

The `head-support` extension adds support for [head tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
in responses to htmx requests.

htmx began as a library focused on _partial replacement_ of HTML within the `body` tag.  As such, merging additional
information such as the head tag was not a focus of the library.  (This is in contrast with, for example, TurboLinks,
which was focused on merging entire web pages retrieved via AJAX into the browser.)

The [`hx-boost`](/attributes/hx-boost) attribute moved htmx closer to this world of full HTML-document support &
support for extracting the `title` tag out of head elements was eventually added, but full head tag support has never been
a feature of the library.

This extension addresses that shortcoming & will likely be integrated into htmx for the 2.0 release.  

### Usage

The `head-support` extension is simple to install.  Simply add the `/ext/head-support.js` file to your head tag and
install the extension using the `hx-ext` attribute:

```html
<body hx-ext="head-support">
   ...
```

With this installed, all responses that htmx recieves that contain a `head` tag in them will be processed and _merged_
into the current head tag.  That is:

* Elements that exist in the current head will be left along
* Elements that do not exist in the current head will be added
* Elements that exist in the current head, but not in the new head will be removed

#### Example

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
* `<link rel="stylesheet" href="/css/site2.css">` will be added to the head
* `<script src="/js/script1.js"></script>` will be removed from the head
* `<script src="/js/script2.js"></script>` will be left alone
* `<script src="/js/script3.js"></script>` will be added to the head

The final head element will look like this:

```html
<head>
    <link rel="stylesheet" href="https://the.missing.style">
    <script src="/js/script2.js"></script>
    <link rel="stylesheet" href="/css/site2.css">
    <script src="/js/script3.js"></script>
</head>
```

### Controlling Merge Behavior

Sometimes you may want to preserve an element in the head tag.  You can do so using events, discussed below, but this
extension also gives you two declarative mechanisms for doing so:

* If an element in the `head` tag has an `hx-preserve="true"` attribute & value on it, it will not be removed from the head tag:
  ```html
     <!-- This element will not be removed even if it is not in new head content recieved from the server-->
     <link rel="stylesheet" href="/css/site1.css" hx-preserve="true">
   ```
* If a new `head` element _in the content of a response_ has the `hx-swap-oob="beforeend"` attribute & value, the content of the new
  head element will be added to the existing head tag, but no content will be removed from the existing head tag.
  ```html
     <!-- This content will be appended to the head tag, leaving current content in place -->
     <head hx-swap-oob="beforeend">
       <link rel="stylesheet" href="/css/site1.css">
     </head>
   ```

### Events

This extension triggers the following events:

* `htmx:removingHeadElement` - triggered when a head element is about to be removed, with the element being removed 
   available in `event.detail.headElement`.  If `preventDefault()` is invoked on the event, the element will not be removed.
* `htmx:addingHeadElement` - triggered when a head element is about to be added, with the element being added 
   available in `event.detail.headElement`.  If `preventDefault()` is invoked on the event, the element will not be added.
* `htmx:afterHeadMerge` - triggered after a head tag merge has occurred, with the following values available in the event `detail`:
  * `added` - added head elements
  * `kept` -  kept head elements
  * `removed` -  removed head elements
* `htmx:beforeHeadMerge` - triggered before a head merge occurs