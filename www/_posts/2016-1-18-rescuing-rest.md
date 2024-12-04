---
layout: blog_post
nav: blog
title: Rescuing REST From the API Winter
---

***TLDR***: REST is increasingly unfit for modern JSON API needs, but can be rescued by a return to HTML as a
response format.

## In The Beginning

> In the beginning was the hyperlink, and the hyperlink was with the web, and the hyperlink was the web.  And it was good.

[REST](https://en.wikipedia.org/wiki/Representational_state_transfer) is a description of the software
architectural style of the web, originally put forward by [Roy Fielding](https://en.wikipedia.org/wiki/Roy_Fielding) very
early on in his [justifiably famous dissertation](https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm).  Fielding's description 
was a massive presence in the early thinking about the web, and in thinking about web applications in particular.  Every web 
developer eventually came across the term and, agree or disagree with this or that aspect of it, it provided 
a mental framework, many conventions and a vocabulary to use as we groped toward understanding how this new 
software system should be used.

Looking around today, one can only say that REST has fallen on hard times.  In this post I will examine why that is, and 
then I will present what I hope is a way to rescue this architectural pattern for use in the modern web.

#### The Theory

First, let us review the core constraints imposed by REST, from the Wikipedia article:

* A stateless client context on the server
* Intermediary servers may cache results
* A layered system of servers must be transparent to the client
* Code may be provided on demand (optional, often ambiguous what exactly this means)
* A uniform client-server interface that:
    * provides identification for resources
    * provides all information for manipulation of those resources
    * provides self descriptive messages, minimizing client knowledge of the server state
    * provides a complete description of possible actions (HATEOAS, see below)

And here are the (claimed) advantages of the REST style of architecture.  Again, from the Wikipedia article:

* Performance 
* Scalability 
* Simplicity of interfaces
* Modifiability of components
* Visibility of communication between components by service agents
* Portability of components by moving program code with the data
* Reliability 

Of course, none of these claimed advantages are accepted without controversy, but I think a fair-minded person can 
agree that, given a reasonably competent application, REST can provide help in each of these areas.

#### REST In The Early Days

Early on, REST was simply a description of the web, and despite the [relatively few HTTP actions](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods)
available in the HTML/HTTP implementations of most browsers, developers built very successful and scaleable 
web applications using this style.  [Rails](http://rubyonrails.org/), in particular, emphasized this architectural style
 when building a web application, and it became, if not the gold standard, at least a silver standard for building
 web applications.

Later on, when JSON APIs were becoming more and more prevalent (due in no small part to the [complete insanity](https://www.w3.org/TR/2000/NOTE-SOAP-20000508/) 
of the various W3C XML specifications) REST was adopted as an architectural style as well.  This is understandable:
REST had worked well for structuring HTTP/HTML applications, why wouldn't it work well for JSON APIs?

And, in some ways, it *did* work out pretty well.  Particularly when contrasted with the various XML alternatives out there, 
REST-ful JSON APIs were fairly easy to understand and use.

But, underneath this initial success, lurked deep problems.  Problems that would, in time, come to the fore.

#### HATEOAS &amp; The Haters

Of the many issues that eventually led to the decline and fall of REST, I would like to focus on two: one mostly 
cultural and one entirely technological, both related to the later adoption of REST for JSON APIs.

The first, cultural, issue revolved around the inherently abstract and, in places, ambiguous specification of REST.
A common question, even up to today is "is my API REST?"  Leaving aside whether or not this is a flaw of the
initial REST specification, we can simply observe that many people have a hard time knowing if they are properly
following REST-ful conventions, particularly when it comes to JSON APIs.  

This ambiguity and confusion provided fertile ground for the growth of what can be profitably thought of as online 
holy wars, with passionate zealots arguing with one another over what did and what did not constitute a 
True REST-ful JSON API.  As usual, in as much as they were aware of it, the moderate developers trying to get
work done were confused and alienated by the whole scene, and simply tried to make things work.

The second problem that eventually came to the fore, again almost exclusively in *JSON APIs*, was confusion around HATEOAS.  Today,
if someone actually recognizes that acronym, there is a good chance that they will [recoil in disgust](https://laptrinhx.com/why-i-hate-hateoas-2966199266/).  

The acronym stands for [Hypermedia as the Engine of Application State](https://en.wikipedia.org/wiki/HATEOAS) and, in plain terms, it
means that a REST-ful system should send both data *and the network operations on that data* in responses to clients, so clients
don't need to know anything in advance about the structure of the server.

This actually makes loads of sense and, upon reflection, you will realize that this is *exactly how the web and normal HTML works*: you
get a page of HTML (data) and, embedded in that HTML, you have links and forms that tell you what you can do with
that data.

So far, so good.

But, as we know, REST was being pushed for and adopted by JSON APIs.  JSON doesn't have a native notion of links or
forms, so it wasn't obvious what to do.  Some people started including representations of links 
[encoded in the JSON itself](https://spring.io/understanding/HATEOAS), other people thought that 
[using HTTP headers](https://www.w3.org/wiki/LinkHeader) was the right approach.  Lots of arguments were had and
no one obvious and widely used solution emerged.  Again, holy wars were waged, friendships were won and lost, and so on,
ad internetum.

Most normal developers dropped (or never really understood) HATEOAS in the JSON context anyway, so it didn't end up mattering 
too much.  Except that, unfortunately, *it was the most important and innovative aspect of REST!*  

As the wikipedia page says:

> HATEOAS is a constraint of the REST application architecture that distinguishes it from most other network application architectures.

Without HATEOAS, REST is just a collection of (very) good ideas on client-server layout, but not a revolutionary 
architecture shift.

### The API Winter

Artificial intelligence was a wildly popular area of research in early computer science.  After an auspicious
beginning, however, it fell into what is called **[The AI Winter](https://en.wikipedia.org/wiki/AI_winter)**, and it took
many decades to re-emerge as a prominent and useful field of research.  
 
REST, similarly, has entered its own winter: if REST's early association with "basic" web applications and their attendant 
usability issues weren't enough to turn developers off, it was the application of REST to (typically CRUD-style) JSON APIs that sealed REST's fate.  

We are now living through REST's **"API Winter"**, as most of the thought leaders in web development have grown indifferent 
towards or have abandoned the concept, and many younger developers have never heard of it except perhaps in passing.

It's time to admit it: [the REST-haters are right](https://mmikowski.github.io/the_lie/).  REST does not make for
a great raw data-level API architecture, and efforts like [GraphQL](https://facebook.github.io/react/blog/2015/05/01/graphql-introduction.html)
and RPC-like architectures are likely to end up producing something more usable for complicated data needs.  

REST-ful JSON APIs can still be useful, of course, for simple cases where CRUD-style operations are sufficient.  But
there is a reason that database vendors decided on something as powerful as [SQL](https://en.wikipedia.org/wiki/SQL) for describing data operations.  As JSON 
API needs approach the complexity of relational data-store needs, we should expect that infrastructure
approximating the complexity of SQL will arise alongside those needs.

The fact is, highly-stateful SPAs and REST will probably never mix well.

### A New Hope

> Help us, HTML.  You're our only hope...

So, is there any hope for those of us who appreciate the original REST architecture?  Well, I wouldn't be writing this
if I didn't think that there was, would I?

And I believe that that hope can be found in our old friend: **[HTML](https://en.wikipedia.org/wiki/HTML)**.

In the last few years, a small number of libraries have come along that focus on the server providing HTML responses to AJAX 
requests.  

As a Rails developer, [pjax](https://github.com/defunkt/jquery-pjax) and [turbolinks](https://github.com/rails/turbolinks)
are the ones that loom largest.  These libraries built on an older tradition, mainly from the jQuery world, of simply issuing
an AJAX request, getting back some HTML and slamming it into the DOM.

#### Intercooler

It is out of this tradition that [intercooler.js](http://intercoolerjs.org/) was born.  Intercooler began life as a single
javascript function that, over time, grew into a full (if small) library to support declarative, REST-style HTML applications.

As the [introduction](http://intercoolerjs.org/docs.html) points out, intercooler is a generalization of the link/form
concept in HTML, for AJAX requests: it gives you control over the HTTP action, the user event that triggers the action and where the
response is placed in the DOM, instead of forcing you into the click-on-link/submit-form pattern of plain HTML, all with
declarative attributes.

The beauty of this approach, if you wish to use a REST-ful architecture, is manifold: 

First, it re-enables HATEOAS in a dead simple and obvious manner, by allowing you to simply return HTML (your data) annotated 
with the network actions appropriate for that data, using familiar HTML attributes.

Second, intercooler addresses the primary shortcoming of standard HTML as a REST-ful hypermedia: a limited set of supported 
HTTP actions tied to only a few specific client events.  With intercooler you can implement a much richer REST-ful HTML API 
*and user experience* in your web application.

Third, all the tried-and true techniques and advantages of stateless web applications can continue to be applied in your 
web application: it's just HTTP requests sending back HTML, after all.

And so on: intercooler supports [REST-ful dependencies](http://intercoolerjs.org/docs.html#dependencies), [transparent history](http://intercoolerjs.org/docs.html#history)
and many other features that allow you to stay within the REST-ful architecture, while providing a modern web 
application experience for users.

#### Conclusion

In some ways, REST's failure as an architecture for JSON APIs should be a relief: it establishes that HATEOAS is,
indeed, a crucial aspect of the architecture.  The task before us now, those of us who appreciate the beauty of this 
original vision of the web, is to rescue and revive this architecture while, at the same time, delivering the modern user 
experience people have come to expect in web applications.

[There is burgeoning recognition that web development is badly broken](https://medium.com/@wob/the-sad-state-of-web-development-1603a861d29f#.p54rj9jzq),
so the opportunity is there.  But we must provide both the tools and the theory to convince web developers to 
again invest in and design for the REST-ful architectural style.

I hope that intercooler is a step in that direction.

### Links

* [The Sad State of Web Development](https://medium.com/@wob/the-sad-state-of-web-development-1603a861d29f#.p54rj9jzq)
* [Why I hate HATEOAS](https://www.jeffknupp.com/blog/2014/06/03/why-i-hate-hateoas/)
* [Turbolinks](https://github.com/rails/turbolinks)
* [PJAX](https://github.com/defunkt/jquery-pjax)
* [Wikipedia REST Article](https://en.wikipedia.org/wiki/Representational_state_transfer)
* [RESTful APIs, the big lie](https://mmikowski.github.io/the_lie/)
