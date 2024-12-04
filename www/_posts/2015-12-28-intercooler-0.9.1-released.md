---
layout: blog_post
nav: blog
---

I have released intercooler v0.9.1, available on the main site, as well as through bower.

<http://intercoolerjs.org/download.html>

This is mostly a bug-fix release, but it does contain one new attribute, the ic-action attribute I discussed earlier:

<http://intercoolerjs.org/release/CHANGES.html#0_9_1>

This lets you implement purely client-side actions in intercooler without a server request:

    <button ic-action=“fadeOut;remove” ic-target=“closest div”>Close</button>

This would fade out and then remove the closest div to the button, using the proper callback mechanism in jQuery.  Documentation and examples are here:

<http://intercoolerjs.org/attributes/ic-action.html>

This concludes the client-side functionality of intercooler (everything else should be done using standard jQuery techniques) :)

The remaining outstanding items on the road to 1.0 are:

  * [https://github.com/intercoolerjs/intercooler-js/issues/60](https://github.com/intercoolerjs/intercooler-js/issues/60) - an option for a data-prefix
  * [https://github.com/intercoolerjs/intercooler-js/issues/54](https://github.com/intercoolerjs/intercooler-js/issues/54) - File upload handling

I hope to have both of these done at some point in January, and we can all have a big 1.0 launch party: