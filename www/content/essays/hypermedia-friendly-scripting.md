+++
title = "Hypermedia-Friendly Scripting"
date = 2022-11-17
updated = 2022-11-29
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

> The final addition to our constraint set for REST comes from the code-on-demand style of Section 3.5.3 (Figure 5-8). 
> REST allows client functionality to be extended by downloading and executing code in the form of applets or scripts. 
> This simplifies clients by reducing the number of features required to be pre-implemented. Allowing features to be 
> downloaded after deployment improves system extensibility. However, it also reduces visibility, and thus is only an
> optional constraint within REST.
>
> \-\-[Roy Fielding - Representational State Transfer (REST)](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7)

## Scripting & The Web {#scripting_and_the_web}

In [Hypermedia-Driven Applications](@/essays/hypermedia-driven-applications.md) we discuss how to build
web applications in such a manner that they are _hypermedia_-driven, in contrast with the popular SPA approach, in which
they are _JavaScript_ and, at the network-level, [RPC-driven](@/essays/how-did-rest-come-to-mean-the-opposite-of-rest.md).

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

## The Prime Directive {#prime_directive}

The prime directive of an HDA is to use [Hypermedia As The Engine of Application State](@/essays/hateoas.md).
A hypermedia-friendly scripting approach will follow this directive.  

**Practically, this means that scripting should avoid making non-hypermedia exchanges over the network with a server.**

So, in general, hypermedia-friendly scripting should avoid the use of `fetch()` and `XMLHttpRequest` _unless_ the responses
from the server use a hypermedia of some sort (e.g. HTML), rather than a data API format (e.g. plain JSON).

Respecting HATEOAS also means that, in general, complicated state stored in JavaScript (rather than in the DOM) should 
be avoided.

However, this last statement needs to be qualified: state may be stored client-side in JavaScript so long as it is 
directly supporting a more sophisticated front-end experience (e.g. widget) than pure HTML allows.  

To reiterate what Fielding says regarding the purpose of scripting in REST:

> Allowing features to be downloaded after deployment improves system extensibility.

So scripting is a legitimate part a REST-ful system, in order to allow the creation of additional features not directly implemented
within the underlying hypermedia, thus making a hypermedia (e.g. HTML) more extensible.

A good example of this sort of feature is a rich-text editor: it might have an extremely sophisticated JavaScript model
of the editor's document, including selection information, highlighting information, code completion and so forth.
However, this model should be isolated from the rest of the DOM and the rich text editor should expose its information
to the DOM using standard hypermedia features.  For example, it should use a hidden input to communicate the contents of the
editor to the surrounding DOM, rather than requiring a JavaScript API call to get the content.

The idea is to use scripting to improve the hypermedia experience by providing features and functionality that are
not part of the standard hypermedia (HTML) tool set, but do so in a way that plays well with HTML, rather than relegating
HTML to a mere UI description language within a larger JavaScript application, as many SPA frameworks do.

## State

Note that using Hypermedia As The Engine Of Application State does not mean that you cannot have _any_ client-side state.
Obviously, the rich-text editor example cited above may have a significant amount of client-side state.  But
there are simpler cases where client-side state are warranted and perfectly consistent with a Hypermedia-Driven Application.

Consider a simple visibility toggle, where clicking a button or anchor adds a class to another element, making it visible.

This ephemeral client-side state is fine in a Hypermedia-Driven Application, because the state is purely front-end.  No
system state is being updated with this sort of scripting.  If system state were to be mutated (that is, if showing or
hiding the element had an effect on the data stored on the server), then it would be necessary to use a hypermedia
exchange. 

The crucial aspect to consider is whether any state updated on the client side needs to be synchronized with the server.  
If yes, then a hypermedia exchange should be used.  If no, then it is fine to keep the state client-side only.

## Events

One excellent way for a JavaScript library to enable hypermedia-friendly scripting is for it to have 
[a rich custom event model](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events).

A JavaScript-based component that triggers events allows for hypermedia-oriented JavaScript libraries, such as htmx,
to listen for those events and trigger hypermedia exchanges.  This, in turn, makes any JavaScript library a potential
_hypermedia control_, able to drive the Hypermedia-Driven Application via user-selected actions.

A good example of this is the [Sortable.js](@/examples/sortable.md) example, in which htmx listens for
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
[`hx-trigger`](@/attributes/hx-trigger.md) attribute and then issues an HTTP request, exchanging hypermedia with the 
server.  This turns this Sortable.js drag-and-drop powered widget into a new, powerful hypermedia control.

## Islands

A recent trend in web development is the notion of ["islands"](https://www.patterns.dev/posts/islands-architecture/):

> The islands architecture encourages small, focused chunks of interactivity within server-rendered web pages.

In cases where a more sophisticated scripting approach is required and where communication with a server
outside of the normal hypermedia-exchange mechanism is necessary, the most hypermedia-friendly approach is to use the island
architecture.  This isolates non-hypermedia components from the rest of the Hypermedia-Driven Application.

Events are a clean way to integrate your non-hypermedia-driven islands within a broader Hypermedia-Driven Application, 
allowing you to convert an "inner" island into an "outer" hypermedia control, just as in the case of the Sortable.js example
above.

Deniz Akşimşek has made the observation that it is typically easier to embed non-hypermedia islands within a larger
Hypermedia-Driven Application, rather than vice-versa.

## Inline Scripts {#inline}

A final rule for hypermedia-friendly scripting is inline scripting: writing your scripts directly within a hypermedia, 
rather than locating your scripts in an external file.  This is a controversial concept compared with the others
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

A primary advantage of this inline approach to hypermedia scripting is that, conceptually, the hypermedia itself is 
emphasized, rather than the scripting of the hypermedia.

Contrast this code with [JSX Components](https://reactjs.org/docs/components-and-props.html), where the
scripting language (JavaScript) is the core concept, with hypermedia/HTML embedded within it:

```js
class Button extends React.Component {
    constructor(props) {
        // ...
    }
    toggleVisibilityOnNextSection() {
        // ...
    }
    render() {
        return <button onClick={this.toggleVisibilityOnNextSection}>{this.props.text}</button>;
    }
}
```

Here, you can see that the JavaScript is the primary technology in use, with the hypermedia/HTML being used as a UI
description mechanism.  The fact that the HTML is a hypermedia is almost immaterial in this case.

That being said, the inline scripting and the JSX approach do share an advantage in common: both satisfy the [Locality of Behavior(LoB)](@/essays/locality-of-behaviour.md),
design principle.  They both _localize_ behavior to the elements or components in question, which makes it easier to see
what these elements and components do.

Of course, with inline scripts, there should be a soft limit to the amount of scripting done directly within the 
hypermedia.  You don't want to overwhelm your hypermedia with scripting, so that it becomes difficult to understand "the shape"
of the hypermedia document.  

Using techniques like invoking library functions or using [hyperscript behaviors](https://hyperscript.org/features/behavior/) 
allow you to use inline scripting while pulling implementations out to a separate file or location.

Inline scripting isn't required for scripting to be hypermedia-friendly, but it is worth considering as an alternative to a 
more traditional scripting/hypermedia split.

## Pragmatism

Of course, here in the real world, there are many useful JavaScript libraries that violate HATEOAS and that do not trigger 
events.  This often makes them difficult fits for a Hypermedia-Driven Application.  Nonetheless, these libraries may 
provide crucial bits of functionality that are difficult to find elsewhere.  

In cases like this, we advocate pragmatism: if it is easy enough to alter the library to be hypermedia-friendly or to
wrap it in a hypermedia-friendly way, that may be a good option.  You never know, the upstream author might 
[consider a pull request](https://github.com/dropzone/dropzone/commit/64771e35baf032ee0910d1e56e6f44457efe138e) 
to help improve their library.

But, if not, and if there are no good alternatives, then just use the JavaScript library as it is designed.

Try to isolate a hypermedia-unfriendly library from the rest of your application, but, in general, do not
spend too much of your [complexity budget](https://hyperscript.org/docs/#debugging) on maintaining conceptual purity:
sufficient unto the day is the evil thereof.
