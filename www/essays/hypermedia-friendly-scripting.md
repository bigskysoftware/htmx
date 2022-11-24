---
layout: layout.njk
tags: posts
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

## <a name="scripting_and_the_web"></a>[Scripting & The Web](#scripting_and_the_web)

In [Hypermedia-Driven Applications](https://htmx.org/essays/hypermedia-driven-applications/) we discuss how to build
web applications in such a manner that they are _hypermedia_-driven, in contrast with the popular SPA approach, in which
they are _JavaScript_ and, at the network-level, [RPC-driven](https://htmx.org/essays/how-did-rest-come-to-mean-the-opposite-of-rest/).

In the HDA article we mention scripting briefly:

> In an HDA, hypermedia (HTML) is the primary medium for building the application, which means that:
>
> * All communication with the server is still managed via HTTP requests with hypermedia (HTML) responses
> * Scripting is used mainly to enhance the front-end experience of the application
>
> Scripting augments the existing hypermedia (HTML) but does not supersede it or subvert the fundamental REST-ful 
> architecture of the HDA.

In this article we would like to expand on this last comment and describe what scripting that does not "supersede" or
"subvert" a REST-ful, Hypermedia-Driven Application looks like.  These rules of thumb apply to scripting written
directly to support a web application, as well as to general purpose JavaScript libraries.

The basic rules for hypermedia-friendly scripting are:

* [Respect HATEOAS](#prime_directive)
* [Client-side only state is OK](#state)
* [Use events to communicate between components](#events)
* [Use islands to isolate non-hypermedia components from the rest of your application](#islands)
* [Optionally, consider inline scripting](#inline)

Each of these rules will be elaborated on below.

## <a name="prime_directive"></a>[The Prime Directive](#prime_directive)

The prime directive of an HDA is to use [Hypermedia As The Engine of Application State](https://htmx.org/essays/hateoas/).
A hypermedia-friendly scripting approach will follow this directive.  

**Practically,this means that scripting should avoid making non-hypermedia exchanges over the network with a server.**

So, in general, hypermedia-friendly scripting should avoid the use of `fetch()` and `XMLHttpRequest` _unless_ the responses
from the server use a hypermedia of some sort (e.g. HTML), rather than a data API format (e.g. plain JSON).

Respecting HATEOAS also means that, in general, complicated state stored in JavaScript (rather than in the DOM) should 
be avoided.

However, this last statement needs to be qualified: state may be stored client-side in JavaScript so long as it is 
directly supporting a more sophisticated front-end experience (e.g. widget) than pure HTML allows.  

To reiterate what Fielding says regarding the purpose of scripting in REST:

> Allowing features to be downloaded after deployment improves system extensibility.

So scripting is a part a REST-ful system, in order to allow the creation of additional features not directly implemented
within the underlying hypermedia, thus making a hypermedia (e.g. HTML) more extensible.

A good example of this sort of feature is a rich-text editor: ith might have an extremely sophisticated JavaScript model
of the editor's document, including selection information, highlighting information, code completion and so forth.
However, this model should be isolated from the rest of the DOM and the rich text editor should expose its information
to the DOM using standard hypermedia features.  For example, it should use a hidden input to communicate the contents of the
editor to the surrounding DOM, rather than requiring a JavaScript API call to get the content.

The idea is to, yes, use scripting to improve the hypermedia experience by providing features and functionality that are
not part of the standard hypermedia (HTML) tool set, but do so in a way that plays well with HTML, rather than relegating
HTML a mere UI description language within a larger JavaScript application, as many SPA frameworks do.

## <a name="state"></a>[State](#state)

Note that using Hypermedia As The Engine Of Application State does not mean that you cannot have _any_ client-side state.
Obviously, the rich-text editor example cited above may have a significant amount of client-side state.  But
there are simpler cases where client-side state are warranted and perfectly consistent with a Hypermedia-Driven Application.

Consider a simple visibility toggle, where clicking a button or anchor adds a class to another element, making it visible.

This ephemeral client-side state is fine in a Hypermedia-Driven Application, because the state is purely front-end.  No
system state is being updated with this sort of scripting.  If system state were to be mutated (that is, if showing or
hiding the element had an effect on the data stored on the server), then it would be necessary to use a hypermedia
exchange. 

The crucial aspect to consider is whether any state updated on the client side needs to be synchronized with the server
side.  If yes, then a hypermedia exchange should be used.  If no, then it is fine to keep the state client-side only.

## <a name="events"></a>[Events](#events)

One excellent way for a JavaScript library to enable hypermedia-friendly scripting is for it to have 
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

## <a name="islands"></a>[Islands](#islands)

A recent trend in web development is the notion of ["islands"](https://www.patterns.dev/posts/islands-architecture/):

> The islands architecture encourages small, focused chunks of interactivity within server-rendered web pages.

In cases where a more sophisticated scripting approach is required, and where, in particular, communication with a server
outside of the normal hypermedia-exchange mechanism is necessary, the most hypermedia-friendly approach is to use the island
architecture.  This isolates non-hypermedia components from the rest of the Hypermedia-Driven Application.

Events are a clean way to integrate your non-hypermedia-driven islands within a broader Hypermedia-Driven Application, 
allowing you to convert an "inner" island into an "outer" hypermedia control, in the mode of the Sortable.js example
above.

Deniz Akşimşek has made the observation that it is typically easier to embed non-hypermedia islands within a larger
Hypermedia-Driven Application, rather than vice-versa.

## <a name="inline"></a>[Inline Scripts](#inline)

A final rule for hypermedia-friendly scripting is inline scripting: writing your scripts directly in a hypermedia, 
rather than locating your scripts in a separate file.  This is a controversial concept compared with the others
listed here, and we consider it an "optional" rule for hypermedia-friendly scripting: worth considering but not required.

This approach to scripting, while idiosyncratic, has been adopted by some HTML scripting libraries, notably
[Alpine.js](https://alpinejs.dev/) and [hyperscript](https://hyperscript.org).  

Here is some example hyperscript, showing an inline script:

```html
<button _="on click toggle .visible on the next <section/>">
    Show Next Section
</button>
<section>
    ....
</section>
```
This button, as it says, toggles the `.visible` class on the `section` element when it is clicked.

An advantage of this inline approach is that, conceptually, the hypermedia itself is emphasized over the scripting of the 
hypermedia.  Contrast this with [JSX Components](https://reactjs.org/docs/components-and-props.html), where the
scripting language is the core concept, with hypermedia/HTML embedded within it.

Inline scripts also have the advantage of [Locality of Behavior(LoB)](https://htmx.org/essays/locality-of-behaviour/),
an advantage they share with JSX.

Of course, with inline scripts, there should be a soft limit to the amount of scripting done directly within the 
hypermedia.  You don't want to overwhelm your hypermedia with scripting, so that it becomes difficult to understand "the shape"
of the hypermedia document.  

Using techniques like invoking library functions or using [hyperscript behaviors](https://hyperscript.org/features/behavior/) 
allow you to use inline scripting while pulling implementations out to a separate file or location.

Inline scripting isn't required for scripting to be hypermedia-friendly, but it is worth 
considering as an alternative to a more traditional scripting/hypermedia split.

## <a name="pragmatism"></a>[Pragmatism](#pragmatism)

Of course, here in the real world, there are many useful JavaScript libraries that violate HATEOAS and that do not trigger 
events.  This often makes them difficult fits for a Hypermedia-Driven Application.  Nonetheless, these libraries may 
provide crucial bits of functionality that are difficult to find elsewhere.  

In cases like this, we advise pragmatism: if it is easy enough to alter the library to be hypermedia-friendly or to
wrap it in a hypermedia-friendly way, that can be a good options.  You never know, the upstream author might 
[consider a pull request](https://github.com/dropzone/dropzone/commit/64771e35baf032ee0910d1e56e6f44457efe138e) 
to help improve their library.

But, if not, and if there are no good alternatives, then just use the JavaScript library as it is designed.

Try to isolate a hypermedia unfriendly library from the rest of your application, but, in general, do not
spend too much of your [complexity budget](https://hyperscript.org/docs/#debugging) on maintaining conceptual purity:
sufficient unto the day is the evil thereof.