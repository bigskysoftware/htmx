+++
title = "REST - Explained For Beginners"
date = 2021-07-13
updated = 2022-02-06
+++

There is no topic that generates more confusion in web development than the idea of Representational State Transfer, 
known as REST.  This term comes from [Chapter 5](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) 
of [Roy Fielding's](https://en.wikipedia.org/wiki/Roy_Fielding) PhD thesis at [U.C. Irvine](https://www.uci.edu/).

In this essay we will go through this Chapter and summarize the important concepts for non-academic web developers.  The 
thesis is dense and involves a lot of technical jargon that isn't relevant to people who aren't academics interested
in formal PhD thesis writing.

By the end of this essay you should have a better handle on REST, and the concept of a 
[Uniform Interface](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5) in particular.

## Overview

The first thing to understand about REST is that *it is a description of the original web*.  Fielding describes REST as an 
"architectural style for distributed hypermedia systems", which sounds fancy but just means the web we all know and love:
 clicking on hyperlinks, submitting forms, looking at images, reading paragraphs and all that jazz.

It was *NOT* created as a description of a particular approach for JSON APIs, although that is the context
that most people hear about REST today in.  Fielding was describing the early web and, in particular, how it was different
from earlier client/server architectures.

## Section 5.1 Deriving Rest

In [section 5.1](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1), unfortunately for 
non-academics, Fielding adopts the technique of deriving REST from first principles.  Here I will summarize each section
and clarify and add context in the important ones.

### [Client Server](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_2)

REST is, of course, a client-server architecture, since the web is a client (browser) server (http server) system.

### [Stateless](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_3)

The web, most developers know, is intended to be stateless.  All requests should encapsulate all information necessary
to understand that request.  For example, there should not be a long running transaction implicitly associated with a series
of requests, as you might have with a SQL database session.

### [Cache](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_4)

HTTP, you probably know, has a [caching mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) built into 
it.  You don't need to know the details of this now, but may explore it later.

### [Uniform Interface](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5)

This section, in my mind, is the crux of the REST architecture and, unfortunately, is very brief, so we will spend some
time expanding on it, rather that just summarizing it.  The chapter begins:

> The central feature that distinguishes the REST architectural style from other network-based styles 
> is its emphasis on a uniform interface between components 

To clarify the discussion around exactly what the uniform interface is, let's consider some simple HTML that I hope
everyone reading this will understand:

```html
<html
  <body>
  <section>
    <p>
      Name: Joe Blow
    </p>
    <p>
      Email: joe@blow.com
    </p>
    <p>
      <a href="/contacts/42/edit">Edit</a>
      <a href="/contacts/42/email">Email</a>
      <a href="/contacts/42/archive">Archive</a>
    </p>
  </section>
</body>
</html>
```

Here we have a basic bit of html, with some divs, a bit of information and then some anchor tags to perform various 
operations on a contact.  Nothing fancy.  Again, for the discussion, imagine this content could be found at 
<http://example.com/contacts/42>.

Back to the dissertation:

> REST is defined by four interface constraints: identification of resources; manipulation of resources through 
> representations; self-descriptive messages; and, hypermedia as the engine of application state.

Let's go through each of these in turn.

#### Identification of Resources

The first aspect of Rest is the idea of *resources* that are found somewhere via... well, [Universal Resource Locators](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_is_a_URL), or URLs.  Note that the HTML contains additional URLs for the actions that you can perform on this
resource (`contacts/42`), following the conventional hierarchical arrangement of URL paths.

#### Manipulation of Resources Through Representations

This sounds fancy, but it just means that you can update and mutate the resource (that is, the contact) through various
representations (that is HTML pages) rather than having to issues, say, SQL, to modify it.

#### Self Descriptive Messages

This is a key concept of REST.  Note that the browser, which is the client in this client-server setup, *knows nothing
about contacts*.  And yet it is able to render a "Contact UI" simply by rendering the HTML returned by the server.  The
message itself is entirely self-describing, containing all information the client needs about both the data and the possible
operations on that data (in the form of links.)

Now, contrast this with a JSON representation of the same data:

```json
    {
      "name" : "Joe Blow",
      "email" : "joe@example.com"
    }
```

Obviously this is smaller, but a client working with this data must decide two crucial things:

* How to render it
* What actions are available to mutate it

The first part is typically done with a client side template.  The second is typically done by reading the documentation
for the API and encoding the interactions with the server directly in the client.

This is the crux of the difference between REST-ful systems and traditional client-server system: in the REST-ful system
the client (i.e. the browser) doesn't know anything about the resource, it just knows how to render a hypermedia.  In
the client-server system, knowledge about the resource is embedded in the client.

There are pros and cons to both approaches, but the REST-ful approach, in the form of the early web, proved to be
extremely reliable and flexible.  It hides a tremendous amount of knowledge about the resources behind this *uniform
interface* of HTML, so the client doesn't have the opportunity to break in the way the thick-client does.

Now, you may have noticed that, in the last decade, web development has trended away from the REST-ful architecture
and towards a more traditional client-server setup, using JSON APIs.  And you may have noticed a lot more discussion and
issues around versioning APIs, providing more general query functionality and so on.  This is not accidental: we are
losing the flexibility of the REST-ful model as we turn the browser into a VM for hosting thick client applications.

#### Hypermedia As The Engine of Application State (HATEOAS)

This last concept dovetails with the previous one: clients transition application state by interacting with URLs
found in the hypermedia itself (via forms and links).  So, in the HTML example above, the ability to edit, email
and archive the contact all encoded as anchors in the HTML.  If one of those actions was not available, or a new
one became available, it would come down in a new bit of HTML, after a page refresh.

This is in contrast with a thick client approach where, for example, a local store may be sync'd asynchronously with
a back end and, thus, the HTML is not acting as the engine of application state, but rather as a (somewhat janky)
UI description language.
 
Somewhat hilariously, the [Wikipedia article on HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) uses JSON, which is not
a natural hypermedia.  You can layer some REST-ful behavior on top of JSON if you want, but it has rarely been useful
in the real world, and HATEOAS is usually ignored in JSON APIs.  This makes sense because JSON APIs are useful mainly
for the traditional client-server architecture and aren't particularly amenable to the REST-ful style.

#### Uniform Interface Summary

That's the crux of REST and really the crux of this essay.  You can read on for a bit more detail and analysis of Fieldings
paper, but the core take away here is that there is a sharp distinction between a REST-ful hypermedia architecture and
traditional client-server architectures, and that distinction revolves mainly around the concept of a uniform interface,
and the self-describing nature of them in particular.

Again, don't get bogged down in the jargon here, just think about this HTML and what a miracle of flexibility and
ingenuity it is:

```html
<html>
  <body>
  <div>
    <div>
      Name: Joe Blow
    </div>
    <div>
      Email: joe@blow.com
    </div>
    <div>
      <a href="/contacts/42/edit">Edit</a>
      <a href="/contacts/42/email">Email</a>
      <a href="/contacts/42/archive">Archive</a>
    </div>
  </div>
</body>
</html>
```

### [Layered System](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_6)

You don't need to know much about this, except that [CDNs exist](https://en.wikipedia.org/wiki/Content_delivery_network), and you should use them.

### [Code-On-Demand](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7)

Again, you don't need to know much about this, except that [Javascript exists](https://developer.mozilla.org/en-US/docs/Web/javascript), and 
that it's the only part that's optional.

## Section 5.2 - [REST Architectural Elements](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_2)

I won't drill in as deeply on this section as we did others because it gets pretty technical and, frankly, is a bit
boring and repetitive (as one might expect from a dissertation.)  The two big ideas in this section are Resources and
Representations.

## Section 5.2.1 - [Resources and Resource Identifiers](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_2)

From the paper:

> The key abstraction of information in REST is a resource. Any information that can be named can be a resource: a document
> or image, a temporal service (e.g. "today's weather in Los Angeles"), a collection of other resources, a 
> non-virtual object (e.g. a person), and so on. 

Practically, a resource is anything that can be addressed by a URL.  What happens when you access a URL?

Well, you get back a *representation* of that resource, in the form of an HTTP response that may contain HTML, directives
and so forth.

## Section 5.2.1 - [Representations](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_2)

I don't find a lot of practical use in this section.  There is some stuff on control data, media types and so forth,
which are all worth learning about eventually when needed, but aren't a commonly used aspect of web development.

The remaining sections 5.2 similarly do not offer much to the generalist.

## Section 5.3 - [REST Architectural Views](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_3)

In what is becoming a pattern, I again do not feel there is a lot of useful new information for the average web
developer in this section, with one big exception: it lays out the benefits of REST.

From the paper:

> REST's client-server separation of concerns simplifies component implementation, reduces the complexity of connector semantics, 
>  improves the effectiveness of performance tuning, and increases the scalability of pure server components. 
>  Layered system constraints allow intermediaries--proxies, gateways, and firewalls--to be introduced at various points
>  in the communication without changing the interfaces between components, thus allowing them to assist in communication 
>  translation or improve performance via large-scale, shared caching. REST enables intermediate processing by constraining
>  messages to be self-descriptive: interaction is stateless between requests, standard methods and media types are used
> to indicate semantics and exchange information, and responses explicitly indicate cacheability.

This is all very true, and is why the web has been so successful and will continue to be successful.

## [Sections 5.4](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_4) & [5.5](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_5) - Related Work & Summary

These brief sections are not relevant to non-academics interested in REST. 

## Summary

So there you have it, a brief tour of Chapter 5 of Roy Fielding's disseration, which gave us the term REST.  I have
focused in on the areas that I think are most important for web developers to understand and tried to convey how
REST describes the original web model.  The uniform interface concept is, in my opinion, the most important and interesting
aspect of REST, and is useful for web developers to understand as it is primarily responsible for the benefits described
above.

Finally, I hope you can see how inappropriate REST is for describing most JSON APIs in use today.
