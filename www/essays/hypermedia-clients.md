---
layout: layout.njk
title: Hypermedia Clients
---

# Hypermedia Clients

Often, when we are being insufferably pedantic in [discussions about](https://news.ycombinator.com/item?id=32141027) 
[REST](https://htmx.org/essays/how-did-rest-come-to-mean-the-opposite-of-rest/) & [HATEOAS](/essays/hateoas), we will
say something along the lines of this:

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
> See?  No hypermedia controls.  So this JSON isn't a hypermedia, and, therefore, the API returning it isn't REST-ful.

To this, occasionally, a smart and experienced web developer will reply with something along these lines:

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
> There, now there are hypermedia controls in this response (normal humans call them links, btw) so this JSON is a 
> hypermedia and, therefore, this API JSON is now REST-ful.

...

One has to concede that, at least at a high-level, our online opponent has something of a talking point here: these
do appear to be hypermedia controls, and they are, in fact, in a JSON response.  So, couldn't you call this JSON response
REST-ful?  

Being obstinate by nature, we still aren't willing to concede the immediate point without a good 
[ackchyually](https://i.imgur.com/DpQ9YJl.png) or two:

* First, these links hold no information about what HTTP method to use to access them
* Secondly, these links aren't a *native* part of JSON the way that, for example, anchor and form tags are with HTML
* Third, there is a lot of missing information about the hypermedia interactions at each end point (e.g. what data needs to
  go up with the request.)

And so on: the sorts of pedantic points that make technical flame wars on the internet such a special joy.

However, there is a deeper [ackchyually](https://i.imgur.com/DpQ9YJl.png) here, and one that doesn't involve the *JSON API* 
itself, but rather the other side of the wire: the *client* that receives the JSON.

## Hypermedia Clients: Important!

The deeper problem with this proposed fix for non-REST-ful JSON APIs is that, for this JSON response to participate 
properly in a [hypermedia system](https://hypermedia.systems), the *client* that consumes the JSON needs to *also* 
satisfy the [constraints](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) that the 
REST-ful architectural style places on the entire system.

In particular, the client needs to satisfy the [uniform interface](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5),
in which the client code knows nothing about the "shape" or details of the response beyond the ability to display
the given hypermedia to a user.  In particular, the client isn't allowed to have "out of band" knowledge about the domain 
that a particular hypermedia representation, er, represents.

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
A client of this API *could* simply and generically transform this JSON into, say, some HTML, via a client-side templating
language. 

However, note that there isn't a lot of *presentation information* in the JSON response: it is just some raw data about
the account and then some URLs.  A client that wanted to satisfy the uniform interface constraint of REST doesn't have 
much information on how to present this data to a user and would, necessarily, need to adopt a very basic "name/value"
approach to displaying things.  What else could it do?

Now, Mike Amundsen has written an [excellent book](https://www.oreilly.com/library/view/restful-web-clients/9781491921890/) on
how to build a proper, generic hypermedia client.  But what you will see in that book is that creating a good hypermedia 
client isn't trivial, and, further, it is certainly not what *most* engineers would build to consume a JSON API, even if 
the JSON API had hypermedia-ish controls in their responses.

## Inefficient Representations: Good

> The trade-off, though, is that a uniform interface degrades efficiency, since information is transferred in a
> standardized form rather than one which is specific to an application's needs.

_-Roy Fielding, <https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_5>_

A criticism of HTML is that it mixes "presentation" information with "semantic" information.  But, it turns 
out, it is exactly that presentation information, and the ability of the web browser (i.e. the hypermedia client) to 
turn it into a UI that a human can interact with, that makes HTML work so well as a component of the larger hypermedia 
system that is the web.

## Creating Hypermedia Clients: Hard

So just offering hypermedia controls in a JSON API response isn't enough.  It is *part* of the REST story, but not the
entire story.  And, I have come to understand, it is not really the *hard* part of the story.  In fact, creating the 
hypermedia *client* is the hard part, and creating a *good* hypermedia client is *the really hard part*.

We are all used to web browsers just being there, but think for a moment about all the technology that goes in to simply
parsing and rendering HTML to an end user in a normal, every day web request.  It's *extremely* complicated.  

That's why, if we want to build web-based [hypermedia-driven applications](https://htmx.org/essays/hypermedia-driven-applications/), 
we should probably use the browser: it is already an extremely powerful and well tested hypermedia client, and, 
[with a bit of help](https://htmx.org/docs), it can be an even better hypermedia client.

Better for most engineers to build on top of an existing hypermedia client than to try to build their own!

That being said, there are times when building a new hypermedia client is appropriate.  For example, this is what makes 
a technology like [Hyperview](https://hyperview.org/) so impressive and special.  Hyperview
doesn't just provide a specification for a new, mobile-friendly hypermedia, [HXML](https://hyperview.org/docs/guide_html).  

It also provides developers with a hypermedia *client* that understands how to render HXML.

Without that hypermedia client, Hyperview would be just another hypermedia-in-theory, like the JSON above, rather
than a compelling, practical and *complete* REST-ful hypermedia solution.

A hypermedia without a hypermedia client is like a fish without a bicycle, except where the fish is really only good at
bicycling.

## Conclusion

It took me a long time to appreciate how important the *client* is to a proper, REST-ful hypermedia system.  This is understandable,
since most of the early discussion around REST was around [API Design](https://www.martinfowler.com/articles/richardsonMaturityModel.html),
and the client simply didn't come up much.

What I see now is that a lot of these discussions were putting the cart before the horse: the only way a REST-ful hypermedia
API can be useful is if it is consumed by a proper hypermedia client.  Otherwise, your hypermedia controls are wasted
on what is, at the end of the day, a domain-specific thick client that just wants to get things done.  

Further, your hypermedia API is almost certainly going to have to carry a fair amount of presentation-layer information 
in it to make the whole thing usable.  It turns out that "Level 3" of the Richard Maturity Model, Hypermedia Controls,
*isn't* enough.  In practice, you are going to need to add in a bunch of practical presentation-level technology to make 
your hypermedia API really work.

I had a nascent sense of this when I wrote [HATEOAS Is For Humans](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html),
but I didn't, at that time, appreciate just how special the browser was.

REST isn't just about APIs, and, except for a few people like [Mike](https://training.amundsen.com/), we've been largely
ignoring the larger (really, *much* larger) part of the REST story:

<div style="text-align:center;padding-top: 24px">

![Iceberg](/img/creating-client.png)

</div>