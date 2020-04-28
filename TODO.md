# &lt;x/> HTMx 
*HTML Extensions*

## GOALS

* Dependency-free implementation of intercooler.js-like HTML-driven AJAX functionality
* Minimalist functionality, rely heavily on built in functionality
* Support IE10+
** CSS transitions only
** Pluggable event model
* < 10k in .min form

## TODOS

* event model for pluggability
* history support
* sse support
* polling (ic-trigger="every 2s")
* implement element properties using https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
** make node handling idempotent
** don't cancel trigger events, but don't process additional events
* distribute on https://unpkg.com/
* build website with 11ty
** landing page
** docs page
** examples page (steal intercooler)
** attributes page
** events page
** headers page

## Features Dropping From Intercooler

* local actions
* all response headers except X-*-Trigger
* dependencies
* macros

## RESOURCES

* http://youmightnotneedjquery.com/
* http://intercoolerjs.org/docs.html
* http://intercoolerjs.org/reference.html
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap

