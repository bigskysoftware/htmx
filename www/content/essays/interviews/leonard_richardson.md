+++
title = "An interview with Leonard Richardson"
description = """\
  In this interview, Leonard Richardson, creator of the Richardson Maturity Model for RESTful web services discusses \
  the history of REST, interoperability in APIs and his impression of newer approaches such as GraphQL."""
date = 2025-02-19
updated = 2025-02-19
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

Leonard Richardson is a long time programmer and author and was the creator of what came to be termed the Richardson
Maturity
Model ([https://en.wikipedia.org/wiki/Richardson\_Maturity\_Model](https://en.wikipedia.org/wiki/Richardson_Maturity_Model)),
a system for classifying Web APIs in terms of their adherence to REST. Here, Web APIs mean *data APIs*, that is data
intended to be consumed by automated systems or code, rather than directly by a web client.

The RMM consists of four levels:

* Level 0 \- The Swamp of POX (Plain old XML)
* Level 1 \- The appropriate use of resource-based URLs
* Level 2 \- The appropriate use of HTTP Methods
* Level 3 \- Hypermedia Controls

A Web API became more mature as it adopted these technologies and conventions.

Leonard agreed to talk to me about the RMM and his experiences building Web software.

**Question**: Can you give us some background about yourself and how you came into web programming? Did/do you consider
yourself a hypermedia enthusiast?

> When I was in high school in the mid-1990s, I got very basic Internet access through BBSes. There were all these
amazing, arcane protocols you had to learn to get around: FTP, Gopher, Archie, NNTP, et cetera. And then just as I went
to college, the World Wide Web suddenly wiped out all of those domain-specific protocols. Within a couple of years we
were using the Web technologies–URI, HTTP and HTML–for everything.
>
> My formative years as a developer happened against the background of the incredible power of those three core
technologies. Everything was being built on top of the Web, and it basically worked and was a lot simpler than the old
way.
>
> So yes, I am a hypermedia enthusiast, but it took me a really long time to understand the distinct advantages that come
from the "hypermedia" part of the Web. And that came with an understanding of when those advantages are irrelevant or
undesirable from a business standpoint.

**Question**: Can you give us a brief history of early Web APIs? What was the origin story of the RMM?

> What we now call "web APIs" started as a reaction against SOAP, a technology from a time when corporate firewalls
allowed HTTP connections (necessary to get work done) but blocked most other traffic (games?). SOAP let you serialize a
procedure call into XML and invoke it over an HTTP connection, punching through the firewall. It was an extraordinarily
heavyweight solution, using the exact same tools–XML and HTTP–you'd need to make a good lightweight solution.
>
> Now that I'm an old fogey, I can look back on SOAP and see the previous generation of old fogeys trying to make the
1990s client-server paradigm work over the Internet. SOAP had a lot of mindshare for a while, but there were very few
publicly deployed SOAP services. When you deploy a service on the public Internet, people expect to connect to it from a
wide variety of programming languages and programming environments. SOAP wasn't cut out for that because it was so heavy
and demanded so much tooling to compensate for its heaviness.
>
> Instead, developers picked and chose their designs from the core web technologies. Thanks to the dot-com boom, those
technologies were understood by practicing developers and well supported by every major programming language.
>
> The RMM, as it's now called, was originally a heuristic I presented
in [a talk in 2008](https://www.crummy.com/writing/speaking/2008-QCon/act3.html). [The first part of the talk](https://www.crummy.com/writing/speaking/2008-QCon/act1.html)
goes over the early history I mentioned earlier,
and [the second part](https://www.crummy.com/writing/speaking/2008-QCon/act2.html) talks about my first experience
trying to sell hypermedia-based API design to an employer.
>
> I’d analyzed about a hundred web API designs for my book on REST and seen very strong groupings around the core web
technologies. You'd see a lot of APIs that "got" URLs but didn't "get" HTTP. But you'd never see one where it happened
the other way, an API that took advantage of the features of HTTP but didn't know what to do with URLs. If I had one
insight here, it's that the URL is the most fundamental web technology. HTTP is a set of rules for efficiently dealing
with URLs, and HTML (a.k.a. hypermedia) is a set of instructions for driving an HTTP client.

**Question**: In “How Did REST come to mean the opposite of REST?” I assert that the term REST has nearly inverted in
its meaning. In particular, I claim that most APIs stopped at “Level 2” of the RMM. Do you agree with these claims?

> Everyone understands URIs these days, and understanding HTTP is essential for performance reasons if nothing else. That
gets you to level 2, and yes, there we have stayed. That's what I was getting at
in [this interview from 2007](https://www.infoq.com/articles/richardson-ruby-restful-ws/), a year before I gave my
famous talk:
>
> The big question in my mind is whether architectures consciously designed with REST in mind will “win” over
architectures that are simple but only intermittently RESTful.
>
> You don't get a certificate signed by Roy Fielding for achieving level 3\. The reward for learning and applying the
lesson of hypermedia is *interoperability*. Your users get the ability to use your system in ways you didn't anticipate,
and they get to combine your system with their other systems.
>
> Interoperability is essential in a situation like the Web, where there are millions of server and client deployments,
and a dozen major server implementations. (There are now only two major client implementations, but that's its own sad
story.)
>
> For a long time I thought people just didn't get this and if I hammered on the technical advantages of hypermedia they'd
come around. But we've been stuck at level 2 for more than half the lifetime of the Web. It's become clear to me that
most situations aren't like the Web, and the advantages of hypermedia aren't relevant to most business models.

**Question**: Level 3 style hypermedia controls never really took off in Web APIs. Why do you think that is?

> I don't do this for everything, but I am going to blame this one on capitalism.
>
> Almost all actually deployed web APIs are under the complete control of one company. They have one server implementation
written by that company and one server deployment managed by that company. If the API has any official client
implementations, those are also controlled by the company that owns the API. The fact that we say "the \[company\] API"
is the opposite of interoperability.
>
> Users like interoperability, but vendors prefer lock-in. We see that in their behavior. Netflix was happy to provide a
hypermedia API for their program data... until their streaming business became big enough. Once they were the dominant
player and could dictate the terms of integration, Netflix shut down their API. Twitter used to cut off your API access
if your client got too popular; then they banned third-party clients altogether.
>
> There are lots of APIs that consider interoperability a strong point, and many of them are oriented around hypermedia,
but almost all of them live outside the space of commercial competition. In 2008 when I gave the "maturity heuristic"
talk I was working on software development tools at Canonical, which is a for-profit company but heavily involved in
open source development. We wanted lots of tools and programming environments to be able to talk to our API, but the API
was a relatively small part of our process and we didn't have enough developers to manage a bunch of official clients. A
hypermedia-based approach gave us a certain flexibility to change our API without breaking all the clients.
>
> After that I spent eight years working on ebook delivery in the US public library space, which is extremely fragmented
in terms of IT management. In a nonprofit environment with lots of independent server deployments, hypermedia (in the
form of the [OPDS](https://opds.io/) protocol) was a really easy
pitch. [I gave a talk about that.](https://www.crummy.com/writing/speaking/2015-RESTFest/)
>
> To get the benefits of hypermedia you have to collaborate with other people in the same field, consider the entire
problem space, and come up with a design that works for everyone. Who's going to go through all that work when the
reward is “no vendor lock-in”? People who are not competing with their peers: scientists, librarians, and open source
developers.
>
> It might or might not surprise you to learn that the library world is dominated by an antique protocol
called [SIP](https://developers.exlibrisgroup.com/wp-content/uploads/2020/01/3M-Standard-Interchange-Protocol-Version-2.00.pdf). (
Not the VoIP protocol, a different SIP.) SIP is what the self-checkout machine uses to record the fact that you borrowed
the book. SIP first showed up in 1993, its design is distinctively non-RESTful, and in many ways it’s simply *bad*.
Every library vendor has come up with their own level 2 "REST" protocol to do what SIP does. But none have succeeded in
displacing SIP, because that awful old 1993 design provides something a vendor can't offer: interoperability between
components from different
vendors. [I gave a talk about that, too.](https://www.crummy.com/writing/speaking/2016-RESTFest/)

**Question**: Do you think the move from XML to JSON as a format had any influence on how Web APIs evolved?

> Absolutely. Moving from XML to JSON replaced a document-centric design (more suitable for communications with a human at
one end) with a data-centric design (more suitable for machine-to-machine communication). The cost was forgetting about
hypermedia altogether.
>
> One thing about Martin's diagram that I think obscures more than it reveals is: he calls level 0 the "Swamp of POX".
This makes it seem like the problem is (Plain Old) XML. Martin is actually talking about SOAP there. The big problem
with SOAP services isn't XML (although they do have way too much XML), it's that they don't use URLs. A SOAP client puts
all of the request information into an XML package and tunnels it through a single service endpoint. This makes SOAP
opaque to the tools designed to manage and monitor and inspect HTTP traffic. This is by design, because the point of
SOAP is to let you make RPC calls when your IT department has everything but port 80 locked down.
>
> Anyway, XML is great\! It's too verbose to make an efficient data representation format, but XML has namespaces, and
through namespaces it has hypermedia controls (via XLink, XForms, XHTML, Atom, etc.). JSON has no hypermedia controls,
and because it also has no namespaces, you can't add them after the fact.
>
> People started adopting JSON because they were tired of XML processing and excited about AJAX (in-browser HTTP clients
driven by Javascript, for those who weren't there). But that initial decision started constraining decisions down the
road.
>
> By 2011, all new web APIs were using a representation format with no hypermedia controls. You couldn't do a
hypermedia-based design if you wanted to. Our technical language had lost the words. First you'd have to define a
JSON-based media type that had hypermedia (like Siren), or namespaces (like JSON-LD).

**Question**: What are your thoughts on GraphQL and other non-RESTful API technologies?

> With regard to non-RESTful API technologies in general, I would suggest that folks take a break
from [chapter 5](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) of Roy Fielding's dissertation,
and look at chapters [2](https://ics.uci.edu/~fielding/pubs/dissertation/net_app_arch.htm%20)
and [4](https://ics.uci.edu/~fielding/pubs/dissertation/web_arch_domain.htm).
>
> Chapter 5 is where Fielding talks about the design of the Web, but Chapter 2 breaks down all of the possible good things
you might want from a networked application architecture, only some of which apply to the Web. Chapter 4 explains the
tradeoffs that were made when designing the Web, giving us some good things at the expense of others.
>
> Chapter 4 lists five main advantages of the Web: low entry-barrier, extensibility, distributed hypermedia, anarchic
scalability, and independent deployment. REST is a really effective way of getting those advantages, but the advantages
themselves are what you really want. If you can get them without the Web technologies, then all you've lost is the
accumulated expertise that comes with those technologies (although that ain't nothing at this point). And if you *don't*
want some of these advantages (probably distributed hypermedia) you can go back to chapter 2, start the process over,
and end up with a differently optimized architecture.
>
> I don't have any direct experience with GraphQL, though I'm about to get some at my current job, so take this with a
grain of salt:
>
> On a technical level, GraphQL is solving a problem that's very common in API design: performing a database query across
a network connection without sending a bunch of unneeded data over the wire. Looking at the docs I see it also has "
Mutations" which seem very SOAP-ish. I guess I'd say GraphQL looks like a modern version of SOAP, optimized for the
common case of querying a database.
>
> Since GraphQL is independently deployable, supports multiple server implementations and defines no domain-specific
semantics, an interoperable domain-specific API could be built on top of it. Rather than exporting your data model to
GraphQL and clashing with a dozen similar data models from the same industry, you could get together with your peers and
agree upon a common set of semantics and mutations for your problem space. Then you'd have interoperability. It's not
much different from what we did with OPDS in the library world, defining what concepts like "bookshelf" and "borrow"
mean.
>
> Would it be RESTful? Nope\! But again I'll come back to SIP, the integration protocol that public libraries use to keep
track of loans. SIP is a level zero protocol\! It doesn't use any of the Web technologies at all\! But it provides
architectural properties that libraries value and vendor-centric solutions can't offer–mainly interoperability–so it
sticks around despite the presence of "RESTful" solutions.
