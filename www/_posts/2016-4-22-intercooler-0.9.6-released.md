---
layout: blog_post
nav: blog
---

I have released intercooler v0.9.6, available on the main site, as well as through bower.

<http://intercoolerjs.org/download.html>

The changes in this release are:

* Support for invocation of global functions in the [ic-action](/attributes/ic-action.html) attribute.
* We now include the URL of the AJAX request that caused an error when we post errors to the server via the 
  [ic-post-errors](/attributes/ic-post-errors-to.html) attribute.
* For browser compatibility reasons, intercooler sends all non-GET AJAX requests at a POST, with standard
  metadata for frameworks to use to interpret the actual action.  If you wish to use the actual HTTP method
  (e.g. `DELETE`) you can now set the meta tag value `intercoolerjs:use-actual-http-method` to `true`


**The Road to 1.0**

v0.9.6 is the fourth release candidate for intercooler v1.0.  My goal is to release v1.0 in June.

Carson / [@carson_gross](https://twitter.com/carson_gross)