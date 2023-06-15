# htmx 2.0 TODOs

# General Ideas

* ~~Remove sse and ws extensions~~
  * What to do about config information in `htmx.config`?
* Integrate idiomorph as a `merge` swap
* Unify public and extension API
  * Clean up API
  * Expose all aspects of the htmx pipeline
  * As backwards compatible as is feasible
  * Inject new public API into extensions
* All extensions moved out of the core repo
  * extensions.htmx.org?
  * published in their own github repos?
* History API rework
  * Would be nice to avoid the complexity of having to undo DOM mutations by 3rd party libs
    * Snapshot the DOM before mutation somehow?  Can this be done efficiently?
* Remove `hx-on` in favor of `hx-on:`
* ~~Remove all IE related hacks~~
* Proper JSDoc for the entire library

# Themes

* 99.9% backwards compatible
* well documented upgrade
* evolutionary