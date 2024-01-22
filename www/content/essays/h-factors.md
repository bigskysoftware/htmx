+++
title = "How HTML with htmx Satisfies All Nine H-Factors"
date = 2024-01-26
updated = 2024-01-26
[taxonomies]
author = ["Deniz Akşimşek"]
tag = ["posts"]
+++

## <q>_What_ factors?</q>

As far as I can discern, it is in a blog post dated September 2011 that Mike Amundsen first classifies the various hypermedia formats used on the Web by their affordances, and classifies these affordances by their properties of _safety_, _idempotence_, _mutability_ and _presentation_:

> <dl>
> <dt>Safety
> <dd> the affordance offers either a safe action (HTML.A) or an unsafe action (ATOM.LINK@rel="edit"). 
> <dt>Idempotence
> <dd> the affordance represents either an idempotent action (HTML.FORM@method="get") or a non-idempotent action (HTML.FORM@method="post"). 
> <dt>Mutability
> <dd> the affordance is meant to support modification (mutable) by the client (HTML.FORM) or the affrodance is immutable (HTML.LINK). 
> <dt>Presentation
> <dd> the result of activating the affordance should either be treated as a navigation (HTML.A) or as a transclusion (HTML.IMG). 
> </dl>

&mdash; Mike Amundsen, <q>[hypermedia affordances](http://www.amundsen.com/blog/archives/1109)</q>, (2011, mca blog).

From these principles, he derives the 9 _H-Factors_, elements in a media type each having some combination of these aspects. He defines 9 factors, each of which can be present in a media type per the choice of the designer.

These H-Factors are first introduced in <cite>Building Hypermedia APIs with HTML5 and Node</cite> (2011) and also feature in <q>[Hypermedia-Oriented Design](https://www.w3.org/2011/10/integration-workshop/p/hypermedia-oriented-design.pdf)</q> (2011), and we will explain them throughout this essay as well.

A notable aspect of the Factors is that, as this helpful chart shows, no hypermedium in common use on the Web implements all 9.

<iframe src="https://gtramontina.com/h-factors/" width=100% height=400px></iframe>

&mdash; Guilherme J. Tramontina, <q>[Hypermedia Factors](https://gtramontina.com/h-factors/)</q>.

The only format on the list implementing all Factors is [UBER](http://uberhypermedia.org/), a minimalist format with supporting the Factors as an explicit design goal. While UBER has interesting properties, such as being serialization- and protocol-agnostic, its minimalist design and lack of any presentational or semantic elements prevent it from achieving the broad use of, say, HTML.

What if HTML itself supported the H-Factors? This would not only make them more accessible, but also make it easier to demonstrate the usefulness of the Factors as they can be applied to real Web applications. That is what we will attempt to do in this post using htmx, because **HTML enhanced with htmx supports all 9 H-Factors.**.

## LO: Link, Outbound

_Safe, Idempotent, Immutable, Presentation: Navigation._

Outbound links are the archetypal hypermedia affordance, being embodied in HTML by the venerable `<a href>`.

htmx enhances the link via `hx-boost`, which can be combined with other htmx attributes to e.g. preserve certain elements across navigations. However, it also reduces the [visibility](https://ics.uci.edu/~fielding/pubs/dissertation/net_app_arch.htm#sec_2_3_5) of navigations, which can manifest in UX degradation such as the browser loading indicator not working, or error pages being swallowed without further configuration.


## LE: Link, Embed

_Safe, Idempotent, Immutable, Presentation: Transclusion._

Any HTML element with a `src` attribute fits &mdash; iframes most prominently, but Amundsen makes clear that elements like `<img>` and `<audio>` also count, even if the resources being embedded are not themselves hypertext.

In htmx, the [lazy loading pattern](@/examples/lazy-load.md) is an example of LE, which is an upgrade over HTML's stock solutions as it allows the host and transcluded content to be part of the same DOM.

## LT: Link, Template

_Safe, Idempotent, Mutable, Presentation: Navigation._

"Templated" links allow the user to input values to be used as part of the request. In HTML, they are forms with `action=GET`.

htmx enhances forms in too many ways to count. [`hx-include`](@/attributes/hx-include.md) and [`hx-vals`](@/attributes/hx-vals.md) are a few examples. 

## LN: Link, Non-idempotent

_Unsafe, Non-idempotent, Mutable, Presentation: Navigation._

Yes, a non-idempotent action is still a link for the purposes of H-Factors! Present in HTML as `<form method="post">`, htmx enhances this control in the ways mentioned before as well as allowing these interactions to be performed via other HTML elements, such as buttons or inputs.

## LI: Link, Idempotent

_Unsafe, Idempotent, Mutable, Presentation: Navigation._

Bizarrely, these interactions are not present in HTML, despite their hypothetical implementation being as simple as `<form method="put">` (or `"delete"`). htmx provides [`hx-put`](@/attributes/hx-put.md) and [`hx-delete`](@/attributes/hx-delete.md) for idempotent actions.

## CR: Control read requests

The C-series of H-factors relate to the control afforded to document authors to alter aspects of network requests. CR refers to the ability of documents to alter headers related to reading data, such as `Accept`. Though htmx does not have explicit support for this, and expects responses to be in `text/html`, it's totally possible to set it via [`hx-headers`](@/attributes/hx-headers.md), as with any other request header:

```html
<button
  hx-get="/data"
  hx-headers='{ "Accept": "text/vnd.myapp-datatype+html" }'>
```

## CU: Control update requests

The `Content-Type` of a request and similar. HTML already supports it via `enctype`, and htmx makes it accessible via [`hx-encoding`](@/attributes/hx-encoding.md).

## CM: Control method

In HTML, you can have any method you want, as long as it's `GET` or `POST`. The `hx-{get,post,put,patch,delete}` series of attributes extend this. Custom methods are not supported, however.

## CL: Control link relation

This is the ability to describe the semantic relationship between the linking and linked documents, which HTML already provides the `rel` attribute for. htmx makes no effort to extend this.

## Aside: Transclusion-Navigation

The Presentation aspect of H-Factors suggests a strict binary of transclusion and navigation, whereas even the simplest example of htmx in use (click button, data is fetched and swapped into the document) demonstrates a hybrid of the two. This transclusive navigation is an extremely common pattern in web applications, but perhaps hasn't been analyzed sufficiently from a hypermedia lens as it is not present in HTML and is (without htmx) usually implemented through frameworks that imitate traditional UI toolkits rather than hypermedia.

## The (htm) X Factor

The H-Factors are a map of the hypermedia design space, and let us analyze to what degree a hypermedia system empowers authors to create versatile applications. We looked at how htmx completes HTML as a hypermedia from the lens of the Factors. At the same time, htmx and other hypermedia oriented libraries can let us explore corners of hypermedia yet uncharted by the Factors.
