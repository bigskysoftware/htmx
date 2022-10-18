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
 developers to create more powerful hypermedia-driven interactions.
 
Following the REST notion of architectural [constraints](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm),
two such constraints characterize the HDA architecture: 

* An HDA uses *declarative, HTML-embedded syntax* rather than imperative scripting to achieve better front-end interactivity

* An HDA interacts with the server **in terms of hypermedia** (i.e. HTML) rather than a non-hypermedia format (e.g. JSON)

By adopting these two constraints, the HDA architecture stays within the original 
[REST-ful](https://developer.mozilla.org/en-US/docs/Glossary/REST) architecture of the web in a way that the SPA architecture
does not.  

In particular, HDAs continue to use [Hypermedia As The Engine of Application State (HATEOAS)](/essays/hateoas/), whereas
most SPAs abandon HATEOAS in favor of a client-side model and data (rather than hypermedia) APIs.

## An Example SPA fragment

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

This is a UX pattern that would typically be associated with an SPA: as the user types, after a slight pause, search 
results will populate the result table below.  However, in this case, it is being achieved entirely within HTML,
in a manner consonant with HTML.

This example effectively demonstrates the essential characteristic of an HDA:

* The front end of the feature is specified entirely in  declarative htmx attributes, directly in HTML

* The interaction with the server is done via HTTP and HTML: an HTTP `POST` request is sent to the server, HTML is 
  returned by the server and htmx inserts this HTML into the DOM

## Scripting In An HDA

[Code-On-Demand](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7) is an optional
constraint of the original REST-ful architecture of the web.

Similarly, the HDA architecture has a final, optional constraint:

* Code-On-Demand (i.e. scripting) should, as much as is practical, be done *directly in* the primary hypermedia

This addresses the concern regarding Code-On-Demand that Roy Fielding mentions in his thesis:

>  However, (Code-On-Demand) also reduces visibility, and thus is only an optional constraint within REST.

By embedding Code-On-Demand (scripts) directly in HTML, visibility is enhanced, satisfying the 
[Locality of Behavior](/essays/locality-of-behaviour/) software design principle.

Three approaches to scripting that satisfy this third constraint are [hyperscript](https://hyperscript.org), 
[AlpineJS](https://alpinejs.dev) and [VanillaJS](http://vanilla-js.com/) (when embedded directly on HTML elements).

Here is an example of each of these approaches:

```html
<!-- hyperscript -->
<button _="on click toggle .red-border">
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

In an HDA, hypermedia (HTML) is the primary medium for building the application, which means that:

* All communication with the server is still managed via HTTP requests with hypermedia (HTML) responses
* Scripting is used mainly to enhance the *front-end experience* of the application

Scripting augments the existing hypermedia (HTML) but do not *supersede* it or subvert the fundamental REST-ful
architecture of the HDA.

## HDA-style libraries

The following libraries allow developers to create HDAs:

* <https://htmx.org>
* <https://unpoly.com/>
* <https://kasta-ua.github.io/twinspark-js/>
* <https://hotwire.dev>
* <https://hyperview.org/> (a mobile hypermedia!)

The following scripting libraries, when used appropriately, complement the HDA approach:

* <https://hyperscript.org>
* <https://alpinejs.dev/>
* <http://vanilla-js.com/> (embedded directly in HTML)

## Conclusion

The HDA architecture is a synthesis of two preceding architectures: the original Multi-Page Application (MPA) architecture
 and the (relatively) newer Single-Page Application architecture.  

It attempts to capture the advantages of both: the simplicity and reliability of MPAs, with a 
[REST-ful Architecture](https://developer.mozilla.org/en-US/docs/Glossary/REST) that uses 
[Hypermedia As The Engine Of Application State](/essays/hateoas/)), while providing a better user experience, on par
with SPAs in many cases.

<div style="padding-top: 120px;padding-bottom:40px;text-align: center">
&lt;/&gt;
</div>