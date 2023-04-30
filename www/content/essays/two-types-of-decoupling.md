+++
title = "Two Types Of Decoupling"
date = 2022-10-23
updated = 2023-02-03
[taxonomies]
+++

> The central feature that distinguishes the REST architectural style from other network-based styles is its emphasis on 
> a uniform interface between components. By applying the software engineering principle of generality to the component 
> interface, the overall system architecture is simplified and the visibility of interactions is improved. 
> Implementations are decoupled from the services they provide, which encourages independent evolvability.

_-Roy Fielding, <https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5>_

## Summary

A JSON API decouples a web application's front end and back end code.  Hypermedia APIs, on the other hand,
tightly couple front end and back end code.  Despite this tighter _application level_ coupling, hypermedia APIs can
be changed much more freely than JSON APIs without breaking web applications.  

This surprising result is due to the _system level_ decoupling achieved via REST/HATEOAS.

## Coupling & Decoupling In Software

*De*coupling is the opposite of [coupling](https://en.wikipedia.org/wiki/Coupling_(computer_programming)).  Coupling
is the (generally bad) property of a software system where two pieces of software have a high degree of _interdependence_.  
Decoupling software is the act of reducing this interdependence between unrelated modules so that they can evolve independently
from one another.  

The concept of coupling and decoupling is closely (and inversely) related to 
[cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science)).  Highly cohesive software has related logic 
within a module or conceptual boundary, rather than spread out all over the place.  (A related concept is our own idea
of [Locality of Behavior](/essays/locality-of-behaviour/))

Broadly, the more decoupled your codebase is, the more cohesive it will be as well and the better it will 
handle change over time.

## JSON APIs - Application Level Decoupling

An argument for a JSON/Data API for your web application (typically accessed via a reactive Single Page Application
framework) is that this architecture _decouples_ the front-end and back-end code.  This allows the re-use of the JSON 
API in other contexts, such as a mobile applications, 3rd party client integrations and so on.

The generic JSON/Data API provides _application level_ decoupling: you are effectively developing two different applications,
a front end that consumes a JSON API and a back end that produces one, thus imposing independence on them.

This is certainly a valid approach to decoupling two pieces of software. The JSON API provides a "hard" interface between
the two pieces of software, making it difficult, at least in theory, to introduce coupling between them.

But how does this approach work out in practice?

### "The Worst Part Of My Job..."

In our essay [Splitting Your Data & Application APIs: Going Further](https://htmx.org/essays/splitting-your-apis/) you
will find the following quote:

> The worst part of my job these days is designing APIs for front-end developers. The conversation goes inevitably as:
>
>  Dev – So, this screen has data element x,y,z… could you please create an API with the response format {x: , y:, z: }
>
>  Me – Ok
> 
> Jean-Jacques Dubray - <https://www.infoq.com/articles/no-more-mvc-frameworks>

This quote shows that, although we have driven coupling out with a pitchfork (or, in our case, a JSON API) it has come 
back through application-specific JSON end point requests.  These sorts of requests end up *re*coupling your front end and 
back end code: you are no longer providing a *generic* JSON Data API, but rather a *specific* API for your front end needs.

What is worse, your front end needs will likely change frequently as your application evolves, necessitating the modification
of your JSON API.  But what if *other* clients have come to depend on the original API?  You can start versioning your
JSON API, but that becomes complicated as the application complexity grows and changes pile up.  

Do you really want to version your JSON API every time a screen changes a field in your web application?

#### GraphQL To The Rescue?

One potential solution to this problem is to introduce [GraphQL](https://graphql.org/), which allows you to have a much
more expressive JSON API.  This means that you don't need to change it as often when application needs change.  

While this is a reasonable idea for addressing the problem outlined above, there are problems with it.  The biggest 
issue that we see is security, as we outline this in [The API Churn/Security Trade-off](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html) essay.  

Apparently facebook uses a [whitelist](https://twitter.com/AdamChainz/status/1392162996844212232) to deal with the security
issues introduced by GraphQL, but many developers appear to not understand the security threats involved with it.

#### Splitting Your Application & General Data APIs

Another approach recommended by [Max Chernyak](https://max.engineer/) in his article
[Don’t Build A General Purpose API To Power Your Own Front End](https://max.engineer/server-informed-ui), is two build
*two* JSON APIs: 

* An application specific JSON API that can be modified as needed
* A general purpose JSON API that can be consumed by other clients such as mobile, etc.

This is a pragmatic solution to address what appears to be _inherent_ coupling between your web application's front end
and the back end code supporting it.

## Hypermedia - Network Architecture Decoupling

Now let's consider instead a _hypermedia API_.  A hypermedia API is nothing more than an API that returns hypermedia,
say HTML, rather than a non-hypermedia format, say JSON.  The World Wide Web is built on top of hypermedia APIs being
accessed by hypermedia clients, that is, web browsers.

(It may sound strange, but, yes, every HTML web page you access is delivered as a result of an API request!)

Now, consider a potential response to a simple `GET` for a page, say, `https://example.com/account/12345`:

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

If you look at this response from the perspective of coupling, well, this response _could not be more coupled_ to the
front end.  In fact, the response almost *is* the front end, isn't it?  We not only have the _data_ about that account
in this response, we also have all this other junk for laying out the (admittedly spartan) user interface.

So here we have a tight coupling between the front end and back end.  Bad, right?

### REST & HATEOAS

Well, maybe not so much.  Let's say we remove the ability to transfer money from our bank to other banks, or close
accounts.  (This seems like a hot topic recently!)  

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

You can see that in this response, those two actions have been removed from the HTML.  The browser simply render the
new state of affairs to the user, and all is well.  To a rounding error, there are no clients sitting around using the 
_old_ API.  People log in, see the new state of affairs, and perhaps being some panicked calls to the bank.

Note that we don't have to version our API, because all API navigation of our hypermedia system is done through 
HTML returned by that system.  This means we can dramatically change our API without breaking our clients.

This flexibility is the crux of the REST-ful network architecture and, in particular, [HATEOAS](/essays/hateoas/).

### Decoupling At The Network Architecture Level

So why, if the JSON API is _decoupled_ and the hypermedia API is _tightly coupled_, is it easier to change the hypermedia
API than the JSON API?

It is easier to change the hypermedia API because there _is_ decoupling, but it is happening at a _lower level_.  In
a hypermedia system we accept the coupling between our application's front end and back end code, and we optimize for
that coupling by _decoupling_ in our system's architecture, rather than at the application layer.

A browser is decoupled from a particular web application by a general understanding of hypermedia: it just knows how to
retrieve and render hypermedia, and offer users actions based on hypermedia controls.  _This_ decoupling allows for
a level of flexibility (and coupling!) in your software that a JSON API simply can't provide.

### But That's A Terrible (Data) API!

Some people, when presented with the above argument, note that this hypermedia API may be flexible for our web application,
but it makes for a terrible general purpose API.

This is very true.  Our hypermedia API is tuned for *our* hypermedia driven application.  No one wants to be downloading
parts of it (which might disappear tomorrow, note that we don't even document it!) and parsing HTML and trying to yank 
information out of it.

This is exactly why we recommend creating a general purpose JSON API _alongside_ your hypermedia API in
[Splitting Your Data & Application APIs: Going Further](https://htmx.org/essays/splitting-your-apis/).  You can
take advantage of the flexibility of a hypermedia API (and system) for your own web application, while providing a 
general purpose JSON API for mobile applications, third party applications, etc.

(Although, we should mention, a [hypermedia-based mobile application](https://hyperview.org) might be a good choice too!)

## Conclusion

In this essay we looked at two different types of decoupling:

* Application level decoupling via a JSON Data API
* System-level decoupling via REST/HATEOAS in a hypermedia system

And we showed that, despite tighter application-level coupling, the hypermedia approach appears to be easier to evolve
and adapt to change.