+++
title = "The fetch()ening"
description = """\
  You know, technically, I never said anything about a version *four*"""
date = 2025-11-01
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

![Stop trying to make fetch() happen](/img/fetch.png)

OK, I said there would never be a version three of htmx.  

But, _technically_, I never said anything about a version *four*...

## htmx 4: The fetch()ening

In [The Future of htmx](@/essays/hypermedia-driven-applications.md) I said the following:

> We are going to work to ensure that htmx is extremely stable in both API & implementation. This means accepting and
documenting the [quirks](https://htmx.org/quirks/) of the current implementation.

Earlier this year, on a whim, I created [fixi.js](https://github.com/bigskysoftware/fixi), a hyperminimalist implementation
of the ideas in htmx.  That work gave me a chance to get a lot more familiar  with the `fetch()` and, especially, the 
[async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) infrastructure 
available in JavaScript.

In doing that work I began to wonder if that, while the htmx [API](https://htmx.org/reference/#attributes) 
is (at least reasonably) correct, maybe there was room for a more dramatic change of the implementation that took 
advantage of these features in order to simplify the library.

Further, changing from ye olde [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
(a legacy of htmx 1.0 IE support) to [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) would
be a pretty violent change, guaranteed to break at least *some* stuff.  

So I began thinking: if we are going to consider moving to fetch, then maybe we should _also_ use this update as a
chance address at least _some_ of the [quirks & cruft](https://htmx.org/quirks/) that htmx has acquired over its lifetime.

So, eventually & reluctantly, I have changed my mind: there _will_ be another major version of htmx.

However, in order to keep my word that there will not be a htmx 3.0, the next release will instead be htmx 4.0.

## Project Goals

With htmx 4.0 we are rebuilding the internals of htmx, based on the lessons learned from 
fixi.js and [five+ years](https://www.npmjs.com/package/htmx.org/v/0.0.1) of supporting htmx.  

There are three major simplifying changes:

### The fetch()ening

The biggest internal change is that `fetch()` will replace `XMLHttpRequest` as the core ajax infrastructure.  This
won't actually have a huge effect on most usages of htmx _except_ that the events model will necessarily change due
to the differences between `fetch()` and `XMLHttpRequest`.

### The Long National Nightmare of Implicit Attribute Inheritance Ends

I feel that my biggest mistake in htmx 1.0 & 2.0 was making attribute inheritance _implicit_.  I was inspired by CSS in
doing this, and the results have been roughly the same as CSS: powerful & maddening.

In htmx 4.0, attribute inheritance will be *explicit* rather than *implicit*, via the `:inherited` modifier: 

```html
  <div hx-target:inherited="#output">
    <button hx-post="/up">Like</button>
    <button hx-post="/down">Dislike</button>
  </div>
  <output id="output">Pick a button...</output>
```

Here the `hx-target` attribute is explicitly declared as `inherited` on the enclosing `div` and, if it wasn't, the 
`button` elements would not inherit the target from it.

This will be the most significant upgrade change to deal with for most htmx users.

### The Tyranny Of Locally Cached History Ends

Another constant source of pain for both us and for htmx users is history support.  htmx 2.0 stores history in local 
cache to make navigation faster.  Unfortunately, snapshotting the DOM is often brittle because of third-party 
modifications, hidden state, etc.  There is a terrible simplicity to the web 1.0 model of blowing everything away and
starting over.  There are also security concerns storing history information in session storage.

In htmx 2.0, we often end up recommending that people facing history-related issues simply disable the cache entirely,
and that usually fixes the problems.

In htmx 4.0, history support will no longer snapshot the DOM and keep it locally.  It will, rather, issue a network 
request for the restored content.  This is the behavior of 2.0 on a history cache-miss, and it works reliably with 
little effort on behalf of htmx users.

We will offer an extension that enables history caching like in htmx 2.0, but it will be opt-in, rather than the default.

This tremendously simplifies the htmx codebase and should make the out-of-the-box behavior much more plug-and-play.

## What Stays The Same?

Most things.

The [core](https://dl.acm.org/doi/10.1145/3648188.3675127) functionality of htmx will remain the same, `hx-get`, `hx-post`,
`hx-target`, `hx-boost`, `hx-swap`, `hx-trigger`, etc.

Except for adding an `:inherited` modifier on a few attributes, many htmx projects will "just work" with htmx 4.  

These changes will make the long term maintenance & sustainability of the project much stronger.  It will also take
pressure off the 2.0 releases, which can now focus on stability rather than contemplating new features.

## Upgrading

That said, htmx 2.0 users _will_ face an upgrade project when moving to 4.0 in a way that they did not have to in moving
from 1.0 to 2.0.  

I am sorry about that, and want to offer three things to address it:

* htmx 2.0 (like htmx 1.0 & intercooler.js 1.0) will be supported _in perpetuity_, so there is absolutely _no_ pressure to 
  upgrade your application: if htmx 2.0 is satisfying your hypermedia needs, you can stick with it.
* We will create extensions that revert htmx 4 to htmx 2 behaviors as much as is feasible (e.g. Supporting the old implicit
  attribute inheritance model, at least)
* We will roll htmx 4.0 out slowly, over a multi-year period.  As with the htmx 1.0 -> 2.0 upgrade, there will be a long
  period where htmx 2.x is `latest` and htmx 4.x is `next`

## New Features

Of course, it isn't all bad.  Beyond simplifying the implementation of htmx significantly, switching to fetch also gives 
us the opportunity to add some nice new features to htmx

### Streaming Responses & SSE in Core

By switching to `fetch()`, we can take advantage of its support for 
[readable streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams), which
allow for a stream of content to be swapped into the DOM, rather than a single response.

htmx 1.0 had Server Sent Event support integrated into the library.  In htmx 2.0 we pulled this functionality out as an 
extension.  It turns out that SSE is just a specialized version of a streaming response, so in adding streaming 
support, it's an almost-free free two-fer to add that back into core as well.

This will make incremental response swapping much cleaner and well-supported in htmx.

### Morphing Swap in Core

[Three years ago](https://github.com/bigskysoftware/idiomorph/commit/7760e89d9f198b43aa7d39cc4f940f606771f47b) I had
an idea for a DOM morphing algorithm that improved on the initial algorithm pioneered by [morphdom](https://github.com/patrick-steele-idem/morphdom).

The idea was to use "id sets" to make smarter decisions regarding which nodes to preserve and which nodes to delete when
merging changes into the DOM, and I called this idea "idiomorph".  Idiomorph has gone on to be adopted by many other
web project such as [Hotwire](https://hotwired.dev/).

We strongly considered including it in htmx 2.0, but I decided not too because it worked well as an extension and
htmx 2.0 had already grown larger than I wanted.

In 4.0, with the complexity savings we achieved by moving to `fetch()`, we can now comfortably fit a `morphInner` and
`morphOuter` swap into core, thanks to the excellent work of Michael West.

### Explicit &lt;partial&gt; Tag Support

htmx has, since very early on, supported a concept of "Out-of-band" swaps: content that is removed from the main HTML
response and swapped into the DOM elsewhere.  I have always been a bit ambivalent about them, because they move away
from [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/), but there is no doubt that they are useful
and often crucial for achieving certain UI patterns.

Out-of-band swaps started off very simply: if you marked an element as `hx-swap-oob='true'`, htmx would swap the element
as the outer HTML of any existing element already in the DOM with that id.  Easy-peasy.

However, over time, people started asking for different functionality around Out-of-band swaps: prepending, appending, 
etc. and the feature began acquiring some fairly baroque syntax to handle all these needs.

We have come to the conclusion that the problem is that there are really _two_ use cases, both currently trying to be
filled by Out-of-band swaps:

* A simple, id-based replacement
* A more elaborate swap of partial content

Therefore, we are introducing the notion of `<partial>`s in htmx 4.0

A partial element is, under the covers, a template element and, thus, can contain any sort of content you like.  It 
specifies on itself all the standard htmx options regarding swapping, `hx-target` and `hx-swap` in particular, allowing
you full access to all the standard swapping behavior of htmx without using a specialized syntax.  This tremendously
simplifies the mental model for these sorts of needs, and dovetails well with the streaming support we intend to offer.

Out-of-band swaps will be retained in htmx 4.0, but will go back to their initial, simple focus of simply replacing 
an existing element by id.

### Improved View Transitions Support

htmx 2.0 has had [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) support since
[April of 2023](https://github.com/bigskysoftware/htmx/blob/master/CHANGELOG.md#190---2023-04-11).  In the interceding
two years, support for the feature has grown across browsers (c'mon, safari, you can do it) and we've gained experience
with the feature.

One thing that has become apparent to us while using them is that, to use them in a stable manner, it is important
to establish a _queue_ of transitions, so each can complete before the other begins.  If you don't do this, you can get
visually ugly transition cancellations.

So, in htmx 4.0 we have added this queue which will ensure that all view transitions complete smoothly.

CSS transitions will continue to work as before as well, although the swapping model is again made much simpler by the 
async runtime.

We may enable View Transitions by default, the jury is still out on that.

### Stabilized Event Ordering

A wonderful thing about `fetch()` and the async support in general is that it is _much_ easier to guarantee a stable
order of events.  By linearizing asynchronous code and allowing us to use standard language features like try/catch,
the event model of htmx should be much more predictable and comprehensible.

We are going to adopt a new standard for event naming to make things even clearer:

`htmx:<phase>:<system>[:<optional-sub-action>]`

So, for example, `htmx:before:request` will be triggered before a request is made.

### Improved Extension Support

Another opportunity we have is to take advantage of the `async` behavior of `fetch()` for much better performance in our
preload extension (where we issue a speculative (`GET` only!) request in anticipation of an actual trigger).  We have 
also added an optimistic update extension to the core extensions, again made easy by the new async features.

In general, we have opened up the internals of the htmx request/response/swap cycle much more fully to extension developers,
up to and including allowing them to replace the `fetch()` implementation used by htmx for a particular request.  There
should not be a need for any hacks to get the behavior you want out of htmx now: the events and the open "context" object
should provide the ability to do almost anything.

### Improved `hx-on` Support

In htmx 2.0, I somewhat reluctantly added the [`hx-on`](https://htmx.org/attributes/hx-on/) attributes to support light
scripting inline on elements.  I added this because HTML does not allow you to listen for arbitrary events via `on` 
attributes: only standard DOM events like `onclick` can be responded to.

We hemmed and hawed about the syntax and so, unfortunately, there are a few different ways to do it.

In htmx 4.0 we will adopt a single standard for the `hx-on` attributes: `hx-on:<event name>`.  Additionally, we are
working to improve the htmx JavaScript API (especially around async operation support) and will make those features
available in `hx-on`:

```html
<button hx-post="/like"
        hx-on:htmx:after:swap="await timeout('3s'); ctx.newContent[0].remove()">
    Get A Response Then Remove It 3 Seconds Later
</button>
```

htmx will never support a fully featured scripting mechanism in core, we recommend something like 
[Alpine.js](https://alpinejs.dev/) for that, but our hope is that we can provide a relatively minimalist API that
allows for easy, light async scripting of the DOM.

I should note that htmx 4.0 will continue to work with `eval()` disabled, but you will need to forego a few features like
`hx-on` if you choose to do so.

### A Better But Familiar htmx

All in all, our hope is that htmx 4.0 will feel an awful lot like 2.0, but with better features and, we hope, with fewer bugs.

## Timeline

As always, software takes as long as it takes.  

However, our current planned timeline is:

* An alpha release is available _today_:  `htmx@4.0.0-alpha1`
* A 4.0.0 release should be available in early-to-mid 2026
* 4.0 will be marked `latest` in early-2027ish

You can track our progress (and see quite a bit of dust flying around) in the `four` branch on 
[github](https://github.com/bigskysoftware/htmx/tree/four) and at:

<https://four.htmx.org>

Thank you for your patience and pardon our dust!

> "Well, when events change, I change my mind. What do you do?" --Paul Samuelson or John Maynard Keynes