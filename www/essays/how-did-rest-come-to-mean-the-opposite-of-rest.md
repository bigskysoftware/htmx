---
layout: layout.njk
tags: posts
title: How Did REST Come To Mean The Opposite of REST?
---

<style>
  pre {
        margin: 32px !important;
  }
</style>

## How Did REST Come To Mean The Opposite of REST?

> I am getting frustrated by the number of people calling any HTTP-based interface a REST API. Today’s example is the
> SocialSite REST API. That is RPC. It screams RPC. There is so much coupling on display that it should be given an 
> X rating.
> 
> What needs to be done to make the REST architectural style clear on the notion that hypertext is a constraint? In 
> other words, if the engine of application state (and hence the API) is not being driven by hypertext, then it cannot 
> be RESTful and cannot be a REST API. Period. Is there some broken manual somewhere that needs to be fixed?
> 
> _--Roy Fielding, Creator of the term REST_
> 
> _&nbsp;&nbsp;&nbsp;[REST APIs must be hypertext-driven](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven)_

<img src="/img/tap-the-sign.png" alt="You are wrong" style="width: 80%;margin-left:10%; margin-top: 16px;margin-bottom: 16px">

##  Tapping The Sign

[REST](https://en.wikipedia.org/wiki/Representational_state_transfer) is perhaps the most broadly misused technical term 
in computer programming history.  

I certainly can't think of anything else that comes close.  

Today, when someone in the industry uses the term REST, they are nearly always discussing a JSON-based API using HTTP.

A job posting mentioning REST or a company discussing [REST Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md) won't mention
hypertext or hypermedia at all: it will be all about JSON, GraphQL (!) and the like.

Only a few old fogeys like me grumble: but these JSON APIs aren't RESTful!  

<iframe src="https://www.youtube.com/embed/HOK6mE7sdvs" title="Doesn't anyone notice this?" 
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        style="width: 400px;height:300px;margin-left:15%;margin-top: 16px;margin-bottom: 16px">
</iframe>

In this post, I'd like to give you a [brief, incomplete and mostly wrong](https://james-iry.blogspot.com/2009/05/brief-incomplete-and-mostly-wrong.html) 
history of REST:

* Where the term REST came from
* The crux concept of REST: the uniform interface
* And, finally, how we got to a place where, when someone says REST, they typically mean _nearly exactly the 
opposite of what Roy Fielding meant when he coined the term_.

##  Where Did REST Come From?

The term REST came from [Chapter 5 of Fielding's PhD Dissertation](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm).
Fielding was describing the network architecture of the web, and contrasting it with other possible network architectures.

It is important to understand that, at the time of his writing (1999-2000), there were no JSON APIs: he was describing 
the web as it existed at that time, with HTML being exchanged over HTTP as people "surfed the web".  JSON hadn't been 
created yet.

REST described a _network architecture_ and was defined in terms of _constraints_ on an API that needed to be met in
order to be considered a RESTful API.

Fielding's dissertation is fairly dense and academic in its language, and his discussions of the topic afterwards are 
also at a high level of abstraction.  I think, unfortunately, this has contributed to some of the confusion 
around REST for "regular" developers.  

### The Crux of REST: The Uniform Interface & HATEOAS

REST has many constraints and concepts within it, as you might expect, but there is one crucial idea that, as far as I 
am concerned, is the defining characteristic of REST when contrasted with other possible network architectures.

This is known as the [uniform interface constraint](https://en.wikipedia.org/wiki/Representational_state_transfer#Uniform_interface),
and more specifically within that concept, the idea of [Hypermedia As The Engine of Application State (HATEOAS)](https://htmx.org/essays/hateoas/) 
or as Fielding prefers to call it, the hypermedia constraint.

To put things as briefly and concretely as possible, consider two HTTP responses returning information about a bank
account, the first HTML (a hypertext) and the second JSON:

#### An HTML Response

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

#### A JSON Response

```http request
HTTP/1.1 200 OK

{
    "account_number": 12345,
    "balance": {
        "currency": "usd",
        "value": 100.00
     },
     "status": "good"
}
```

The crucial conceptual difference between these two responses, and why the _HTML response_ is RESTful, but the 
_JSON response_ is not, is this:

<p style="margin:32px;text-align: center;font-weight: bold">The HTML response is entirely self-describing.</p>

A proper hypermedia client that receives this response does not know what a bank account is or what a 
balance is and so forth: it simply renders the HTML.  It knows nothing about the API end points associated with this
data, _except by the URLs contained within the HTML itself._ If the state of the resource changes such that the allowable
actions available on that resource change (for example, if the account goes into overdraft) then the HTML response would 
simply change to show the new set of actions available.  The client would just renders this new HTML, totally unaware of
the state change.  

It is in this manner that hypertext is the engine of application state.

Now, contrast that with the second JSON response.  In this case the message is _not_ self describing.  Rather the client
must know how to interpret the `status` field and what actions are available on the account based on "out-of-band"
information, that is, information derived from another source such as swagger API documentation. If a given status changes
the allowable actions on the resource, the client must find out about externally, from somewhere else beyond the JSON.  If
a new action is added to the system, again, the client must find out about it externally to the JSON response and be 
updated to allow access to this new action.

The JSON response  is not self-describing and does not encode the state of the resource within a hypermedia.  It therefore 
fails the uniform interface constraint and, more specifically, the hypermedia constraint of REST.

### Inventor: RESTful APIs Must Be Hypermedia Driven!

In [Rest APIs Must Be Hypermedia Driven](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven), Fielding
goes on to say:

> A REST API should be entered with no prior knowledge beyond the initial URI (bookmark) and set of standardized media 
> types that are appropriate for the intended audience (i.e., expected to be understood by any client that might use the
> API). From that point on, all application state transitions must be driven by client selection of server-provided 
> choices that are present in the received representations or implied by the user’s manipulation of those representations.

Again, Fielding uses some pretty technical and academic language.  Translating into normie: in a RESTful system, you 
should be able to enter the system through a single URL and, from that point on, all navigation and actions you do within
the system should be entirely provided through self-describing hypermedia: links and forms in HTML.  Beyond that entry
point, the client (that is, the browser) doesn't need any additional information about your API.

This is the core source of incredible flexibility of RESTful systems:  since all responses are self describing and
encode all the currently available actions available there is no need to worry about, for example, versioning your API!  
In fact, you don't even need to document it.  All end points are provided through self-contained hypermedia.  If things 
change, the hypermedia responses change, and that's it.

It's an incredibly flexible and innovative concept for building distributed systems.

### Industry: Lol, No, RESTful APIs Must Be JSON

Now, today, most web developers and most companies would call the _second example_ a RESTful API.  

They probably wouldn't even regard the first response _as an API response_.  It's just HTML.  

Poor HTML.  Can't get no respect.

APIs are JSON and JSON is APIs, right?  

<img src="/img/you-are-wrong.png" alt="You are wrong" style="width: 80%;margin-left:10%; margin-top: 16px;margin-bottom: 16px">

Wrong.  

You are all wrong and you should feel bad.

The first response is, in fact, and API response, just one that is so familiar that you probably don't think of it
as such.

And the second response is, in fact, a _Remote Procedure Call_ (RPC) style of API.  The client and the server are coupled, 
just like the SocialSite API Fielding complained about back in 2008: a client needs to have additional knowledge about 
the resource it is working with that must be derived from some other source beyond the JSON response itself. 

Now REST is a pretty catchy name, which is one reason why it has stuck around in the JSON API world despite increaslingly
not making any sense.  So we are going to need to come up with a catchy name for this RPC style of API beyond just "RPC", 
which sounds pretty nerdy, and 1990s.

Let's call this API style a Web Oriented RpC response, or WORC.  

Pronounced "work".

The JSON response is WORC-ful, the HTML response is RESTful.

## So, How Did REST come to mean WORC

Now, how on earth did we get to a spot where APIs that are _obviously_ not RESTful are called RESTful by 99.9% of the
industry?

Funny story.

Roy Fielding published his dissertation in 2000.

Around the same time, [XML-RPC](https://en.wikipedia.org/wiki/XML-RPC), an explicitly RPC-inspired protocol was released
and started to gather steam as a method to integrate systems of HTTP.  XML-RPC was part of a larger project called 
[SOAP](https://en.wikipedia.org/wiki/SOAP), from Microsoft.  XML-RPC came out of a larger tradition of RPC-style
protocols, mainly from the enterprise world, with a lot of static typing and early XML-maximalism thrown in as well.

Also coming along at this moment was [AJAX](https://en.wikipedia.org/wiki/Ajax_(programming)), or Asynchronous
JavaScript and XML.  Note well the XML here.  AJAX, as everyone now knows, allows browsers to issue HTTP requests
to the server in the background and process the response directly in JavaScript, opening up a whole new world of
programming for the web.  

The question was: what should those requests look like.  They were obviously going to be XML.  Look, it's right there
in the name.  And this new SOAP/XML-RPC standard was out, maybe that was the right thing?

### Maybe REST can work for Web Services?

Some people noticed that the web had this different sort of architecture that Fielding had described, and began to discuss
if REST, rather than SOAP, should be the preferred mechanism for accessing what were coming to be called "Web Services".
The web was proving to be extremely flexible and growing gang busters, so maybe the same network architecture, REST, that
was working so well for browsers & humans would work well for APIs.

It sounded plausible, especially when XML was the format for APIs: XML sure _looks_ an awful lot like HTML, doesn't it?  
You can imagine an XML API satisfying all of the RESTful constraints, up to and including the hypermedia constraint.  

So people began exploring this route as well.

While all this was happening, another important technology was being born: [JSON](https://www.json.org/json-en.html)

JSON was JavaScript (in some ways, literally) to SOAP/RPC-XML's Java: simple, dynamic and easy.  It's hard to believe now,
where JSON is the dominant format for most web APIs, but it actually took a while for JSON to win.  As late as 2008, 
discussions around API development were mainly around XML, not JSON.

### Formalizing REST APIs

In 2008, Martin Fowler published an article popularizing the [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html),
a model to determine how RESTful a given API was.  The model proposed four "levels", with the first level being Plain
Old XML, or The Swamp of POX.  (Today, with JSON dominant, it would be updated to The Swamp of POJ.)

<img src="/img/rmm.png" alt="Richardson Maturity Model" style="width: 80%;margin-left:10%; margin-top: 16px;margin-bottom: 16px">

From there, an API could be considered more "mature" as a REST API as it adopted the following ideas:

* Level 1: Resources (e.g. a resource-aware URL layout, contrasted with an opaque URL layout as in XML-RPC)
* Level 2: HTTP Verbs (using `GET`, `POST`, `DELETE`, etc. properly)
* Level 3: Hypermedia Controls

Level 3 is where the uniform interface comes in, which is why this level is considered the most mature and truly "The 
Glory of REST"

### "REST" Wins, Kinda...

Unfortunately for the term REST, two things happened around this time: 

* Everyone switched to JSON
* Everyone stopped at Level 2 of the RMM

JSON rapidly took over web services because XML-RPC was so insane and "enterprisey".  

JSON was easy, "just worked" and was easy to read and understand. With this liberating change, the industry threw off the
shackles of the [J2EE](https://en.wikipedia.org/wiki/Jakarta_EE) mindset and just sent it.

Since the REST approach wasn't as tied to XML as SOAP was, and since it didn't impose as much formality on end point, it was 
the natural place for JSON to take over.  And it did so, rapidly.  However, during this crucial change, someting became
increasingly clear: most APIs were stopping at Level 2 of the RMM.  Some pushed through to Level 3 by incorporating 
hypermedia controls in their responses, but nearly all these APIs still needed to publish documentation, a strong indication
that the "Glory of REST" was not being achieved.

JSON taking over as the response format should have been a strong hint as well: JSON is not a hypertext.  You can impose
hypermedia controls on top of it, but it isn't natural.  XML at least _looked_ like HTML kinda, so it was plausible that
you could create a hypermedia with it.  JSON was just... data.  Once the industry flipped to JSON as a response format
there should have been a Real Big Think about the whole thing, but there wasn't.

REST was the opposite of SOAP, and JSON APIs weren't SOAP, therefore JSON APIs were REST.

That's the summary version of how we got here.

### The REST Wars

Along the way, however, there *were* a lot of fights about RESTful APIs.  Many of these fights were, in my mind and 
with the benefit of hindsight, pointless and distractions: arguments over URL layouts, which HTTP verb was appropriate
for a given action, flame wars about media types, and so forth.  I was young at the time and it struck me as puritanical
and alienating, and I pretty much gave up on the whole idea of REST: it was something condescending people fought about
on the internet.

What I rarely saw (or, when I did, I didn't understand) was the concept of the uniform interface and how crucial the
hypermedia constraint is to a RESTful system.  I didn't really understand the whole idea until I created 
[intercooler.js](https://intercoolerjs.org) and smart folks started telling me that it was RESTful.  

RESTful?  

That's a JSON API thing, how can my hack of a jQuery library be RESTful?

So I looked into it, reread Fielding's dissertation, and discovered, lo and behold, not only was intercooler RESTful, 
but all the JSON APIs I was dealing with weren't RESTful at all!

And, with that, I began boring the internet to tears:

* [Rescuing REST From the API Winter](https://intercoolerjs.org/2016/01/18/rescuing-rest.html)
* [The API Churn/Security Trade-off](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html)
* [HATEOAS is for Humans](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html)
* [Taking HTML Seriously](https://intercoolerjs.org/2020/01/14/taking-html-seriously)
* [Hypermedia APIs vs. Data APIs](https://htmx.org/essays/hypermedia-apis-vs-data-apis/)
* [HATEOAS](https://htmx.org/essays/hateoas/)
* [Hypermedia Driven Applications](https://htmx.org/essays/hypermedia-driven-applications/)
* This, gentle reader, [your current article](/essays/how-did-rest-come-to-mean-the-opposite-of-rest).

### The State of REST Today

Eventually most people got tired of trying to add hypermedia controls to JSON APIs.  While they worked well in certain
specialized situations, they never achieved the broad, obvious utility that REST found in the general, human-oriented 
internet.  [(I have a theory why that is.)](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html)

Things chugged along for a while, with REST increasingly coming to mean Level 1 or 2 of the RMM + JSON, which I would
call WORC rather than REST.

Then Single Page Applications (SPAs) hit.

When SPAs hit, web development became disconnected entirely from its underlying RESTful architecture.  The *entire
networking model* of the application moved over to WORC, and increasingly developers specialized into front end
and back end developers.  The front end developers were obviously _not_ doing anything RESTful: they were working
with JavaScript and building DOM object, they just called AJAX APIs when needed.  

It was the back end engineers that were still concerned with the network architecture and they continued to use the
term REST to describe what they were doing.

Publishing swagger documentation for their RESTful API.  

[Complaining about API churn on their RESTful API](https://www.infoq.com/articles/no-more-mvc-frameworks/).  

etc. etc. et-haha-cetera.

Finally, in the late 2010s, people had had enough:  REST, even in its WORC form, simply wasn't keep up with the needs
of increasingly complex SPA applications.  The applications themselves were becoming more and more like thick clients,
and thick client problems need thick client solutions.  The dam really broke when [GraphQL](https://en.wikipedia.org/wiki/GraphQL)
was released.

GraphQL couldn't be less RESTful: you absolutely *have to have* documentation to understand how to work with an API
that uses GraphQL.  And that's OK!  People really, really like GraphQL in many cases.

But it isn't REST, it doesn't claim to be REST, it doesn't want to be REST.  Finally, at least part of the industry is
starting to break out of the "REST == JSON API" mindset and exploring other conceptual models that make sense for
building modern SPAs with.

But, as of today, the vast majority of developers and companies operate in the "REST == JSON API" mindset, to the point
that they will call GraphQL-powered end points a "REST API" despite it being explicitly, joyously, gloriously non-RESTful.

## OK, What Can We Do About It?

Laugh, mostly.  

The industry isn't going to change.  

It's going to keep calling _obviously_ non-RESTful JSON APIs REST because that's just what everyone calls them now.

I can tap the sign as much as I want, but 50 years from now Global Omni Corp. will still be advertising jobs for working
on their RESTful JSON API's swagger documentation.

<img src="/img/punished-fielding.png" alt="Roy Fielding Does Not Approve" style="width: 80%;margin-left:10%; margin-top: 16px;margin-bottom: 16px">

[The situation is hopeless, but not serious.](https://wwnorton.com/books/9780393310214)

Regardless, there is an opportunity here to explain REST and, in particular, the uniform interface to a new generation of web
developers who may have never heard of those concepts in their original context, and who assume REST === JSON APIs.  

[People sense something is wrong](https://htmx.org/essays/a-response-to-rich-harris/), and maybe REST, real, actual REST, 
not WORC, could be a part of [the answer to that](/essays/spa-alternative).

At the very least, the ideas behind REST are interesting and worth knowing just as general software engineering knowledge.

There is a larger meta-point here too: even a relatively smart group of people (early web developers), with the benefit 
of the internet, and with a pretty clear (if at times academic) specification for the term REST, were unable to keep the
meaning consistent with its original meaning over period of two decades.

If we can get this so obviously wrong, [what else could we be wrong about](https://htmx.org/essays/spa-alternative/)?