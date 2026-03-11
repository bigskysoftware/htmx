---
title: "Head Support"
description: "Merge head tag information (styles, scripts) in htmx responses"
keywords: ["head", "styles", "scripts", "merge", "append"]
---

The `head-support` extension adds support for [head tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head) in responses to htmx requests.

htmx began as a library focused on partial replacement of HTML within the `body` tag. The [`hx-boost`](/reference/attributes/hx-boost) attribute moved htmx closer to full HTML-document support, and support for extracting the `title` tag was eventually added, but full head tag support has never been a feature of the core library. This extension addresses that.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/head-support.js"></script>
```

## Usage

All responses that htmx receives that contain a `head` tag in them (even if they are not complete HTML documents with a root `<html>` element) will be processed.

How the head tag is handled depends on the type of htmx request.

If the htmx request is from a **boosted element**, then the following merge algorithm is used:

- Elements that exist in the current head as exact textual matches will be left in place
- Elements that do not exist in the current head will be added at the end of the head tag
- Elements that exist in the current head, but not in the new head will be removed from the head

If the htmx request is from a **non-boosted element**, then all content will be _appended_ to the existing head element.

If you wish to override this behavior in either case, you can place the `hx-head` attribute on the new `<head>` tag, with either of the following two values:

- `merge` - follow the merging algorithm outlined above
- `append` - append the elements to the existing head

### Controlling Merge Behavior

You may also control merging behavior of individual elements:

- If you place `hx-head="re-eval"` on a head element, it will be re-added (removed and appended) to the head tag on every request, even if it already exists. This can be useful to execute a script on every htmx request, for example.
- If you place `hx-preserve="true"` on an element, it will never be removed from the head.

### Example

Consider the following head tag in an existing document:

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

- `<link rel="stylesheet" href="https://the.missing.style">` will be left alone
- `<link rel="stylesheet" href="/css/site1.css">` will be removed from the head
- `<link rel="stylesheet" href="/css/site2.css">` will be added to the head
- `<script src="/js/script1.js"></script>` will be removed from the head
- `<script src="/js/script2.js"></script>` will be left alone
- `<script src="/js/script3.js"></script>` will be added to the head

## Events

- `htmx:removingHeadElement` - triggered when a head element is about to be removed. The element is available in `event.detail.headElement`. Call `preventDefault()` to keep it.
- `htmx:addingHeadElement` - triggered when a head element is about to be added. The element is available in `event.detail.headElement`. Call `preventDefault()` to skip it.
- `htmx:afterHeadMerge` - triggered after a head tag merge has occurred, with `detail.added`, `detail.kept`, and `detail.removed` arrays.
- `htmx:beforeHeadMerge` - triggered before a head merge occurs.
