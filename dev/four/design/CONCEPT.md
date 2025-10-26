# htmx 3.0

htmx 3.0 is a ground up rewrite of htmx using modern APIs

The following features will be added to fixi:

* Extended selector support (e.g. `next .foo`)
* Extended event support (e.g. `revealed`)
* Explicit attribute inheritance (e.g. `hx-will='hx-target hx-swap'`)
* Simple history support (no local cache, full body refresh on nav)
* SSE-support
* Extended headers similar to htmx
* Out of band swaps driven by header values (using same logic as SSE)

Explicitly not in scope are:

* More sophisticated request synchronization
* hx-boost functionality 
  * Recommend using [Navigation Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using#basic_mpa_view_transition)

Ideally, as a goal but not a suicide pact, the uncompressed unminified project stays under the combined compressed & 
minified version of preact + preact signals (roughly 7.7kB)

As with fixi & htmx, htmx will be dependency free, and I would love to keep the project package.json free, although
that may not be possible.

## MicroScript

Another aspect of htmx will be a small, hyperscript inspired scripting language.  It will be much smaller than hyperscript
and will be used with the `hx-live` attribute, like so:

```html
<button hx-action="/foo" hx-method="post" hx-target="#foo"
        hx-live="bind this.text to 'Submit ' + sum <input:checked/> + ' items'
                 bind this.disabled to sum <input:checked/> == 0">

<button>
```

### DOM-based Reactivity

A core feature of MicroScript will be one (default) and two-way reactive DOM-oriented bindings.  DOM-oriented reactivity is 
reactivity that is based on DOM state, rather than a separate data structure such as signals or javascript variables.

Expressions like this:

```js
#foo.data.count = 10
```

Work with data attributes on elements, and this would do something like add the following to the DOM:

```html
<div id="foo" data-count="10">
  ...
</div>
```

All state is kept in the DOM & htmx should keep track of what mutations affect that state.

### Event Handling

MicroScript will also be able to execute simple scripts in response to events

```html
<button hx-live="on click call doSomething(this, event)">
  Do Something
<button>
```

Depending on how much room we have, we may extend this functionality to be more like hyperscript

```html
<button hx-live="on click do 
                   call doSomething(this, event)
                   wait 2 seconds
                   call doSomethingElse(this) end">
  Do Something
<button>
```

We will see.


## Open Questions

* How should we lay the project out?  I'd like to minimize the # of files.  `/src`, `/test/`, `/web`?
* I would prefer to do this in pure JavaScript w/no build step.  Is that OK?
* Will DOM-based reactivity perform well enough?
* How much functionality can we add to MicroScript?
* How does the SSE connection get established?  Is there a standard URL we try to connect to (e.g. `/events`)?
* How is configuration done?  I like a `meta` tag.
* I would like to avoid `eval()` to make htmx CSP friendly

## License

htmx will be a BSD-0 licensed project

## AI Policy

AI may not be used to generate main-line code in the htmx.js file.

AI may be used to generate non-main-line code such as github action scripts, bash scripts, etc.  Code should always be
completely audited by a human and should be minimal in nature.

AI generated tests are acceptable, but must be based on human-written tests, be minimal and follow the existing tests
patterns.