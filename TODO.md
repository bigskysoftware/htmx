## GOALS

* Dependency-free implementation of intercooler.js
* Support IE11 (stretch: IE10)
* < 6k in .min.gz form

## TODOS

* `kutty-requests` class on body
* polling cancellation API 205 code
* meta config tag
* focus recapture
* Testing
  * polling
  * merge
  * kt-select
  * history
  * kt-boost
  * transition model for content swaps
* build website with 11ty
  * landing page
  * docs page 
  * examples page (steal intercooler)

## Unsupported Intercooler Features

* local actions
* all request parameters
* all response headers except X-*-Trigger, X-*-Push
* dependencies
* macros

## RESOURCES

* http://youmightnotneedjquery.com/
* http://intercoolerjs.org/docs.html
* http://intercoolerjs.org/reference.html
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap