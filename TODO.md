## GOALS

* Dependency-free implementation of intercooler.js
* Support IE11 (stretch: IE10)
* < 6k in .min.gz form

## Launch TODOS

* Clean up event naming
* Testing
  * checkbox inputs
  * table elements in responses
  * X-KT-Trigger response header
  * events
* Blog Post
* Move to development branch
* Publish 0.0.1

## Post-Launch TODOS

* Testing
  * interval parsing
  * scrolling/'revealed' event
  * kt-swap-oob (verify, chrome coverage tool bad?)
  * SSE stuff
  * kt-trigger delay
  * class operation parsing
  * class toggling
  * transition model for content swaps

## Features

* `kutty-on="myEvent: ...""` attribute for handling custom events
* kutty javascript API
  * find
  * findAll
  * closest
  * remove
  * sequence(op1, op2)
  * add/remove/toggleClass
  * trigger
* `kutty-requests` class on body
* local references (e.g. kt-get="#foo")
* polling cancellation API 205 code
* focus recapture
* Move to weakmap for kutty node info?  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
* Scroll handler use https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API if available?

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
