+++
title = "Two Approaches To Decoupling"
description = """\
  Carson Gross explores two different approaches to decoupling in web applications: decoupling at the application \
  level using a JSON Data API and decoupling at the network architecture level using a hypermedia API. He discusses \
  the trade-offs between the two methods, highlighting how a hypermedia API, despite introducing tighter coupling at \
  the application level, offers greater resilience to change at the system level. Carson also touches on the \
  limitations of each approach and discusses strategies like GraphQL and splitting APIs to address specific challenges \
  in web development."""
date = 2022-05-01
updated = 2022-05-01
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

> The central feature that distinguishes the REST architectural style from other network-based styles is its emphasis on 
> a uniform interface between components. By applying the software engineering principle of generality to the component 
> interface, the overall system architecture is simplified and the visibility of interactions is improved. 
> Implementations are decoupled from the services they provide, which encourages independent evolvability.

_-Roy Fielding, <https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5>_

In this essay we will look at two different types of decoupling in the context of web applications:

* Decoupling at the _application level_ via a generic JSON Data API
* Decoupling at the _network architecture level_ via a hypermedia API

We will see that, at the application level, a hypermedia API tightly couples your front-end and back-end.  Despite this
fact, surprisingly, the hypermedia API is in fact more resilient in the face of change.

## Coupling

[Coupling](https://en.wikipedia.org/wiki/Coupling_%28computer_programming%29) is a property of a software system in which
two modules or aspects of the system have a high degree of interdependence. _Decoupling_ software is the act of reducing this 
interdependence between unrelated modules so that they can evolve independently of one another.

The concept of coupling and decoupling is closely (and inversely) related to 
[cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science)).  Highly cohesive software has related logic 
within a module or conceptual boundary, rather than spread out throughout a codebase.  (A related concept is our own idea
of [Locality of Behavior](/essays/locality-of-behaviour/))

Broadly, experienced developers strive for decoupled and cohesive systems.

## JSON Data APIs - Application Level Decoupling

A common approach to building web applications today is to create a JSON Data API and then consume that JSON API using
a JavaScript framework such as React.  This application-level architectural decision decouples the front-end code
from the back-end code, and allows the reuse of the JSON API in other contexts, such as a mobile applications, 3rd 
party client integrations, etc.

This is an _application-level_ decoupling because the decision and implementation of the decoupling is done by the
application developer themselves.  The JSON API provides a "hard" interface between the two pieces of software.

Using my favorite example, consider a simple JSON for a bank that has a `GET` end point at `https://example.com/account/12345`.
This API might return the following content:

```json
HTTP/1.1 200 OK

{
    "account": {
        "account_number": 12345,
        "balance": {
            "currency": "usd",
            "value": -50.00
        },
        "status": "overdrawn"
    }
}
```

This Data API can be consumed by any client: a web application, a mobile client, a third party, etc.  It is, therefore
decoupled from any particular client.

### Decoupling Via A JSON API In Practice

So far, so good.  But how does this decoupling work out in practice?

In our essay [Splitting Your Data & Application APIs: Going Further](https://htmx.org/essays/splitting-your-apis/) you
will find the following quote:

> The worst part of my job these days is designing APIs for front-end developers. The conversation goes inevitably as:
>
>  Dev – So, this screen has data element x,y,z… could you please create an API with the response format {x: , y:, z: }
>
>  Me – Ok
> 
> Jean-Jacques Dubray - <https://www.infoq.com/articles/no-more-mvc-frameworks>

This quote shows that, although we have driven coupling out with a pitchfork (or, in our case, with a JSON API) it has come 
back through requests for web application-specific JSON API end points.  These sorts of requests end up recoupling the
front-end and back-end code: the JSON API is no longer providing a generic JSON Data API, but rather a specific API for 
the front-end needs.

Worse, these front-end needs will often change frequently as your application evolves, necessitating the modification
of your JSON API.  What if other non-web application clients have come to depend on the original API?

This problem leads to the "versioning hell" that many JSON Data API developers face when supporting both web applications as well
as other non-web application clients.

#### A Solution: GraphQL

One potential solution to this problem is to introduce [GraphQL](https://graphql.org/), which allows you to have a much
more expressive JSON API.  This means that you don't need to change it as often when your API client's needs change.  

This is a reasonable approach for addressing the problem outlined above, but there are problems with it.  The biggest 
issue that we see is security, as we outline this in [The API Churn/Security Trade-off](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html) essay.  

Apparently facebook uses a [whitelist](https://twitter.com/AdamChainz/status/1392162996844212232) to deal with the security
issues introduced by GraphQL, but many developers who are using GraphQL appear to not understand the security threats 
involved with it.

#### Another Solution: Splitting Your Application & General Data APIs

Another approach recommended by [Max Chernyak](https://max.engineer/) in his article
[Don’t Build A General Purpose API To Power Your Own Front End](https://max.engineer/server-informed-ui), is to build
*two* JSON APIs: 

* An application specific JSON API that can be modified as needed
* A general purpose JSON API that can be consumed by other clients such as mobile, etc.

This is a pragmatic solution to address what appears to be the _inherent_ coupling between your web application's front-end
and the back-end code supporting it, and it doesn't involve the security tradeoffs involved in a general GraphQL API.

## Hypermedia - Network Architecture Decoupling

Now let us consider how a _hypermedia API_ decouples software.  

Consider a potential response to the same `GET` for `https://example.com/account/12345` that we saw above:

```html
HTTP/1.1 200 OK

<html>
  <body>
    <div>Account number: 12345</div>
    <div>Balance: $100.00 USD</div>
    <div>Links:
        <a href="/accounts/12345/deposits">deposits</a>
        <a href="/accounts/12345/withdrawals">withdrawals</a>
        <a href="/accounts/12345/transfers">transfers</a>
        <a href="/accounts/12345/close-requests">close-requests</a>
    </div>
  <body>
</html>
```

(Yes, this is an API response.  It just happens to be a hypermedia-formatted response, in this case HTML.)

Here we see that, at the application level, this response could not be more tightly coupled to the "front-end".  In fact,
it *is* the front-end, in the sense that the API response specifies not only the data for the resource, but also provides
layout information on how, exactly, to display this data to the user.

The response also contains _hypermedia controls_, in this case, links, that an end user can select from to continue
navigating the hypermedia API that this [Hypermedia-Driven Application](https://htmx.org/essays/hypermedia-driven-applications/) provides.

So, where is the decoupling in this case?

### REST & The Uniform Interface

The decoupling in this case is occurring at a _lower level_.  It is happening at the _network architecture_ level, which
is to say, at the system level.  [Hypermedia systems](https://hypermedia.systems) are designed to decouple the hypermedia
client (in the case of the web, the browser) from the hypermedia server.

This is accomplished primarily via the Uniform Interface constraint of REST and, in particular, by using 
Hypermedia As The Engine of Application State ([HATEOAS](/essays/hateoas)).

This style of decoupling allows tighter coupling at the higher application level (which we have seen may be an 
_inherent_ coupling) while still retaining the benefits of decoupling for the overall system.

### Decoupling Via Hypermedia In Practice

How does this sort of decoupling work in practice?  Well, let's say that we wish to remove the ability to transfer money 
from our bank to other banks as well as the ability to close accounts.

What does our hypermedia response for this `GET` request now look like?

```html
HTTP/1.1 200 OK

<html>
  <body>
    <div>Account number: 12345</div>
    <div>Balance: $100.00 USD</div>
    <div>Links:
        <a href="/accounts/12345/deposits">deposits</a>
        <a href="/accounts/12345/withdrawals">withdrawals</a>
    </div>
  <body>
</html>
```

You can see that in this response, links for those two actions have been removed from the HTML.  The browser simply 
render the new HTML to the user.  To a rounding error, there are no clients sitting around using the _old_ API.  The
API is encoded within and discovered through the hypermedia.

This means that we can dramatically change our API without breaking our clients.

This flexibility is the crux of the REST-ful network architecture and, in particular, of [HATEOAS](/essays/hateoas/).

As you can see, despite much tighter _application-level_ coupling between our front-end and back-end, we actually have
more flexibility due to the _network architecture_ decoupling afforded to us by the Uniform Interface aspect of 
REST-ful [hypermedia systems](https://hypermedia.systems).

### But That's A Terrible (Data) API!

Many people would object that, sure, this hypermedia API may be flexible for our web application, but it makes for a 
terrible general purpose API.

This is quite true.  This hypermedia API is tuned for a specific web application.  It would be cumbersome and error-prone
to try to download this HTML, parse it and try to extract information from it.  This hypermedia API only makes sense as part
of a larger hypermedia system, being consumed by a proper hypermedia client.

This is exactly why we recommend creating a general purpose JSON API alongside your hypermedia API in
[Splitting Your Data & Application APIs: Going Further](https://htmx.org/essays/splitting-your-apis/).  You can
take advantage of the flexibility of hypermedia for your own web application, while providing a 
general purpose JSON API for mobile applications, third party applications, etc.

(Although, we should mention, a [hypermedia-based mobile application](https://hyperview.org) might be a good choice too!)

## Conclusion

In this essay we looked at two different types of decoupling:

* Application level decoupling via a JSON Data API
* Network-architecture decoupling via REST/HATEOAS in a hypermedia system

And we saw that, despite the tighter application-level coupling found in a hypermedia-based application, it is the
hypermedia system that handles changes more gracefully.
