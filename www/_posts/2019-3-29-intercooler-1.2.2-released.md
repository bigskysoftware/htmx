---
layout: blog_post
nav: blog
---

I have released intercooler v1.2.2, available on the main site, as well as through bower and NPM.

  <http://intercoolerjs.org/download.html>


Changes in this release are:

*   Added [ic-enhance](/attributes/ic-enhance.html) attribute, which enhances standard anchor and form tags with the 
    intercooler equivalent attributes, allowing for graceful degradation in non-javascript environments.
*   Added [ic-global-indicator](/attributes/ic-global-indicator.html) attribute, which sets a global indicator to be 
   shown when a request is in flight, even along side any local indicators specified by the triggering element.
*   Added [ic-switch-class](/attributes/ic-switch-class.html) attribute, which switches a class between siblings when 
    an intercooler request is caused within one. This can be uses, for example, to update the "active" state of tabs 
    without replacing the tab UI.
*   LeadDyno.startPolling() and LeadDyno.stopPolling() were added to the Javascript API
*   Added `X-IC-Title-Encoded` response header to handle URI encoded titles for international users
*   Removed the legacy debugger
*   Bug fixes 

Enjoy, and thanks for using intercooler!  

Carson / [@carson_gross](https://twitter.com/carson_gross)