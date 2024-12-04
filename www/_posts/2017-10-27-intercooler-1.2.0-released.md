---
layout: blog_post
nav: blog
---

I have released intercooler v1.2.0, available on the main site, as well as through bower and NPM.

  <http://intercoolerjs.org/download.html>


Changes in this release are:

* `ic-disable-when-doc-hidden` and `ic-disable-when-doc-inactive` attributes allow you to pause polling when a browser 
   isn't active
* `ic-fix-ids` tells intercooler to make id's unique in a document dynamically
* Better support for last-clicked elements in forms
* Added `timeout:` syntax for `ic-trigger-on` attribute
* Added four additional local <code>action</code> attributes:
  * <code>ic-action-beforeSend</code>
  * <code>ic-action-success</code>
  * <code>ic-action-error</code>
  * <code>ic-action-complete</code>
  
  These actions are fired during the jQuery AJAX life cycle.
  
Enjoy, and thanks for using intercooler!  

Carson / [@carson_gross](https://twitter.com/carson_gross)