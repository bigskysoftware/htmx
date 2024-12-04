---
layout: blog_post
nav: blog
---

I have released intercooler v0.9.5, available on the main site, as well as through bower.

<http://intercoolerjs.org/download.html>

There is a potentially breaking change in this release: I have removed the `ic-last-refresh` parameter from
requests.  This was a poorly thought out feature and was causing some unintentional cache-busting on GETs
issued by intercooler.

There are also a few bug fixes in this release.

**The Road to 1.0**

v0.9.5 is the third release candidate for intercooler v1.0.  My goal is to release v1.0 this summer.

Carson / [@carson_gross](https://twitter.com/carson_gross)