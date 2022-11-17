---
layout: layout.njk
title: </> htmx - high power tools for html
---

# Hypermedia-Friendly Scripting

>The final addition to our constraint set for REST comes from the code-on-demand style of Section 3.5.3 (Figure 5-8). 
> REST allows client functionality to be extended by downloading and executing code in the form of applets or scripts. 
> This simplifies clients by reducing the number of features required to be pre-implemented. Allowing features to be 
> downloaded after deployment improves system extensibility. However, it also reduces visibility, and thus is only an
> optional constraint within REST.
>
> \-\-[Roy Fielding - Representational State Transfer (REST)](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7)

## Scripting & The Web

In [Hypermedia-Driven Applications](https://htmx.org/essays/hypermedia-driven-applications/) we discuss how to build
web applications in such a manner that they are _hypermedia_-driven, in contrast with the popular SPA approach, in which
they are _JavaScript_ and, at the network-level, [RPC-driven](https://htmx.org/essays/how-did-rest-come-to-mean-the-opposite-of-rest/).

In the HDA article we mentioned scripting briefly, advocating for _inline scripting_ as enabled by libraries such as
[Alpine.js](https://alpinejs.dev/) and [hyperscript](https://hyperscript.org).

We also said this:

> In an HDA, hypermedia (HTML) is the primary medium for building the application, which means that:
>
> * All communication with the server is still managed via HTTP requests with hypermedia (HTML) responses
> * Scripting is used mainly to enhance the front-end experience of the application
>
> Scripting augments the existing hypermedia (HTML) but does not supersede it or subvert the fundamental REST-ful 
> architecture of the HDA.

In this article we would like to expand a bit on this last bit and discuss what scripting that does not "supersede" or
"subvert" a REST-ful application looks like.

## The Prime Directive

The prime directive of an HDA is to use Hypermedia As The Engine of Application State.  A compatible scripting approach
will not violate this directive.  At a practical level, this means that scripting should avoid making non-hypermedia
exchanges over the network with a backing store.  (Recall, REST is a _network architecture_.)

This means that, in general, scripting should avoid the use of `fetch()` and `XMLHttpRequest` _unless_ the responses
from the server involve a hypermedia of some sort.

This also means that, in general, complicated state stored in JavaScript (rather than in the DOM) should be avoided.  
However, this statement needs to be qualified: sophisticated state may be stored client-side in JavaScript
so long as it is directly supporting a more sophisticated front-end experience (e.g. widget) than pure HTML allows.  Reiterating
what Roy Fielding says:

> Allowing features to be downloaded after deployment improves system extensibility.

A good example of this sort of feature is a rich-text editor: this may have an extremely sophisticated JavaScript model 
for the document being edited.  However, this model should be _encapsulated_ in the DOM.  The rich text editor should
participate in the DOM using the standard hypermedia API, such as using a hidden input to communicate the content of the
editor to the surrounding DOM, rather than requiring a JavaScript API call to get the content.

The idea is to, yes, use scripting to improve the hypermedia experience by providing features and functionality that are
not part of the standard hypermedia (HTML) tool set, but do so in a way that plays well with HTML, rather than flipping
the script and making HTML a UI-language of a larger JavaScript application.

## State

Note that using Hypermedia As The Engine Of Application State does not mean that you cannot have _any_ client-side state.
Obviously, the rich-text editor example cited above may have a significant amount of client-side state, for example.  But
there are much simpler cases where client-side state might be warranted.  Consider a simple visibility toggle, where
clicking a button or anchor adds a class to another element, making it visible.

This ephemeral client-side state is perfectly acceptable in an HDA, because it does not fundamentally alter the system
state.  At some level it is a very simplified "feature", akin to the rich text editor.

Again, the crucial aspect to consider here is that hiding or showing an element in this manner does not communicate with
the server and alter system state outside the normal hypermedia flow.

## Events

An excellent way for a JavaScript library to enable hypermedia-friendly scripting is for it to have 
[a rich custom event model](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events).

A JavaScript-based component that triggers events allows for hypermedia-oriented JavaScript libraries, such as htmx,
to listen for those events and trigger hypermedia exchanges.  This, in turn, makes any JavaScript library a potential
_hypermedia control_, able to drive the Hypermedia-Driven Application via user selected actions.

A good example of this is the [Sortable.js](https://htmx.org/examples/sortable/) example, in which htmx listens for
the `end` event triggered by Sortable.js:

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
  <div class="htmx-indicator">Updating...</div>
  <div><input type='hidden' name='item' value='1'/>Item 1</div>
  <div><input type='hidden' name='item' value='2'/>Item 2</div>
  <div><input type='hidden' name='item' value='3'/>Item 3</div>
  <div><input type='hidden' name='item' value='4'/>Item 4</div>
  <div><input type='hidden' name='item' value='5'/>Item 5</div>
</form>
```

The `end` event is triggered by Sortable.js when a drag-and-drop completes.  htmx listens for this event via the 
[`hx-trigger`](/attributes/hx-trigger) attribute and then issues an HTTP request, exchanging hypermedia with the backing
server.  This turns this Sortable.js drag-and-drop powered widget into a new, powerful hypermedia control.

## Islands

A recent trend in web development is the notion of ["islands"](https://www.patterns.dev/posts/islands-architecture/):

> The islands architecture encourages small, focused chunks of interactivity within server-rendered web pages.

In cases where a more sophisticated scripting approach is required, and where, in particular, communication with a server
outside of the hypermedia-exchange mechanism is necessary, the most hypermedia-friendly approach is to use the island
architecture.  This isolates non-hypermedia components from the rest of the Hypermedia-Driven Application.

Events are a clean way to integrate your non-hypermedia-driven islands within a broader Hypermedia-Driven Application, 
allowing you to convert an "inner" island into an "outer" hypermedia control, in the mode of the Sortable.js example
above.

Deniz Akşimşek has made the observation that it is typically easier to embed non-hypermedia islands within a 
Hypermedia-Driven Application, rather than vice-versa.

## Pragmatism

Of course, there are JavaScript libraries that violate HATEOAS and that do not trigger events, making them difficult
fits for a Hypermedia Driven Application.  Nonetheless, they may provide crucial functionality that is difficult to
find elsewhere.  

In cases like this, we advise pragmatism: if it is easy enough to wrap the JavaScript API that they
provide to integrate with the DOM and to trigger events, then that is a good route to go to adapt them to a Hypermedia-Driven
approach.  

But, if not, and if there are no good alternatives, then use the JavaScript library as it is designed, and then simply
try to limit the conceptual exposer of that library to the rest of the application.