---
layout: blog_post
nav: blog
---

I have released intercooler v0.9.3, available on the main site, as well as through bower.

<http://intercoolerjs.org/download.html>

Intercooler now supports for the `data-*` prefix on attributes via the `<meta name="intercoolerjs:use-data-prefix" content="true"/>` meta-tag.

I also introduced the <code>beforeAjaxSend.ic(event, settings)</code> event, which allows programmers to modify the setting hash passed
to `$.ajax()` to do thinks like add headers, set content type, remove parameters, etc.

Full release notes are here:

<http://intercoolerjs.org/release/CHANGES.html#0_9_3>

**The Road to 1.0**

v0.9.3 is the first release candidate for intercooler v1.0.  My goal is to release v1.0 by the end of February.

Carson / [@carson_gross](https://twitter.com/carson_gross)