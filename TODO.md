## GOALS

* Dependency-free implementation of intercooler.js
* Support IE11 (stretch: IE10)
* < 6k in .min.gz form

## TODOS

* Testing
  * history
  * polling
  * kt-boost
  * interval parsing
  * table elements in responses
  * scrolling/'revealed' event
  * checkbox inputs
  * kt-swap-oob (verify, chrome coverage tool bad?)
  * X-KT-Trigger response header
  * SSE stuff
  * kt-trigger delay
  * class operation parsing
  * class toggling
  * transition model for content swaps


* `kutty-on="myEvent: ...""` attribute for handling custom events
* `kutty-requests` class on body
* local references (e.g. kt-get="#foo")
* polling cancellation API 205 code
* meta config tag
* focus recapture
* kutty javascript API
  * find
  * findAll
  * closest
  * remove
  * sequence(op1, op2)
  * add/remove/toggleClass
  * trigger

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