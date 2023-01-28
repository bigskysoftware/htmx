---
layout: layout.njk
title: Hypermedia Clients - The Missing Link
---

# Hypermedia Clients: The Missing Link

Often, when we are being pedantic and curmudgeonly in [discussions about](https://news.ycombinator.com/item?id=32141027) 
[REST](https://htmx.org/essays/how-did-rest-come-to-mean-the-opposite-of-rest/) & [HATEOAS](/essays/hateoas), we will
say something along the lines of:

> JSON isn't a hypermedia because it doesn't have hypermedia controls.  Look at this JSON:
 ```json
{
  "account": {
    "account_number": 12345,
    "balance": {
      "currency": "usd",
      "value": 50.00
    },
    "status": "open"
  }
}
```
> 
> See?  No hypermedia controls.  So this JSON isn't a hypermedia, therefore the API returning it isn't REST-ful.

A smart and experienced developer will then reply with this:

> OK, mr. REST-y pants, how about this JSON?
```json
{
  "account": {
    "account_number": 12345,
    "balance": {
      "currency": "usd",
      "value": 50.00
    },
    "status": "open",
    "links": {
      "deposits": "/accounts/12345/deposits",
      "withdrawals": "/accounts/12345/withdrawals",
      "transfers": "/accounts/12345/transfers",
      "close-requests": "/accounts/12345/close-requests"
    }
  }
}
```
> There, now there are hypermedia controls (normal humans call them links, btw) so this JSON is a hypermedia.

...

One has to concede that, at least at a high-level, our online opponent has something of a talking point here: these
do appear to be hypermedia controls, and they are, in fact, in a JSON response.  So, couldn't you call this JSON response
REST-ful?  

Well, being obstinate by nature, we still aren't willing to concede the immediate point without a 
good [ackchyually](https://i.imgur.com/DpQ9YJl.png) or two:

* These links hold no information about what HTTP method to use to access them
* These links aren't a *native* part of JSON the way that, for example, anchor and form tags are with HTML
* There is a lot of missing information about the hypermedia interactions at each end point (e.g. what data needs to
  go up with the request.)

All good and fine points for the pointless and pedantic technical flame wars that make the internet so special.

However, there is a deeper [ackchyually](https://i.imgur.com/DpQ9YJl.png) here, and one that doesn't involve the *JSON API* 
itself, but rather the *client* that is interpreting the JSON.

## The Missing Link: Hypermedia Clients

The problem with the proposed solution above to non-REST-ful JSON APIs is that, for the JSON to participate properly in
a [hypermedia system](https://hypermedia.systems), the *client* that handles the JSON should *also* satisfy the constraints
that the REST-ful architecture places on the entire system.

In particular, the client needs to satisfy the [uniform interface](https://en.wikipedia.org/wiki/Representational_state_transfer#Uniform_interface)
in which the client code knows nothing about the "shape" or details of the response beyond the ability to display
the given hypermedia to a user.  In particular, it isn't allowed to have "out of band" knowledge of the domain that
a particular hypermedia representation represents.

Let's look at the proposed JSON-as-hypermedia again: 

```json
{
  "account": {
    "account_number": 12345,
    "balance": {
      "currency": "usd",
      "value": 50.00
    },
    "status": "open",
    "links": {
      "deposits": "/accounts/12345/deposits",
      "withdrawals": "/accounts/12345/withdrawals",
      "transfers": "/accounts/12345/transfers",
      "close-requests": "/accounts/12345/close-requests"
    }
  }
}
```
Now a client of this API *could* simply and generically transform this into, say, some HTML, via a client-side templating
language.  However, note that there isn't a lot of presentation information in this JSON response.  A client that wanted
to satisfy the uniform interface constraint of REST wouldn't have the ability to show much more than a generic UI, since
there simply isn't much more info to go with.

Mike Amundsen has written an [excellent book](https://www.oreilly.com/library/view/restful-web-clients/9781491921890/) on
how to build a proper, generic hypermedia client.  But what you will see in that book is that creating a good hypermedia 
client isn't trivial, and it is certainly not what *most* engineers build to consume JSON APIs, even if the JSON APIS
have hypermedia-ish controls in their responses.

### In Praise Of Useless Information

As an aside, a criticism of HTML is that it mixes "presentation" information with "semantic" information.  But, it turns 
out, it is exactly that presentation information, and the ability of the web browser to turn it into a UI that a human 
can interact with, that makes HTML work as a component of a larger hypermedia system.

At a practical level, it isn't just hypermedia controls that make a hypermedia system work!

## Building Hypermedia Clients: Hard

So just offering hypermedia controls in a JSON API response isn't enough.  It is *part* of the REST story, but not the
entire story.  And, I have come to understand, not the *hard* part of the story: creating the hypermedia *client* is
the hard part, and creating a *good* hypermedia client is *the really hard part*.

We are all used to Web Browsers just being there, but think about all the technology that goes in to just parsing and
rendering HTML to an end user.  We take it for granted, but it's insane.  And replicating all that over again is also 
insane, which is why we should probably just [use what's already there](https://htmx.org) for a lot of web development.

This is also what makes a technology like [Hyperview](https://hyperview.org/) so impressive.  It doesn't just provide
a specification for a new hypermedia, [HXML](https://hyperview.org/docs/guide_html), but it also provides a hypermedia
*client* that understands HXML.

Without that hypermedia client, Hyperview is just another interesting theoretical hypermedia, like the JSON above, rather
than a compelling, practical hypermedia solution.

## Hypermedia Clients: The Missing Link

It took me a long time to appreciate just how crucial the *client* is to a hypermedia system.  This is perhaps understandable,
since most of the discussion around REST was around [API Design](https://www.martinfowler.com/articles/richardsonMaturityModel.html),
and the client didn't come up much.

What I see now is that a lot of these discussions were putting the cart before the horse: the only way a REST-ful hypermedia
API can be useful is if it is consumed by a proper hypermedia client.  Otherwise, your hypermedia controls are wasted
on what is, at the end of the day, a domain-specific thick client that just wants to get things done.  Further, your
hypermedia API is almost certainly going to have to carry a fair amount of presentation-layer information in it to make
the whole thing usable.

I had a nascent sense of this when I wrote [HATEOAS Is For Humans](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html),
but I didn't, at that time, appreciate just how special the browser was.

REST isn't just about APIs, and, except for a few people like [Mike](https://training.amundsen.com/), we've been largely
ignoring the larger, maybe much larger, part of the REST-ful story:

<div style="text-align:center;padding-top: 24px">

![Iceberg](/img/creating-client.png)

</div>