# The htmx 4.0 Changelog

* `fetch()` has replaced `xhr` as the core AJAX infrastructure
* The default swap strategy has been changed to `outerHTML`.  You can configure this back to `innerHTML` to avoid pain.
* CSS Transitions have been removed in favor of View Transitions
  * There is no longer a swap & settle mechanic, so options relating to those are now removed 
* Inheritance is now _explicit_, via the `:inherited` suffix on attributes
  * Thus, inheritance-related attributes like `hx-disinherit` have been removed
* `hx-disable` has been renamed to `hx-ignore`
* `hx-disabled-elt` has been renamed to `hx-disable` :/
* History no longer caches any local content, instead a full page request is made and the `body` tag is swapped out
* The `queue` option was dropped from hx-trigger, should use `hx-sync` instead
* Extended selectors with spaces in them (e.g. `next .foo`) must now be enclosed in quotes for the `from` option on `hx-trigger` (e.g. `hx-trigger="click from:'next div'"`, rather than `hx-trigger="click from:next div"`)
* hx-confirm now can can return a string to confirm or, via the `hx-confirm='js:confirmMe()''` form, use a Promise-based callback
* hx-on:* now only follows the `hx-on:<event name>` standard.  Because JSX now supports colons in attribute names, there is no special handling.  There is also no special handling for htmx events: all events should be fully qualified
* hx-sync no longer supports the `abort` option