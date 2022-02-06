---
layout: layout.njk
tags: posts
title: </> htmx - high power tools for html
---

## Genesis

> thesis: MPA - multi-page application
>
> antithesis: SPA -  single-page application
>
> synthesis: HDA - hypermedia-driven application
>
> \-\-[@htmx_org](https://twitter.com/htmx_org/status/1490318550170357760)

## The Hypermedia-Driven Application Architecture

The **Hypermedia Driven Application (HDA)** architecture is a new/old approach to building web applications.  It combines
the simplicity & flexibility of traditional Multi-Page Applications (MPAs) with the better user experience of 
[Single-Page Applications](https://en.wikipedia.org/wiki/Single-page_application) (SPAs).

The HDA architecture achieves this goal by extending the existing HTML infrastructure of the web to allow hypermedia
 developers to use more powerful hypermedia-driven interactions.
 
Two [constraints](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) characterize the HDA architecture: 

* The application uses a **declarative, HTML-embedded syntax**, rather than imperative scripting, to achieve better front end interactivity
* The application interacts with the server **in terms of hypermedia** (i.e. HTML) rather than another format (e.g. JSON)

The HDA architecture falls within the **original [REST-ful](https://developer.mozilla.org/en-US/docs/Glossary/REST) 
architecture of the web** in a way that contrasts with the SPA architecture.  In particular, HDAs make **effective use
of [HATEOAS](/essays/hateoas/)** in a way that SPAs typically do not.

## An Example

Consider the htmx [Active Search](/examples/active-search) example:

```html
<h3> 
  Search Contacts 
  <span class="htmx-indicator"> 
    <img src="/img/bars.svg"/> Searching... 
   </span> 
</h3>
<input class="form-control" type="search" 
       name="search" placeholder="Begin Typing To Search Users..." 
       hx-post="/search" 
       hx-trigger="keyup changed delay:500ms, search" 
       hx-target="#search-results" 
       hx-indicator=".htmx-indicator">

<table class="table">
    <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
      <th>Email</th>
    </tr>
    </thead>
    <tbody id="search-results">
    </tbody>
</table>
```

Here htmx is being used to achieve a UX pattern that would typically be associated with an SPA: as the user types,
after a slight pause, results will populate the result table below.

This example effectively demonstrates the essential characteristic of an HDA:

* The front end of the feature is specified entirely in `hx-` declarative attributes, directly in HTML
* The interaction with the server is done via HTTP and HTML: an HTTP request is sent, HTML is returned and inserted into the DOM

## The Place of Scripting In An MDA

[Code-On-Demand](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7) is an optional
constraint of the original REST-ful architecture of the web.

Similarly, the HDA architecture has a final, optional constraint:

* Code-On-Demand (i.e. scripting) should, as much as is practical, be done *directly in* the primary hypermedia

This addresses the concern regarding Code-On-Demand mentioned in Fielding's thesis:

>  However, it also reduces visibility, and thus is only an optional constraint within REST.

By embedding Code-On-Demand (scripts) directly in HTML, you increase visibility and satisfy the 
[Locality of Behavior](/essays/locality-of-behaviour/) design principle.

Three approaches to scripting that satisfy this constraint are [hyperscript](https://hyperscript.org), [AlpineJS](https://alpinejs.dev)
and [VanillaJS](http://vanilla-js.com/) (when embedded directly on HTML elements).

Here is an example of each demonstrating HDA-friendliness:

```html
<!-- hyperscript -->
<button _="toggle .red-border">
  Toggle Class
</button>

<!-- Alpine JS -->
<button @click="open = !open" :class="{'red-border' : open, '' : !open}">
  Toggle Class
</button>

<!-- VanillaJS -->
<button onclick="this.classList.toggle('red-border')">
  Toggle Class
</button>
```

Note that the hypermedia (HTML) is given primacy of place here: it is not an after-thought being produced by a client-side
templating engine.

The scripts *augment* the existing hypermedia but do not *supersede* it or subvert the fundamental REST-ful architecture
 of the system.

## HDA-style libraries

Some libraries that allow developers to build HDAs:

* <https://htmx.org>
* <https://unpoly.com/>
* <https://kasta-ua.github.io/twinspark-js/>
* <https://turbo.dev>

And some complementary, HDA-friendly scripting tools:

* <https://hyperscript.org>
* <https://alpinejs.dev/>
* <http://vanilla-js.com/> (embedded directly in HTML)

## Conclusion

The HDA architecture is a synthesis of two preceding architectures: the original Multi-Page Application (MPA) and the
(relatively) newer Single-Page Application.  

It attempts to capture the advantages of both: the simplicity and reliability
of MPAs (due to the [REST-ful Architecture](https://developer.mozilla.org/en-US/docs/Glossary/REST), in particular [HATEOAS](essays/hateoas/))

<div style="padding-top: 120px;padding-bottom:40px;text-align: center">
~~~
</div>