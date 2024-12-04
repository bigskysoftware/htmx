---
layout: blog_post
nav: blog
title: On Hypertext and Hypotext
---

***TLDR***: Many readers reacted to our earlier post, [Rescuing REST From the API
Winter](http://intercoolerjs.org/2016/01/18/rescuing-rest.html), by insisting that
JSON serves their API needs just fine and that HTML is unrealistic as an API
technology. The thing is, we completely agree.

*This is a guest post by Justin T. Sampson.*

## Defining Our Terms

I really don't want to get sidetracked by debating whether HATEOAS is necessary
for an API to be "truly" RESTful, although Roy Fielding has been [quite clear on
the matter](http://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven).
Go ahead and use "REST" to describe your API if it suits you and if your API consumers
understand what you mean by it. But there's a very interesting *distinction* that needs
to be teased out of the terminology. To Fielding, the opposite of REST is "RPC", [which he
defines thusly](https://www.ics.uci.edu/~fielding/pubs/dissertation/evaluation.htm#sec_6_5_2):

> "What distinguishes RPC from other forms of network-based application communication
> is the notion of invoking a procedure on the remote machine, **wherein the protocol
> identifies the procedure and passes it a fixed set of parameters,** and then waits
> for the answer to be supplied within a return message using the same interface." (emphasis mine)

In other words, RPC (by Fielding's definition) is any time a client constructs a request,
and interprets the response, based on the programmer's implementation-time knowledge of
the server's interface. That obviously includes cases where the client constructs a SOAP
or JSON request body and POSTs it to a fixed URI. However, it *also* includes cases where
the client constructs a hierarchical URI and then GETs or PUTs or PATCHes it. The client
is depending on implementation-time knowledge of the server's URI structure and of the
methods supported by each URI, so that's a perfect example of the RPC architectural style,
not REST (by Fielding's definition).

To get away from the acronymic purity battlefield, perhaps I must choose my own terms
carefully for the rest of this essay. "REST" may be too loaded at this point, but
*hypertext* seems relatively unsullied by fashion so I will stick with it for now. And
what of the contrasting idea, which Fielding calls "RPC"? Well, everybody loves a good
[semiotics](https://en.wikipedia.org/wiki/Hypotext) pun now and again, so for the
purpose of this discussion I will use the term *hypotext*.

"Hypo-" means under or before, so hypotext naturally refers to interactions in which the
conduct of the interaction requires some *underlying* knowledge *before* initial contact
with the server. And "hyper-" means over or after, so hypertext naturally refers to
interactions in which the conduct of the interaction relies on metadata *overlaid* on
content by the server *after* initial contact. 

Surely such a silly word as "hypotext" is not going to be subject to [semantic
diffusion](http://martinfowler.com/bliki/SemanticDiffusion.html), right? *Right?*

## Hypertext Favors Smart Clients

One of the biggest challenges of hypertext is that it seems to put heavy demands on the
intelligence of the client. Hypertext allows the server to send semantically-rich
content, describing the available actions in a variety of ways (links, forms, etc.).
The server can produce ad hoc responses -- "Sorry, I can't do what you just asked,
but here are three related actions you can try..." -- and the client has to *decide*
what action to take in a goal-driven manner.

As long as there's a human being on the client side driving all further interactions,
you get such intelligence for free. That's exactly what's going on with HTML: The browser
merely renders the hypertext content so that the human can consume it and decide what to
do next.

But if the client is another program that just wants to follow a predetermined sequence
of actions, with nothing more than simple programmatic logic connecting one action to the
next, hypertext breaks down. Such a client can be written to deal with basic kinds of
error handling, but it can't adapt to meaningful changes in the available actions the
way a human can.

The upshots of this line of reasoning are that **hypertext** *tends* to be more useful
when a human will be directly involved and that **hypotext** *tends* to be more useful
in other scenarios. Building the primary interface for expert users of your application?
You probably want to consider leveraging hypertext. Integrating your app with a legacy
mainframe back-end system? You probably want to stick with hypotext. Dreaming up a slick
mobile front-end on top of an existing enterprise app? Well, that falls somewhere in the
middle.

## It's About Coupling

The beauty of hypertext is that it achieves a *very unique* decoupling of client from
server. All you need to determine ahead of time is the definition of media types
supported by both sides of the interaction. All knowledge of available resources and
actions comes later. The server *tells* the client what's available; the client doesn't
*assume* anything. The client is thereby *decoupled* from any *changes* in the resources
and actions supported by the server.

HTML just happens to be the most widely-deployed and efficiently-implemented hypertext
media type on the 'Net these days. Every single human being with a networked device
already has an HTML-aware client installed. It's called a Web browser! So if you've
bought into the power of hypertext and desire the radical decoupling that it achieves,
[serving up good ol' HTML](http://intercoolerjs.org/) is worth serious consideration.
You don't even have to implement a client, because it's out there already.

Of course, you're more than welcome to move away from HTML if it doesn't serve your
needs. Just beware the creeping coupling as you do so.

For example, serving up a linked data format such as
[JSON-LD](http://manu.sporny.org/2014/json-ld-origins-2/) keeps the possibility of
hypertext alive, and ensures that clients are, at the very least, decoupled from the
specific syntax and layout of your JSON responses. However, if the client *depends*
on a particular resource existing on the server, or *assumes* that a resource will
have certain properties, then the interaction is straying into hypotext, the client
has become coupled to the server's data model, and [the server is therefore less
evolvable](http://www.infoq.com/articles/roy-fielding-on-versioning) than it would
be by sticking to hypertext interactions.

## Decoupling Despite Hypotext

The kind of decoupling offered by hypertext means that you're free to expose more of
your data model without worrying that you're committing to keep that data model stable.
If you decide to move your company's mailing address from the "About" page to a new
"Contact Us" page, returning visitors might be briefly confused but their Web browsers
won't break. I've already stipulated that more programmatic clients *tend* to
necessitate *hypotext* interactions, though, so we have to grapple with the very
practical challenge of mitigating the resulting coupling in order to retain some
inkling of evolvability.

Of course, mitigating coupling is what design patterns are all about. The "[backend
for frontend](http://samnewman.io/patterns/architectural/bff/)" (BFF) pattern that has
been getting some recent attention happens to deal with this kind of coupling. The client
is tightly coupled to its BFF, but the BFF itself acts as a buffer between the client and
the server's core data model and services. The core data model can evolve without breaking
clients as long as each BFF is kept working, and a BFF can evolve to better serve its own
clients without interfering with other clients. Each BFF is narrowly focused, establishing
a separation of concerns that is unrivaled by any attempt to provide a single public API
for all clients to use.

BFF is not a crazy new idea, either. Eric Evans and the [domain-driven
design](https://domainlanguage.com/ddd/patterns/) (DDD) community have talked
about "open-host services" for a decade, which are much the same thing. Another relevant
idea from DDD is the "anticorruption layer," which serves the same purpose from the other
direction, implemented closer to the client side in order to shield itself from changes to
the server's interfaces. You can even [combine them
together](https://domainlanguage.com/ddd/legacy/) or [use a BFF in a strangler
pattern](https://www.thoughtworks.com/insights/blog/bff-soundcloud) to retrofit
evolvability into established legacy systems.

While we're at it, let's not forget "[hexagonal
architecture](http://alistair.cockburn.us/Hexagonal+architecture)," a.k.a. the "ports and
adapters" pattern, which Alistair Cockburn has been talking about for *two* decades: "A
port identifies a purposeful conversation. There will typically be multiple adapters for
any one port, for various technologies that may plug into that port." Thinking in
hexagonal terms reassures us that we needn't be afraid of adding adapters (that is, BFFs!)
as needed -- doing so actually *helps* us to isolate the core domain logic of our services
from external coupling.

## It Ain't All or Nothing

All of these patterns may be overwhelming, but on the bright side, *gee whiz do we have a
lot of options for mitigating coupling!* There's simply no need to build One True API for
all clients. Don't forget about hypertext, but don't shy away from hypotext either, when
it's the best tool for the job. We can build our systems with multiple different
interfaces, and different *kinds* of interfaces, as long as coupling is under control. And
building multiple interfaces *helps* to keep coupling under control. We can build HTML
interfaces for desktop users, JSON interfaces for mobile apps, and (*gasp*) SOAP interfaces
for enterprise integrations *as needed* and still sleep well at night, as long as we design
each of them to avoid entangling the external system directly with our core data model in
a way that would cripple its evolvability.

Go ahead. Decouple your code. Sleep well.
