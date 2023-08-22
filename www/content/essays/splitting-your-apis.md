+++
title = "Splitting Your Data &amp; Application APIs: Going Further"
date = 2021-09-16
updated = 2022-02-06
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

**TLDR:** If you split your API into Data and Application APIs, [as advocated here](https://max.engineer/server-informed-ui), 
you should consider changing your Application API from JSON to Hypermedia (HTML) & using a *hypermedia-oriented* library like
[htmx](/) to reap the benefits of the hypermedia model (simplicity, reliability, flexibility, etc.)

## The Problem

Recently, [Max Chernyak](https://max.engineer/) wrote an essay entitled 
[Don’t Build A General Purpose API To Power Your Own Front End](https://max.engineer/server-informed-ui).  His
TLDR is this:

> YAGNI, unless you’re working in a big company with federated front-ends or GraphQL.

He then discusses some of the different needs of a general purpose API and your application API.  He lists the 
following as needs for a generic API:

<div style="padding-left:64px">

1. How to predict and enable all possible workflows
1. How to avoid N+1 requests for awkward workflows
1. How to test functionality, performance, and security of every possible request
1. How to change the API without breaking the existing workflows
1. How to prioritize API changes between internal and community requirements
1. How to document everything so that all parties can get stuff done

</div>

And these as application API needs:

<div style="padding-left:64px">

1. How to collect all the data needed to render a page
1. How to optimize requests to multiple endpoints
1. How to avoid using API data fields in unintended ways
1. How to weigh the benefit of new features against the cost of new API requests

</div>

I will term this misalignment of needs the **Data/App API Impedance Mismatch** problem.

Max's recommendation is to split the API into two "halves": a generic API and an application API:

> I suggest you stop treating your frontend as some generic API client, and start treating it as a half of your app.
>
>  Imagine if you could just send it the whole “page” worth of JSON. Make an endpoint for `/page/a` and render the whole JSON for `/page/a` there. 
>  Do this for every page. Don’t force your front-end developers to send a bunch of individual requests to render a complex page. 
>  Stop annoying them with contrived limitations. Align yourselves.

## Right about What's Wrong

I agree entirely with Max on the problem here.  

I would particularly emphasise the fact that the generic API needs to be stable, whereas the application API must change 
rapidly to address application needs.  

Jean-Jacques Dubray, in [this article](https://www.infoq.com/articles/no-more-mvc-frameworks/) relates the following sad state of affairs for
API designers:

> The worst part of my job these days is designing APIs for front-end developers. The conversation goes inevitably as: 
>
>  Dev – So, this screen has data element x,y,z… could you please create an API with the response format {x: , y:, z: }
>
>  Me – Ok

This is a perfect encapsulation of the tension that Max has noticed, where API engineers want to design general, 
stable APIs, but are subject to the whims of a quickly-changing UI with complex data needs that are often best
solved on *the server side*.

As Max points out:

> You can keep “page a” dumb to only do what it needs to do. You test the crap out of “page a” for bugs, security, performance. You can even fetch everything for “page a” in a single big SQL query.

## Wrong about What's Right

So, again, I agree entirely with Max that there is a Data/App API Impedance Mismatch problem and I applaud him for suggesting 
that, rather than bailing out to a solution to like GraphQL, you split the APIs into two.

However, there is a **next step** to take:

Once you have split your application API from your generic data API, *you are no longer bound by the constraints of
 a public data API* and are free to reconsider the *entire form* of that application API.  We can do whatever we'd like with 
 it, so let's get a bit expansive in our thinking.
 
Note that core problems with the application API are rapid change and page (or resource) specific tuning.  It turns out that we
have a very good technology for dealing with *exactly* this problem: [Hypermedia](https://en.wikipedia.org/wiki/Hypermedia)!  

Hypermedia, by way of HATEOAS, makes API churn [much less of a problem](https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html).  When you change the shape of your hypermedia API, well, 
that's fine: the *new* API is simply reflected in the *new* HTML returned by the server.  You can add and modify end points
and, lo and behold (to a first order of approximation) your clients (that is, browsers) don't need to be updated.

The browsers simply see the new HTML, and [the humans driving them react to the new functionality appropriately](https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html).

So, while I feel Max is on the right track, I also think he *doesn't go far enough*: once you have made the mental 
jump to solving the Data/APP API Impedance Mismatch problem by splitting the two into separate concerns, it is only a 
bit further down the road to rediscovering the advantages of hypermedia.

You may object that: "Oh, but hypermedia applications aren't very usable, we don't want to go back to web 1.0."

That is a perfectly reasonable objection, but people have been working on that problem and there are now many libraries 
available that address the usability issues of HTML *within the hypermedia model*.  

Two of my favorites are [unpoly](https://unpoly.com/) and, of course, my own [htmx](/).

## In Conclusion

If you switch to a hypermedia application API (which really just means "use HTML, like you used to") then you get all
of the benefits of the REST-ful web model (simplicity, reliability, etc.) and of server-side rendering in mature web frameworks
(caching, SQL tuning, etc.)
  
And, by choosing a hypermedia-oriented front end technology like htmx, you can create [excellent user experiences](/examples) within 
that model.

Everything old is new again, but, this time, a little bit better.
