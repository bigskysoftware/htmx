---
layout: layout.njk
tags: posts
title: HATEOAS
---


<div style="margin-left: 2em;margin-right: 2em; background-color: whitesmoke; border: 1px solid gray; border-radius: 5px; margin-bottom: 40px">

**META** - HATEOAS: An Alternative Explanation

This page is a reworking on the [Wikipedia Entry on HATEOAS](https://en.wikipedia.org/wiki/HATEOAS), which uses JSON.
Here we use HTML to explain the concept, and contrast it with JSON APIs.  It is a more opinionated explaination of the
concept than would be appropriate for Wikipedia, but it is more correct in our opinon.

</div>

# HATEOAS

Hypermedia as the Engine of Application State (HATEOAS) is a constraint of the [REST application architecture](https://en.wikipedia.org/wiki/Representational_state_transfer) that distinguishes it from other network application architectures.

With HATEOAS, a client interacts with a network application whose application servers provide information dynamically through [*hypermedia*](https://en.wikipedia.org/wiki/Hypermedia). A REST client needs little to no prior knowledge about how to interact with an application or server beyond a generic understanding of hypermedia.

By contrast, today JSON-based web clients typically interact through a fixed interface shared through documentation via a tool
such as [swagger](https://swagger.io/). 

The restrictions imposed by HATEOAS decouples client and server. This enables server functionality to evolve independently.

## Example

A user-agent that implements HTTP makes a HTTP request of a REST end point through a simple URL. All subsequent requests the user-agent may make are discovered inside the responses to each request. The media types used for these representations, and the link relations they may contain, are standardized. The client transitions through application states by selecting from the links within a representation or by manipulating the representation in other ways afforded by its media type. In this way, RESTful interaction is driven by hypermedia, rather than out-of-band information.

For example, this GET request fetches an account resource, requesting details in an HTML representation:

```http request
  GET /accounts/12345 HTTP/1.1
  Host: bank.example.com
```
The response is:

```http request
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

The response contains these possible follow-up links: navigate to a UI to enter a deposit, withdrawal, transfer, or to close request (to close the account).

As an example, later, after the account has been overdrawn, there is a different set of available links, because the account is overdrawn.

```http request
HTTP/1.1 200 OK

<html>
  <body>
    <div>Account number: 12345</div>
    <div>Balance: $100.00 USD</div>
    <div>Links:
        <a href="/accounts/12345/deposits">deposits</a>
    </div>
  <body>
</html>
```

Now only one link is available: to deposit more money. In its current state, the other links are not available. Hence the term Engine of Application State. What actions are possible varies as the state of the resource varies.

Contrast the HTML response above with a typical JSON API that, instead, returns representation of the account with a status field:

```http request
HTTP/1.1 200 OK

{
    "account": {
        "account_number": 12345,
        "balance": {
            "currency": "usd",
            "value": 100.00
        },
        "status": "overdrawn"
    }
}
```

Here we can see that the client must know specifically what the value of the `status` field means and how it might affect
the rendering of a user interface.  The client must also know what URLs must be used for manipulation of this resource
since they are not encoded in the response.  This would typically be achieved by consulting documentation for the JSON
API.

## Origins

The HATEOAS constraint is an essential part of the ["uniform interface"](https://en.wikipedia.org/wiki/Representational_state_transfer#Uniform_interface) feature of REST, as defined in Roy Fielding's [doctoral dissertation](). Fielding's dissertation was a discussion of the
early web architecture, consisting mainly of HTML and HTTP at the time.

Fielding has further described the concept, and the crucial requirement of hypermedia, [on his blog](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven).

## HATEOAS and JSON

*NOTE: The Neutral Tone Of This Section is Disputed*

In the early 2000s the concept of REST was appropriated from its initial conceptual environment as a description of the early web into other areas of web development: first XML API development (often using [SOAP](https://en.wikipedia.org/wiki/SOAP)) and then JSON API development.  This, despite the fact that neither XML nor JSON was a natural hypermedia in the same manner as HTML.

In order to characterize different levels of adherence to REST in these new areas, [The Richardson Maturity Model](https://en.wikipedia.org/wiki/Richardson_Maturity_Model) was proposed, consisting of various levels of "maturity" of APIs, with the highest level,
Level 3, consisting of "Hypermedia Controls".

JSON is not a natural hypermedia and, therefore, hypermedia concepts can only be imposed on top of it.  A JSON engineer
attempting to meet Level 3 of the Richardson Maturity Model might return the following JSON corresponding to the
bank account example above:

```http request
HTTP/1.1 200 OK

{
    "account": {
        "account_number": 12345,
        "balance": {
            "currency": "usd",
            "value": 100.00
        },
        "links": {
            "deposits": "/accounts/12345/deposits",
            "withdrawals": "/accounts/12345/withdrawals",
            "transfers": "/accounts/12345/transfers",
            "close-requests": "/accounts/12345/close-requests"
        }
    }
}
```

Here, the "hypermedia controls" are encoded in a `links` property on the account object.

Unfortunately, the client of this API still needs to know quite a bit of additional information: 

* What http methods can be used against these URLs?
* Can it issue a `GET` to these URLs in order to get a representation of the mutation in question?
* If it can `POST` to a given URL, what values are expected?

This representation does not have the same self-contained "uniform interface" as the HTML representation does, leading
Fielding to say:

> I am getting frustrated by the number of people calling any HTTP-based interface a REST API. Today’s example is the SocialSite REST API. That is RPC. It screams RPC. There is so much coupling on display that it should be given an X rating.

While attempts have been made to impose more elaborate hypermedia controls on JSON APIs, broadly the industry has rejected
this approach in favor of RPC-style JSON apis.  

This is strong evidence for the assertion that a natural hypermedia such as HTML is a practical
necessity for RESTful systems.

