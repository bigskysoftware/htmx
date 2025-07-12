+++
title = "Experimental moveBefore() Support"
insert_anchor_links = "heading"
+++

This page demonstrates the use of the experimental [`moveBefore()`](https://github.com/whatwg/dom/issues/1255) DOM
API available in [Chrome Canary](https://www.google.com/chrome/canary/), which has been integrated into the `hx-preserve`
attribute of htmx, if it is available.

### Getting Chrome Canary & Enabling `moveBefore()`

For the demo to work properly you will need to install Chrome Canary and enable the API:

* Navigate to <chrome://flags/#atomic-move>
* Enable "Atomic DOM move"

htmx takes advantage of this API in the `hx-preserve` functionality if it is available, allowing you to mark an element
as "preserved" and having all its state preserved as it moves between areas on the screen when new content is merged in.
This is significantly better developer experience than current alternatives, such as morphing, which rely on the 
structure of the new page being "close enough" to not have to move things like video elements.

### Demo

If you inspect the video below you will see that it is embedded in a `div` element.  If you click the "View Details" 
link, which is boosted, you will transition to another page with a video element with the same id, but embedded in
a `figure` element instead.  Without the `moveBefore()` functionality it is impossible to keep the video playing in
this situation because "reparenting" (i.e. changing the parent of an element) causes it to reset.

`moveBefore()` opens up a huge number of possibilities in web development by allowing developers to completely change
the layout of a page while still preserving elements play state, focus, etc.  

<div class="center">
  <iframe hx-preserve="true" id="rick-roll" width="617" height="351" src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
          title="Rick Astley - Never Gonna Give You Up (Official Music Video)" frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
   <div>
   <a hx-boost="true" href="/examples/move-before/details">View Details &rarr;</a>
   </div>
</div>


