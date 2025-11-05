# Current

* @latent - figure out our final conclusion on out-of-band swaps
* @scriptogre - complete port of examples to patterns
* @scriptogre - SSE cleanup (variable renaming)
* @1cg - determine final test patterns for end-to-end tests
* @1cg - allow changing "meta" character for compatibility w/ some platforms
  * e.g. fastHTML, which uses pythong syntax and cannot support ':', need to be able to switch to '-'

# Backlog

* Updated website design (@scriptogre)
* quirks.js implementation (@1cg)
  * retrigger historical events based on mapping
  * revert to older API (esp `htmx.ajax`)
  * Move deprecated features into quirks.js?
    * out of band swaps?
    * out of band selects?
  * ~~revert to htmx 2.0 attribute resolution~~
  * mode to log elements that should marked as `:inherited`
* Unify __parseTriggerSpecs and __parseSwapModifiers somehow
* `htmx.onLoad()` function (@1cg)
* An "upgrade report" tool for htmx 2.0 applications
  * Produces a report of all elements that need to be
    * Marked as `:inherited`
    * Need to have their swap strategy adjusted (all of them?)
    * Use of no-longer supported events
    * Use of old htmx API calls (???)
    * Collect results into `localStorage` as a JSON array, w/path -> element id (or just outer HTML if no id)
    * Display results via HTML
* Audits
  * Event audit
  * JavaScript API audit
  * Configuration options audit
  * Headers: request & response
      * Michael has thoughts on request headers
* ~~Optimistic response support (would be easy now)~~
* ~~Preload support?~~
* ~~Add in extended selectors (1cg)~~
* ~~Add in custom events like revealed, etc~~ (needs review)
* ~~Add `<partial>` support for SSE & out of band swaps~~
* ~~Add history support~~
  * ~~full refresh every time (no local stuff, htmx has taught us our lesson)~~
* ~~Add explicit inheritances support~~
* ~~Create test infrastructure~~
* ~~Decide how we are going to distinguish public from private API~~
* ~~When should we `preventDefault()` on a triggering event?~~
* ~~trigger modifiers~~
