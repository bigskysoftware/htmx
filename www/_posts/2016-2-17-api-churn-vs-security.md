---
layout: blog_post
nav: blog
title:  The API Churn/Security Trade-off
---

***TLDR***: Heavy client-side logic requires a trade off between API churn or an increasingly complex security
model

## The Problem

A recent article by Jean-Jacques Dubray, [Why I No Longer Use MVC Frameworks](http://www.infoq.com/articles/no-more-mvc-frameworks)
sparked a [long and interesting discussion](https://news.ycombinator.com/item?id=11104356) on HackerNews which crystallized
a fundamental problem I see with the current trend towards heavy client-side logic in web applications.

Here is the start from that article, where Jean-Jacques lays out the problem:

> The worst part of my job these days is designing APIs for front-end developers. The conversation goes inevitably as:<br/><br/>
>
>  **Dev** – "So, this screen has data element x,y,z… could you please create an API with the response format {x: , y:, z: }"<br/><br/>
>
>  **Me** – "Ok"<br/><br/>
>
>  I don’t even argue anymore. Projects end up with a gazillion APIs tied to screens that change often, which, by “design” 
>  require changes in the API and before you know it, you end up with lots of APIs and for each API many form factors and 
>  platform variants.

To summarize: if you are designing network API end points for a front end, you will end up tweaking and modifying the API
to support your UI needs in an ad hoc and often chaotic manner.  By letting something that, by its nature, is constantly
in flux and "fiddly" (that is, the UI) determine the shape of your API, you end up thrashing it around, trying to keep up.

For the remainder of this article, I will refer to this problem as API churn.

## The Solution

The solution to the problem of API churn, if you are committed to the client side, is to increase the expressiveness of
the API available on the client side.  OK, so what does that mean?

That means that you must begin surfacing more and more generalized data access and mutation functionality on the client
side.  You see this with general query languages such at [GraphQL](http://graphql.org/) replacing multiple REST-ish and 
ad hoc API end points with fewer, but more expressive end points.  This can be thought of as a move towards something
like SQL (or whatever your data store's natural query/mutation language is) on the client side.

By increasing the expressive power of endpoints, you, the API designer, no longer need to worry about getting an 
API just right.  Rather, the front end developer has control over how and what is returned, or what is modified, and your
API stays stable as the UI needs change.

Sounds great, right?  Right.

But wait a second&#8230;

## The Problem with the Solution

The problem with these increasingly expressive end points is that you are putting them not just in the hands of your
front end developers, but also in the hands of potentially hostile users.  The browser is about the least secure computing 
environment I can imagine, and anything your front end developer can do, that hostile user can do as well.

Consider the following simple GraphQL query:

    {
      employee(id: 3500401) {
        id,
        name
      }
    }

Perfectly reasonable for any user to issue this query to see the name of a given employee, and your UI developer might
write exactly this code.  

But, what you have given to your developer, you have also given to your users.  So, what if a hostile user figures out the
API (inspecting HTTP requests isn't rocket science after all) and modifies the query to be:

    {
      employee(id: 3500401) {
        id,
        name,
        salary
      }
    }

Ooops.  You had better darn well not show that information to them!

Now, in this case, the only solution is context-sensitive *field level* security.  When processing a query, you have to 
know who is asking, and what, exactly, they are asking for, and you have to maintain that security info per field in your 
domain model.

That, my friends, is complicated.

When I brought the security issue in the comments, [Peter Hunt](https://twitter.com/floydophone) had this to say:

> It doesn't belong in the spec, it belongs in the implementation. But yes, the reference implementation (graphql-js) 
> should probably be updated to demonstrate access control.

I literally laughed out loud when I read this: this is a major, MAJOR issue, and anyone who considers increasing
client-side expressiveness as The Answer™ to the API Churn problem needs to have a very good answer for it!

## Trust

The core problem, again, is that in putting more expressive tools in the hands of your client-side UI developers, you 
are also inadvertently letting them slip into the hands of adversarial users.  There is a fundamental tension, therefore,
between how much you can give your developers and how much of a security headache this power will turn out to be.

In an ideal world you would give your UI developers everything they could possibly need to build their UI efficiently:
an open and expressive query layer that would let them tune the structure and return data of a query just so for those
hot, complicated queries that always end up dominating system performance.

But what if I told you that a place exists where you *can* do this?

Such a place does exist.  

This place is called... *the server side*.

You see, on the server side, *code is trusted*.  You can give your developers a completely open and flexible data access and
update API, because you (to a first order approximation) trust them.  Giving them the power of, say, a Structured 
Query Language, is perfectly acceptable and, in fact, not even controversial, because you aren't *also* giving that
power to the end user.

## The Solution to the Problem with the Solution

So, if you want to avoid this API Churn vs. Security complexity trade off entirely, there is a great way to do it: move
things back to the server side.  One way to do that without sacrificing modern web usability, of course, is to use 
[intercooler.js](http://intercoolerjs.org) and do your HTML rendering and domain logic execution on the server, in a 
trusted environment.

You will also get a lot of other benefits from this approach: [HATEOS without tears](http://intercoolerjs.org/2016/01/18/rescuing-rest.html), 
a programming model that you likely already have close to a decade of experience
with, [and so on](http://intercoolerjs.org/2016/01/01/n-reasons-to-try-intercooler-this-year.html).  Perhaps most 
importantly: it is simple and, since it is simple, you are much more likely to get the hard things, like security, correct.

But even if you aren't buying what I'm selling (for free, because I love you), fine: you still should realize that you 
are going to need to think very hard every time you increase the expressiveness you make available to your client-side
developers.  Someone who *doesn't* love you is getting that functionality too.

Forewarned is forearmed.